import { z } from "zod";
import { toolNameSchema } from "@/dto/tool-result.dto";

export const copilotResponseSchema = z.object({
  answer: z.string().trim().min(1),
  severity: z.enum(["informational", "low", "medium", "high", "critical"]),
  recommendations: z.array(z.string().trim().min(1)).max(8),
  evidence: z.array(z.object({
    assetId: z.string().trim().min(1),
    source: z.enum(["asset", "equipment", "inspection", "ai_report", "maintenance", "sensor", "health", "alert"]),
    detail: z.string().trim().min(1),
  })).max(12),
  followUpQuestions: z.array(z.string().trim().min(1)).max(4),
  toolCalls: z.array(z.preprocess((value) => {
    if (!value || typeof value !== "object" || !("argumentsJson" in value) || typeof value.argumentsJson !== "string") return value;
    try { return { ...value, arguments: JSON.parse(value.argumentsJson) }; } catch { return value; }
  }, z.object({ id: z.string().trim().min(1), name: toolNameSchema, arguments: z.record(z.string(), z.unknown()) }))).max(6).default([]),
});

export type CopilotResponse = z.infer<typeof copilotResponseSchema>;

export class ResponseParser {
  parse(value: string | unknown): CopilotResponse {
    const candidate: unknown = typeof value === "string" ? JSON.parse(value) : value;
    return copilotResponseSchema.parse(candidate);
  }
}
