import { z } from "zod";

const severitySchema = z.enum(["Critical", "High", "Medium", "Low"]);
const categorySchema = z.enum(["Engineering", "Sensor Telemetry", "Predictive Health", "Maintenance", "Safety"]);
const statusSchema = z.enum(["Open", "Acknowledged", "Resolved"]);
const sourceSchema = z.enum(["Sensor", "Health", "Inspection", "AI Report"]);

export const createAlertSchema = z.object({
  assetId: z.string().trim().min(1),
  severity: severitySchema,
  category: categorySchema,
  source: sourceSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  recommendation: z.string().trim().min(1).max(5000),
});
export type CreateAlertDto = z.infer<typeof createAlertSchema>;

export const updateAlertSchema = createAlertSchema.omit({ assetId: true }).partial().extend({ status: statusSchema.optional() });
export type UpdateAlertDto = z.infer<typeof updateAlertSchema>;

export interface AlertResponseDto {
  id: string;
  assetId: string;
  severity: z.infer<typeof severitySchema>;
  category: z.infer<typeof categorySchema>;
  source: z.infer<typeof sourceSchema>;
  title: string;
  description: string;
  recommendation: string;
  status: z.infer<typeof statusSchema>;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const alertListQuerySchema = z.object({
  severity: severitySchema.optional(), status: statusSchema.optional(),
  assetId: z.string().trim().optional(), category: categorySchema.optional(), search: z.string().trim().max(200).optional(), sort: z.enum(["newest", "oldest", "severity", "asset"]).default("newest"),
});
export type AlertListQueryDto = z.infer<typeof alertListQuerySchema>;
export const alertActionSchema = z.object({ alertId: z.string().trim().min(1), actor: z.string().trim().min(1).max(100).default("Operations Team"), note: z.string().trim().max(1000).optional() });
