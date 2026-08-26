import type { AlertFinding } from "@/domain/entities/Alert";
import { createLogger } from "@/infrastructure/logging/Logger";
import { RecommendationEngine } from "@/services/RecommendationEngine";

interface ExplanationPayload { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }
export interface AlertExplainer { explain(finding: AlertFinding): Promise<string> }

export class AIAlertExplanationService implements AlertExplainer {
  private readonly logger = createLogger("AIAlertExplanationService");
  constructor(private readonly recommendations = new RecommendationEngine()) {}
  async explain(finding: AlertFinding) {
    const fallback = this.recommendations.explain(finding);
    const apiKey = process.env.OPENAI_API_KEY; if (!apiKey) return fallback;
    try {
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(5_000), body: JSON.stringify({ model: process.env.OPENAI_ALERT_MODEL ?? "gpt-4.1-mini", input: [{ role: "system", content: "Explain industrial monitoring alerts in one concise factual sentence. Do not invent causes or measurements." }, { role: "user", content: JSON.stringify(finding) }], max_output_tokens: 120 }) });
      if (!response.ok) return fallback;
      const payload = await response.json() as ExplanationPayload;
      return payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text ?? fallback;
    } catch (error) { this.logger.warn("AI explanation unavailable; using deterministic fallback", { error: error instanceof Error ? error.message : error }); return fallback; }
  }
}
