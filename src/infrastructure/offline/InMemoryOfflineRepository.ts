import type { SyncOperation } from "@/domain/entities/FieldMobile";
import type { SyncQueueRepository } from "@/repositories/FieldMobileRepository";

export class InMemoryOfflineRepository implements SyncQueueRepository {
  private readonly operations = new Map<string, SyncOperation>();
  async put(operation: SyncOperation) { this.operations.set(operation.id, structuredClone(operation)); }
  async get(id: string) { const item = this.operations.get(id); return item ? structuredClone(item) : null; }
  async list() { return [...this.operations.values()].map((item) => structuredClone(item)).toSorted((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); }
  async remove(id: string) { this.operations.delete(id); }
  async listDue(now: Date, limit: number) { return (await this.list()).filter((item) => (item.status === "Pending" || item.status === "Failed") && item.nextAttemptAt <= now).slice(0, limit); }
  async summary() { const items = await this.list(); const count = (status: SyncOperation["status"]) => items.filter((item) => item.status === status).length; const due = items.filter((item) => item.status === "Pending" || item.status === "Failed").map((item) => item.nextAttemptAt).toSorted((a, b) => a.getTime() - b.getTime())[0] ?? null; return { pending: count("Pending"), syncing: count("Syncing"), failed: count("Failed"), synced: count("Synced"), nextAttemptAt: due }; }
}
