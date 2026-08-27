import { randomUUID } from "node:crypto";
import type { SyncOperation } from "@/domain/entities/FieldMobile";
import { syncOperationInputSchema, type SyncOperationInputDto } from "@/dto/field-mobile.dto";
import type { OfflineRepository } from "@/repositories/FieldMobileRepository";

export class SyncQueue {
  constructor(private readonly repository: OfflineRepository, private readonly clock: () => Date = () => new Date()) {}
  async enqueue(input: SyncOperationInputDto) { const value = syncOperationInputSchema.parse(input); const now = this.clock(); const operation: SyncOperation = { id: randomUUID(), entity: value.entity, entityId: value.entityId, action: value.action, payload: value.payload, baseVersion: value.baseVersion ?? null, status: "Pending", attempts: 0, nextAttemptAt: now, createdAt: now, updatedAt: now, syncedAt: null, lastError: null, conflict: null }; await this.repository.put(operation); return operation; }
  pending() { return this.repository.list().then((items) => items.filter((item) => item.status === "Pending" || item.status === "Failed")); }
  async markSyncing(id: string) { return this.update(id, (item) => ({ ...item, status: "Syncing", attempts: item.attempts + 1, updatedAt: this.clock() })); }
  async markFailed(id: string, error: string, nextAttemptAt = this.clock(), conflict: unknown = null) { return this.update(id, (item) => ({ ...item, status: "Failed", nextAttemptAt, lastError: error.slice(0, 500), conflict, updatedAt: this.clock() })); }
  async markSynced(id: string) { const now = this.clock(); return this.update(id, (item) => ({ ...item, status: "Synced", syncedAt: now, lastError: null, conflict: null, updatedAt: now })); }
  async retry(id: string) { return this.update(id, (item) => ({ ...item, status: "Pending", nextAttemptAt: this.clock(), lastError: null, conflict: null, updatedAt: this.clock() })); }
  private async update(id: string, change: (item: SyncOperation) => SyncOperation) { const item = await this.repository.get(id); if (!item) throw new Error(`Sync operation ${id} was not found.`); const updated = change(item); await this.repository.put(updated); return updated; }
}
