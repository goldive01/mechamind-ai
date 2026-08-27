import { z } from "zod";

export const scanResultSchema = z.object({ value: z.string().trim().min(1).max(512), format: z.string().trim().min(1).max(40).default("unknown"), scannedAt: z.date().default(() => new Date()) });
export const geoPositionSchema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), accuracy: z.number().nonnegative().nullable().default(null), capturedAt: z.date().default(() => new Date()) });
export const voiceNoteSchema = z.object({ workOrderId: z.string().min(1), mimeType: z.string().min(1).max(100), durationMs: z.number().int().positive().max(60 * 60_000), size: z.number().int().positive().max(25 * 1024 * 1024), localUri: z.string().min(1).max(2048) });
export const digitalSignatureInputSchema = z.object({ workOrderId: z.string().min(1), signerName: z.string().trim().min(2).max(120), signatureData: z.string().startsWith("data:image/png;base64,").max(500_000), latitude: z.number().min(-90).max(90).nullable().optional(), longitude: z.number().min(-180).max(180).nullable().optional() }).refine((value) => (value.latitude == null) === (value.longitude == null), { message: "Latitude and longitude must be supplied together.", path: ["latitude"] });
export const evidenceInputSchema = z.object({ workOrderId: z.string().min(1), type: z.enum(["Photo", "Voice Note", "Location"]), uri: z.string().max(2048).nullable().optional(), note: z.string().trim().max(2000).nullable().optional(), latitude: z.number().min(-90).max(90).nullable().optional(), longitude: z.number().min(-180).max(180).nullable().optional() });
export const syncEntitySchema = z.enum(["WorkOrder", "Inspection", "Photo", "VoiceNote", "GPS", "DigitalSignature", "Asset"]);
const persistentPayloadSchema = z.unknown().superRefine((payload, context) => {
  if (payload === undefined) {
    context.addIssue({ code: "custom", message: "Synchronization payload is required." });
    return;
  }
  try {
    if (JSON.stringify(payload) === undefined) context.addIssue({ code: "custom", message: "Synchronization payload must be JSON serializable." });
  } catch {
    context.addIssue({ code: "custom", message: "Synchronization payload must be JSON serializable." });
  }
});
export const syncOperationInputSchema = z.object({ entity: syncEntitySchema, entityId: z.string().trim().min(1).max(200), action: z.enum(["Create", "Update"]), payload: persistentPayloadSchema, baseVersion: z.iso.datetime().nullable().optional() });
export const manualRetrySchema = z.object({ operationId: z.string().min(1) });
export const syncTransportResultSchema = z.discriminatedUnion("status", [z.object({ status: z.literal("Applied"), remoteVersion: z.string().nullable().optional() }), z.object({ status: z.literal("Conflict"), remotePayload: z.unknown(), remoteVersion: z.string().nullable().optional() })]);
export type ScanResultDto = z.infer<typeof scanResultSchema>;
export type GeoPositionDto = z.infer<typeof geoPositionSchema>;
export type VoiceNoteDto = z.infer<typeof voiceNoteSchema>;
export type DigitalSignatureInputDto = z.infer<typeof digitalSignatureInputSchema>;
export type EvidenceInputDto = z.infer<typeof evidenceInputSchema>;
export type SyncOperationInputDto = z.infer<typeof syncOperationInputSchema>;
export type SyncTransportResultDto = z.infer<typeof syncTransportResultSchema>;
