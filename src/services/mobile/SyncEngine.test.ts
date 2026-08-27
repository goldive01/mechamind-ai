import { describe, expect, it, vi } from "vitest";
import { syncOperationInputSchema } from "@/dto/field-mobile.dto";
import { InMemoryOfflineRepository } from "@/infrastructure/offline/InMemoryOfflineRepository";
import { ConflictResolver } from "@/services/mobile/ConflictResolver";
import { ConnectivityService } from "@/services/mobile/ConnectivityService";
import { ExponentialBackoffPolicy } from "@/services/mobile/RetryPolicy";
import { SyncEngine } from "@/services/mobile/SyncEngine";
import { SyncQueue } from "@/services/mobile/SyncQueue";

const now = new Date("2026-08-27T09:00:00Z");
const online = (value = true) => new ConnectivityService({ isOnline: vi.fn().mockResolvedValue(value) });

describe("SyncEngine", () => {
  it("does not process queued work while offline", async () => { const repository = new InMemoryOfflineRepository(); await new SyncQueue(repository, () => now).enqueue({ entity: "WorkOrder", entityId: "wo-1", action: "Update", payload: {} }); const transport = { synchronize: vi.fn() }; const result = await new SyncEngine(repository, online(false), transport, undefined, undefined, () => now).run(); expect(result).toEqual({ online: false, processed: 0, synced: 0, failed: 0, conflicts: 0 }); expect(transport.synchronize).not.toHaveBeenCalled(); });
  it("synchronizes every supported entity through the common transport", async () => { const repository = new InMemoryOfflineRepository(); const queue = new SyncQueue(repository, () => now); for (const entity of ["WorkOrder", "Inspection", "Photo", "VoiceNote", "GPS", "DigitalSignature", "Asset"] as const) await queue.enqueue({ entity, entityId: entity, action: "Create", payload: { entity } }); const transport = { synchronize: vi.fn().mockResolvedValue({ status: "Applied" }) }; const result = await new SyncEngine(repository, online(), transport, undefined, undefined, () => now).run(); expect(result).toMatchObject({ processed: 7, synced: 7, failed: 0 }); expect((await repository.summary()).synced).toBe(7); });
  it("schedules exponential retries and supports manual retry", async () => { const repository = new InMemoryOfflineRepository(); const queue = new SyncQueue(repository, () => now); const operation = await queue.enqueue({ entity: "Asset", entityId: "MM-1", action: "Update", payload: {} }); const transport = { synchronize: vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({ status: "Applied" }) }; const engine = new SyncEngine(repository, online(), transport, undefined, new ExponentialBackoffPolicy(1_000, 10_000), () => now); expect((await engine.run()).failed).toBe(1); expect(await repository.get(operation.id)).toMatchObject({ status: "Failed", attempts: 1, nextAttemptAt: new Date(now.getTime() + 1_000) }); expect((await engine.retry(operation.id)).synced).toBe(1); expect(await repository.get(operation.id)).toMatchObject({ status: "Synced", attempts: 2 }); });
  it("persists operations across queue service instances", async () => { const repository = new InMemoryOfflineRepository(); const created = await new SyncQueue(repository, () => now).enqueue({ entity: "Inspection", entityId: "i-1", action: "Create", payload: { condition: "Good" } }); expect(await new SyncQueue(repository, () => now).pending()).toContainEqual(expect.objectContaining({ id: created.id })); });
  it("manually retries the requested operation rather than an earlier due item", async () => {
    const repository = new InMemoryOfflineRepository(); const queue = new SyncQueue(repository, () => now);
    const first = await queue.enqueue({ entity: "WorkOrder", entityId: "wo-1", action: "Update", payload: { status: "Scheduled" } });
    const requested = await queue.enqueue({ entity: "Asset", entityId: "asset-1", action: "Update", payload: { status: "Active" } });
    const transport = { synchronize: vi.fn().mockResolvedValue({ status: "Applied" }) };
    const result = await new SyncEngine(repository, online(), transport, undefined, undefined, () => now).retry(requested.id);
    expect(result).toMatchObject({ processed: 1, synced: 1 });
    expect(transport.synchronize).toHaveBeenCalledWith(expect.objectContaining({ id: requested.id }));
    expect(await repository.get(first.id)).toMatchObject({ status: "Pending", attempts: 0 });
  });
});

describe("syncOperationInputSchema", () => {
  it("rejects missing and non-serializable queue payloads", () => {
    const base = { entity: "Asset", entityId: "asset-1", action: "Update" } as const;
    expect(syncOperationInputSchema.safeParse({ ...base, payload: undefined }).success).toBe(false);
    expect(syncOperationInputSchema.safeParse({ ...base, payload: 1n }).success).toBe(false);
  });
  it("accepts persisted field payloads containing dates", () => {
    expect(syncOperationInputSchema.safeParse({ entity: "DigitalSignature", entityId: "signature-1", action: "Create", payload: { signedAt: now } }).success).toBe(true);
  });
});

describe("ConflictResolver", () => {
  it("preserves append-only field evidence", () => { expect(new ConflictResolver().resolve({ entity: "Photo", localPayload: { uri: "local" }, remotePayload: { uri: "remote" }, baseVersion: null, remoteVersion: null })).toMatchObject({ strategy: "Use Local", payload: { uri: "local" } }); });
  it("uses the newest version for mutable assets and work orders", () => { const resolver = new ConflictResolver(); expect(resolver.resolve({ entity: "WorkOrder", localPayload: { updatedAt: "2026-08-27T10:00:00Z" }, remotePayload: { updatedAt: "2026-08-27T11:00:00Z" }, baseVersion: null, remoteVersion: null }).strategy).toBe("Use Remote"); expect(resolver.resolve({ entity: "Asset", localPayload: { updatedAt: "2026-08-27T12:00:00Z" }, remotePayload: { updatedAt: "2026-08-27T11:00:00Z" }, baseVersion: null, remoteVersion: null }).strategy).toBe("Use Local"); });
});

describe("ExponentialBackoffPolicy", () => {
  it("doubles retry delay up to the configured cap", () => { const policy = new ExponentialBackoffPolicy(1_000, 5_000); expect([1, 2, 3, 4].map((attempt) => policy.delay(attempt))).toEqual([1_000, 2_000, 4_000, 5_000]); });
});
