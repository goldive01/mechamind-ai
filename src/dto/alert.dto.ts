import { z } from "zod";

export const alertListQuerySchema = z.object({
  severity: z.enum(["Critical", "High", "Medium", "Low"]).optional(), status: z.enum(["Open", "Acknowledged", "Resolved"]).optional(),
  assetId: z.string().trim().optional(), category: z.string().trim().optional(), search: z.string().trim().max(200).optional(), sort: z.enum(["newest", "oldest", "severity", "asset"]).default("newest"),
});
export type AlertListQueryDto = z.infer<typeof alertListQuerySchema>;
export const alertActionSchema = z.object({ alertId: z.string().trim().min(1), actor: z.string().trim().min(1).max(100).default("Operations Team"), note: z.string().trim().max(1000).optional() });
