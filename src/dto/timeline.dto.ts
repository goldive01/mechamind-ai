import { z } from "zod";

export const timelineEventTypeSchema = z.enum(["Inspection", "Sensor Reading", "Health", "Alert", "Recommendation", "Maintenance"]);
export const timelineEventSchema = z.object({
  id: z.string().min(1), type: timelineEventTypeSchema, occurredAt: z.date(), title: z.string().min(1), summary: z.string().min(1),
  severity: z.enum(["Critical", "High", "Medium", "Low"]).nullable(), metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});
export const assetTimelineSchema = z.object({
  assetId: z.string().min(1), assetName: z.string().min(1), generatedAt: z.date(), trendExplanation: z.string().min(1), aiSummary: z.string().min(1), events: z.array(timelineEventSchema),
});
export type TimelineEventDto = z.infer<typeof timelineEventSchema>;
export type AssetTimelineDto = z.infer<typeof assetTimelineSchema>;
