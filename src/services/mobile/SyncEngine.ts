import type { SyncOperation } from "@/domain/entities/FieldMobile";
import { syncTransportResultSchema } from "@/dto/field-mobile.dto";
import type { SyncQueueRepository } from "@/repositories/FieldMobileRepository";
import { ConflictResolver } from "@/services/mobile/ConflictResolver";
import { ConnectivityService } from "@/services/mobile/ConnectivityService";
import { ExponentialBackoffPolicy } from "@/services/mobile/RetryPolicy";
import { SyncQueue } from "@/services/mobile/SyncQueue";
import type { SyncTransport } from "@/services/mobile/SyncTransport";

export interface SyncRunResult { online: boolean; processed: number; synced: number; failed: number; conflicts: number }
export class SyncEngine {
  private readonly queue: SyncQueue;
  constructor(private readonly repository: SyncQueueRepository, private readonly connectivity: ConnectivityService, private readonly transport: SyncTransport, private readonly conflicts = new ConflictResolver(), private readonly retries = new ExponentialBackoffPolicy(), private readonly clock: () => Date = () => new Date()) { this.queue = new SyncQueue(repository, clock); }
  async run(limit = 25): Promise<SyncRunResult> {
    const connection = await this.connectivity.status(); if (!connection.online) return { online: false, processed: 0, synced: 0, failed: 0, conflicts: 0 };
    const due = await this.repository.listDue(this.clock(), limit); const result: SyncRunResult = { online: true, processed: 0, synced: 0, failed: 0, conflicts: 0 };
    for (const item of due) { result.processed += 1; const outcome = await this.process(item); if (outcome === "synced") result.synced += 1; else if (outcome === "conflict") result.conflicts += 1; else result.failed += 1; }
    return result;
  }
  async retry(operationId: string): Promise<SyncRunResult> {
    const operation = await this.queue.retry(operationId);
    const connection = await this.connectivity.status();
    if (!connection.online) return { online: false, processed: 0, synced: 0, failed: 0, conflicts: 0 };
    const result: SyncRunResult = { online: true, processed: 1, synced: 0, failed: 0, conflicts: 0 };
    const outcome = await this.process(operation);
    if (outcome === "synced") result.synced = 1;
    else if (outcome === "conflict") result.conflicts = 1;
    else result.failed = 1;
    return result;
  }
  private async process(item: SyncOperation): Promise<"synced" | "failed" | "conflict"> {
    const syncing = await this.queue.markSyncing(item.id);
    try {
      const response = syncTransportResultSchema.parse(await this.transport.synchronize(syncing));
      if (response.status === "Applied") { await this.queue.markSynced(item.id); return "synced"; }
      const resolution = this.conflicts.resolve({ entity: item.entity, localPayload: item.payload, remotePayload: response.remotePayload, baseVersion: item.baseVersion, remoteVersion: response.remoteVersion ?? null });
      if (resolution.strategy === "Use Remote") { await this.queue.markSynced(item.id); return "conflict"; }
      const retried = syncTransportResultSchema.parse(await this.transport.synchronize({ ...syncing, payload: resolution.payload, baseVersion: response.remoteVersion ?? null }));
      if (retried.status === "Applied") { await this.queue.markSynced(item.id); return "conflict"; }
      await this.queue.markFailed(item.id, "Synchronization conflict requires review.", this.retries.nextAttempt(syncing.attempts, this.clock()), { remote: retried.remotePayload, resolution }); return "conflict";
    } catch (error) { await this.queue.markFailed(item.id, error instanceof Error ? error.message : "Synchronization failed.", this.retries.nextAttempt(syncing.attempts, this.clock())); return "failed"; }
  }
}
