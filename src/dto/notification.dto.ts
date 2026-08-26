import { z } from "zod";

export const notificationChannelSchema = z.enum(["Email", "Push", "SMS", "Teams", "Slack", "Webhook", "Log"]);
export const deliveryModeSchema = z.enum(["Immediate", "Escalation", "Daily Summary", "Log Only"]);
export const notificationSchema = z.object({
  id: z.string().min(1), alertId: z.string().min(1), assetId: z.string().min(1), severity: z.enum(["Critical", "High", "Medium", "Low"]),
  channel: notificationChannelSchema, mode: deliveryModeSchema, subject: z.string().min(1), message: z.string().min(1), scheduledAt: z.date(), createdAt: z.date(),
});
export type NotificationDto = z.infer<typeof notificationSchema>;
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
