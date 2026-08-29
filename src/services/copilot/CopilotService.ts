import "server-only";

import { ContextBuilder } from "@/services/copilot/ContextBuilder";
import { PromptBuilder } from "@/services/copilot/PromptBuilder";
import { ResponseParser, type CopilotResponse } from "@/services/copilot/ResponseParser";
import type { CopilotAssetContext, CopilotMemoryContext, CopilotMessage } from "@/services/copilot/types";
import type { MemoryEngine } from "@/services/MemoryEngine";
import { createLogger } from "@/infrastructure/logging/Logger";

interface ResponsesApiPayload {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
}

const outputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: { type: "string" },
    severity: { type: "string", enum: ["informational", "low", "medium", "high", "critical"] },
    recommendations: { type: "array", items: { type: "string" }, maxItems: 8 },
    evidence: { type: "array", maxItems: 12, items: { type: "object", additionalProperties: false, properties: { assetId: { type: "string" }, source: { type: "string", enum: ["asset", "equipment", "inspection", "ai_report", "maintenance", "sensor", "health", "alert", "memory"] }, detail: { type: "string" } }, required: ["assetId", "source", "detail"] } },
    followUpQuestions: { type: "array", items: { type: "string" }, maxItems: 4 },
    toolCalls: { type: "array", maxItems: 6, items: { type: "object", additionalProperties: false, properties: { id: { type: "string" }, name: { type: "string", enum: ["searchAssets", "getAssetHealth", "compareAssets", "createMaintenance", "generateInspectionReport", "calculateHealth"] }, argumentsJson: { type: "string" } }, required: ["id", "name", "argumentsJson"] } },
  },
  required: ["answer", "severity", "recommendations", "evidence", "followUpQuestions", "toolCalls"],
} as const;
const logger = createLogger("CopilotService");

export class CopilotConfigurationError extends Error {}
export class CopilotProviderError extends Error {}

export class CopilotService {
  constructor(
    private readonly contextBuilder: ContextBuilder,
    private readonly promptBuilder = new PromptBuilder(),
    private readonly responseParser = new ResponseParser(),
    private readonly memoryEngine?: MemoryEngine,
  ) {}

  async chat(messages: CopilotMessage[], assetIds: string[], access?: CopilotAssetContext["access"]): Promise<CopilotResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new CopilotConfigurationError("OPENAI_API_KEY is not configured.");
    const context = await this.contextBuilder.build(assetIds, access);
    const latestRequest = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const recalled = access?.organisationId && this.memoryEngine ? await this.memoryEngine.recall({ organisationId: access.organisationId, query: latestRequest, assetIds, limit: 8 }) : [];
    const memories: CopilotMemoryContext[] = recalled.map((memory) => ({ id: memory.id, citation: `[Memory:${memory.id}]`, sourceType: memory.sourceType, sourceId: memory.sourceId, assetId: memory.assetId, title: memory.title, summary: memory.summary, occurredAt: memory.occurredAt.toISOString(), confidence: memory.confidence, rank: memory.rank, successful: memory.successful, ranking: memory.ranking }));
    const prompt = this.promptBuilder.build(messages, context, memories);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_COPILOT_MODEL ?? "gpt-5.6-sol",
        input: [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }],
        text: { format: { type: "json_schema", name: "engineering_copilot_response", strict: true, schema: outputSchema } },
        max_output_tokens: 1800,
      }),
    });
    if (!response.ok) {
      const providerMessage = await response.text();
      logger.error("Provider request failed", new Error(providerMessage), { status: response.status });
      throw new CopilotProviderError(`Copilot provider returned HTTP ${response.status}.`);
    }
    const payload = (await response.json()) as ResponsesApiPayload;
    const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((content) => content.text)?.text;
    if (!text) throw new CopilotProviderError("Copilot provider returned no output.");
    return this.responseParser.parse(text);
  }
}
