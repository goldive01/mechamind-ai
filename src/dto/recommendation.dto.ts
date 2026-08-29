import { z } from "zod";

export const recommendationPrioritySchema = z.enum(["Immediate", "Urgent", "Planned", "Monitor"]);
export const recommendationSchema = z.object({
  rootCause: z.string().trim().min(1).max(1000), confidence: z.number().min(0).max(1), priority: recommendationPrioritySchema,
  evidence: z.array(z.string().trim().min(1).max(500)).min(1), actions: z.array(z.string().trim().min(1).max(500)).min(1),
  requiredTools: z.array(z.string().trim().min(1).max(200)), requiredSkills: z.array(z.string().trim().min(1).max(200)),
  estimatedDowntime: z.string().trim().min(1).max(200), safetyWarnings: z.array(z.string().trim().min(1).max(500)), followUpInspection: z.string().trim().min(1).max(500),
  spareParts: z.array(z.object({ partNumber: z.string().min(1), name: z.string().min(1), availableQuantity: z.number().int().nonnegative(), warehouseName: z.string().nullable(), shelf: z.string().nullable(), suggestedOrderQuantity: z.number().int().nonnegative(), supplierName: z.string().nullable(), repairReadiness: z.string().min(1), reason: z.string().min(1) })).optional(),
});
export type RecommendationDto = z.infer<typeof recommendationSchema>;
export function serializeRecommendation(recommendation: RecommendationDto) { return JSON.stringify(recommendationSchema.parse(recommendation)); }
export function parseRecommendation(value: string): RecommendationDto | null { try { return recommendationSchema.safeParse(JSON.parse(value)).data ?? null; } catch { return null; } }
export function recommendationSummary(value: string) { const recommendation = parseRecommendation(value); return recommendation ? `${recommendation.rootCause} ${recommendation.actions[0]}` : value; }
