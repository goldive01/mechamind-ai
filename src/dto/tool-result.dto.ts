import { z } from "zod";

export const toolNameSchema = z.enum(["searchAssets", "getAssetHealth", "compareAssets", "createMaintenance", "generateInspectionReport", "calculateHealth"]);
export type ToolName = z.infer<typeof toolNameSchema>;

export const toolResultDtoSchema = z.discriminatedUnion("status", [
  z.object({ tool: toolNameSchema, status: z.literal("success"), data: z.unknown(), message: z.string() }),
  z.object({ tool: toolNameSchema, status: z.literal("confirmation_required"), confirmationToken: z.string(), expiresAt: z.string(), message: z.string() }),
  z.object({ tool: toolNameSchema, status: z.literal("forbidden"), message: z.string() }),
  z.object({ tool: toolNameSchema, status: z.literal("invalid"), message: z.string(), issues: z.array(z.object({ path: z.string(), message: z.string() })) }),
  z.object({ tool: toolNameSchema, status: z.literal("error"), message: z.string() }),
]);
export type ToolResultDto = z.infer<typeof toolResultDtoSchema>;

