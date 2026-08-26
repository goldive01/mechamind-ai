import { z } from "zod";
import { deliveryModeSchema, notificationChannelSchema } from "@/dto/notification.dto";

export const escalationSchema = z.object({
  severity: z.enum(["Critical", "High", "Medium", "Low"]), initialMode: deliveryModeSchema,
  initialChannels: z.array(notificationChannelSchema), escalateAfterMinutes: z.number().int().positive().nullable(), escalationChannels: z.array(notificationChannelSchema),
});
export type EscalationDto = z.infer<typeof escalationSchema>;
