import { describe, expect, it, vi } from "vitest";
import type { DigitalSignature, SyncOperation, WorkOrderEvidence } from "@/domain/entities/FieldMobile";
import type { WorkOrder } from "@/domain/entities/WorkOrder";
import { InMemoryOfflineRepository } from "@/infrastructure/offline/InMemoryOfflineRepository";
import type { DigitalSignatureRepository, FieldEvidenceRepository } from "@/repositories/FieldMobileRepository";
import type { WorkOrderRepository } from "@/repositories/WorkOrderRepository";
import { MobileFieldService } from "@/services/mobile/MobileFieldService";
import { SyncQueue } from "@/services/mobile/SyncQueue";

const now = new Date("2026-08-26T12:00:00Z");
const workOrder: WorkOrder = { id: "wo-1", assetId: "MM-000001", assetName: "Pump", title: "Inspect pump", description: "Inspect bearing and seal", priority: "High", status: "In Progress", assignedTo: "Alex", scheduledStart: now, dueDate: null, completedAt: null, createdAt: now, updatedAt: now };
const workOrders: WorkOrderRepository = { create: vi.fn(), findById: vi.fn().mockResolvedValue(workOrder), list: vi.fn().mockResolvedValue([workOrder, { ...workOrder, id: "wo-2", status: "Completed" }]), findByAsset: vi.fn(), assign: vi.fn(), updateStatus: vi.fn(), findSchedulable: vi.fn(), listAssetOptions: vi.fn() };
const signatures: DigitalSignatureRepository = { create: vi.fn(async (input): Promise<DigitalSignature> => ({ id: "sig-1", ...input, latitude: input.latitude ?? null, longitude: input.longitude ?? null, signedAt: now })), findByWorkOrder: vi.fn().mockResolvedValue([]) };
const evidence: FieldEvidenceRepository = { addEvidence: vi.fn(async (input): Promise<WorkOrderEvidence> => ({ id: "ev-1", workOrderId: input.workOrderId, type: input.type, uri: input.uri ?? null, note: input.note ?? null, latitude: input.latitude ?? null, longitude: input.longitude ?? null, capturedAt: now })), listEvidence: vi.fn().mockResolvedValue([]) };

describe("MobileFieldService", () => {
  it("returns only active field work orders", async () => { const result = await new MobileFieldService(workOrders, signatures, evidence).dashboard("Alex"); expect(result.map((item) => item.id)).toEqual(["wo-1"]); expect(workOrders.list).toHaveBeenCalledWith({ assignedTo: "Alex" }); });
  it("validates and stores a digital signature", async () => { const result = await new MobileFieldService(workOrders, signatures, evidence).sign({ workOrderId: "wo-1", signerName: "Alex Engineer", signatureData: `data:image/png;base64,${"a".repeat(20)}`, latitude: 51.5, longitude: -0.1 }); expect(result.signerName).toBe("Alex Engineer"); expect(signatures.create).toHaveBeenCalledOnce(); });
  it("rejects incomplete GPS coordinates", async () => { await expect(new MobileFieldService(workOrders, signatures, evidence).sign({ workOrderId: "wo-1", signerName: "Alex Engineer", signatureData: "data:image/png;base64,aaaa", latitude: 51.5 })).rejects.toThrow(); });
  it("stores camera and GPS evidence through abstractions", async () => { const service = new MobileFieldService(workOrders, signatures, evidence, { save: vi.fn().mockResolvedValue("/uploads/photo.jpg") }); const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" }); expect((await service.capturePhoto("wo-1", file)).uri).toBe("/uploads/photo.jpg"); expect((await service.captureLocation("wo-1", { latitude: 51.5, longitude: -0.1, accuracy: 4, capturedAt: now })).type).toBe("Location"); });
});

describe("SyncQueue", () => {
  it("queues offline operations and tracks retry state", async () => { const repository = new InMemoryOfflineRepository(); const queue = new SyncQueue(repository, () => now); const operation = await queue.enqueue({ entity: "WorkOrder", entityId: "wo-1", action: "Update", payload: { status: "Completed" } }); expect(await queue.pending()).toHaveLength(1); expect((await queue.markSyncing(operation.id)).attempts).toBe(1); expect((await queue.markFailed(operation.id, "offline")).lastError).toBe("offline"); expect((await queue.markSynced(operation.id)).status).toBe("Synced"); expect((await repository.get(operation.id)) satisfies SyncOperation | null).toMatchObject({ status: "Synced", attempts: 1 }); });
});
