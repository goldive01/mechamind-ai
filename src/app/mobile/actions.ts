"use server";

import { revalidatePath } from "next/cache";
import { digitalSignatureInputSchema, geoPositionSchema, manualRetrySchema, voiceNoteSchema } from "@/dto/field-mobile.dto";
import { requireDashboardPermission } from "@/lib/auth-session";
import { createMobileFieldService } from "@/services/mobile/mobileFactory";
import { createPersistentSyncQueue, createSyncEngine } from "@/services/mobile/syncFactory";

const authorize = () => requireDashboardPermission("dashboard:write");
const refresh = (id: string) => { revalidatePath("/mobile"); revalidatePath("/mobile/work-orders"); revalidatePath(`/mobile/work-orders/${id}`); };
export async function saveMobileSignature(formData: FormData) { await authorize(); const input = digitalSignatureInputSchema.parse({ workOrderId: formData.get("workOrderId"), signerName: formData.get("signerName"), signatureData: formData.get("signatureData"), latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null, longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null }); const saved = await createMobileFieldService().sign(input); await createPersistentSyncQueue().enqueue({ entity: "DigitalSignature", entityId: saved.id, action: "Create", payload: saved }); refresh(input.workOrderId); }
export async function uploadMobilePhoto(formData: FormData) { await authorize(); const workOrderId = String(formData.get("workOrderId") ?? ""); const saved = await createMobileFieldService().capturePhoto(workOrderId, formData.get("photo") as File, String(formData.get("note") ?? "")); await createPersistentSyncQueue().enqueue({ entity: "Photo", entityId: saved.id, action: "Create", payload: saved }); refresh(workOrderId); }
export async function saveMobileLocation(formData: FormData) { await authorize(); const workOrderId = String(formData.get("workOrderId") ?? ""); const position = geoPositionSchema.parse({ latitude: Number(formData.get("latitude")), longitude: Number(formData.get("longitude")), accuracy: formData.get("accuracy") ? Number(formData.get("accuracy")) : null }); const saved = await createMobileFieldService().captureLocation(workOrderId, position); await createPersistentSyncQueue().enqueue({ entity: "GPS", entityId: saved.id, action: "Create", payload: saved }); refresh(workOrderId); }
export async function queueVoiceNoteSync(formData: FormData) { await authorize(); const note = voiceNoteSchema.parse({ workOrderId: formData.get("workOrderId"), mimeType: formData.get("mimeType"), durationMs: Number(formData.get("durationMs")), size: Number(formData.get("size")), localUri: formData.get("localUri") }); await createPersistentSyncQueue().enqueue({ entity: "VoiceNote", entityId: `${note.workOrderId}:${Date.now()}`, action: "Create", payload: note }); refresh(note.workOrderId); }
export async function synchronizeNow() { await authorize(); await createSyncEngine().run(); revalidatePath("/mobile"); }
export async function retrySynchronization(formData: FormData) { await authorize(); const { operationId } = manualRetrySchema.parse({ operationId: formData.get("operationId") }); await createSyncEngine().retry(operationId); revalidatePath("/mobile"); }
