import { z } from "zod";

export const analysisDtoSchema = z.object({
  equipmentName: z.string(), manufacturer: z.string(), category: z.string(), confidence: z.number().min(0).max(1), summary: z.string(),
  detectedComponents: z.array(z.string()), safetyHazards: z.array(z.string()), possibleFaults: z.array(z.string()),
  maintenanceRecommendations: z.array(z.string()), estimatedCondition: z.string(),
});
export type AnalysisDto = z.infer<typeof analysisDtoSchema>;

