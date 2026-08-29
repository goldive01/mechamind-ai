import type { AlertCategory, AlertFinding, AlertSeverity } from "@/domain/entities/Alert";
import { recommendationSchema, serializeRecommendation, type RecommendationDto } from "@/dto/recommendation.dto";
import { createLogger } from "@/infrastructure/logging/Logger";
import { EngineeringRuleEngine } from "@/services/EngineeringRuleEngine";

export interface RecommendationEnhancer { enhance(finding: AlertFinding, deterministic: RecommendationDto): Promise<RecommendationDto>; }
export interface RecommendationInventoryAdvisor { recommend(requiredTools: string[]): Promise<Array<{ partNumber: string; name: string; availableQuantity: number; warehouseName: string | null; shelf: string | null; suggestedOrderQuantity: number; supplierName: string | null; repairReadiness: string; reason: string }>>; }
interface ResponsesPayload { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }

export class OpenAIRecommendationEnhancer implements RecommendationEnhancer {
  async enhance(finding: AlertFinding, deterministic: RecommendationDto) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return deterministic;
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(5_000), body: JSON.stringify({ model: process.env.OPENAI_ALERT_MODEL ?? "gpt-4.1-mini", input: [{ role: "system", content: "Enhance the supplied deterministic industrial recommendation. Return only JSON with exactly the same fields and types. Preserve measured evidence; do not invent facts or weaken safety warnings or priority." }, { role: "user", content: JSON.stringify({ finding, deterministic }) }], max_output_tokens: 800 }) });
    if (!response.ok) throw new Error(`OpenAI recommendation request failed with ${response.status}.`);
    const payload = await response.json() as ResponsesPayload;
    const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text;
    if (!text) throw new Error("OpenAI recommendation response was empty.");
    return recommendationSchema.parse(JSON.parse(text));
  }
}

export class RecommendationEngine {
  private readonly logger = createLogger("RecommendationEngine");
  constructor(private readonly rules = new EngineeringRuleEngine(), private readonly enhancer?: RecommendationEnhancer, private readonly inventory?: RecommendationInventoryAdvisor) {}
  async generate(finding: AlertFinding): Promise<RecommendationDto> {
    const deterministic = this.rules.evaluate(finding);
    let recommendation = deterministic;
    if (this.enhancer) try { recommendation = await this.enhancer.enhance(finding, deterministic); }
    catch (error) { this.logger.warn("AI recommendation unavailable; using deterministic rules", { error: error instanceof Error ? error.message : error }); }
    if (this.inventory) try { recommendation = recommendationSchema.parse({ ...recommendation, spareParts: await this.inventory.recommend([...recommendation.requiredTools, ...recommendation.actions, recommendation.rootCause]) }); }
    catch (error) { this.logger.warn("Inventory recommendation unavailable", { error: error instanceof Error ? error.message : error }); }
    return recommendation;
  }
  recommend(finding: AlertFinding): string;
  recommend(severity: AlertSeverity, category: AlertCategory, health: number): string;
  recommend(input: AlertFinding | AlertSeverity, category?: AlertCategory, health?: number) {
    if (typeof input !== "string") return serializeRecommendation(this.rules.evaluate(input));
    const action = input === "Critical" ? "Immediately isolate the asset and arrange an engineering inspection" : input === "High" ? "Restrict operation and schedule an urgent engineering inspection" : input === "Medium" ? "Schedule a condition-based engineering inspection" : "Monitor the condition and review it at the next planned inspection";
    const condition = (health ?? 100) < 40 ? " The asset health is poor; complete a root-cause assessment before return to service." : (health ?? 100) < 70 ? " Review recent telemetry and maintenance history." : " Continue trending asset health after the action.";
    return `${action} for the ${(category ?? "Engineering").toLowerCase()} alert.${condition}`;
  }
  explain(finding: AlertFinding) { return `${finding.title}: observed ${finding.observedValue}, crossing the ${finding.severity.toLowerCase()} rule threshold of ${finding.thresholdValue}.`; }
}
