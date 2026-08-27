import "server-only";
import type { SyncEntity, SyncOperation, SyncOperationStatus } from "@/domain/entities/FieldMobile";
import { prisma } from "@/lib/prisma";
import type { SyncQueueRepository } from "@/repositories/FieldMobileRepository";

type QueueRecord = { id: string; entity: string; entityId: string; action: string; payloadJson: string; baseVersion: string | null; status: string; attempts: number; nextAttemptAt: Date; lastError: string | null; conflictJson: string | null; createdAt: Date; updatedAt: Date; syncedAt: Date | null };
const decode = (value: string | null) => { if (!value) return null; try { return JSON.parse(value) as unknown; } catch { return null; } };
const map = (item: QueueRecord): SyncOperation => ({ id: item.id, entity: item.entity as SyncEntity, entityId: item.entityId, action: item.action as SyncOperation["action"], payload: decode(item.payloadJson), baseVersion: item.baseVersion, status: item.status as SyncOperationStatus, attempts: item.attempts, nextAttemptAt: item.nextAttemptAt, createdAt: item.createdAt, updatedAt: item.updatedAt, syncedAt: item.syncedAt, lastError: item.lastError, conflict: decode(item.conflictJson) });

export class PrismaSyncQueueRepository implements SyncQueueRepository {
  async put(operation: SyncOperation) { await prisma.syncQueueItem.upsert({ where: { id: operation.id }, create: { id: operation.id, entity: operation.entity, entityId: operation.entityId, action: operation.action, payloadJson: JSON.stringify(operation.payload), baseVersion: operation.baseVersion, status: operation.status, attempts: operation.attempts, nextAttemptAt: operation.nextAttemptAt, lastError: operation.lastError, conflictJson: operation.conflict === null ? null : JSON.stringify(operation.conflict), createdAt: operation.createdAt, updatedAt: operation.updatedAt, syncedAt: operation.syncedAt }, update: { payloadJson: JSON.stringify(operation.payload), baseVersion: operation.baseVersion, status: operation.status, attempts: operation.attempts, nextAttemptAt: operation.nextAttemptAt, lastError: operation.lastError, conflictJson: operation.conflict === null ? null : JSON.stringify(operation.conflict), updatedAt: operation.updatedAt, syncedAt: operation.syncedAt } }); }
  async get(id: string) { const item = await prisma.syncQueueItem.findUnique({ where: { id } }); return item ? map(item) : null; }
  async list() { return (await prisma.syncQueueItem.findMany({ orderBy: { createdAt: "asc" } })).map(map); }
  async remove(id: string) { await prisma.syncQueueItem.delete({ where: { id } }); }
  async listDue(now: Date, limit: number) { return (await prisma.syncQueueItem.findMany({ where: { status: { in: ["Pending", "Failed"] }, nextAttemptAt: { lte: now } }, orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }], take: limit })).map(map); }
  async summary() { const items = await this.list(); const count = (status: SyncOperationStatus) => items.filter((item) => item.status === status).length; const nextAttemptAt = items.filter((item) => item.status === "Pending" || item.status === "Failed").map((item) => item.nextAttemptAt).toSorted((a, b) => a.getTime() - b.getTime())[0] ?? null; return { pending: count("Pending"), syncing: count("Syncing"), failed: count("Failed"), synced: count("Synced"), nextAttemptAt }; }
}
