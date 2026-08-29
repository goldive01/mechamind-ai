import "server-only";
import { prisma } from "@/lib/prisma";
import type { AuditRepository } from "@/repositories/AuditRepository";
export class PrismaAuditRepository implements AuditRepository {
  async create(event: Parameters<AuditRepository["create"]>[0]) { const { metadata, ...rest } = event; const row = await prisma.auditLog.create({ data: { ...rest, metadataJson: JSON.stringify(metadata ?? {}) } }); return { ...rest, id: row.id, metadata, createdAt: row.createdAt }; }
  async list(resource?: string, resourceId?: string) { const rows = await prisma.auditLog.findMany({ where: { resource, resourceId }, orderBy: { createdAt: "desc" } }); return rows.map(({ metadataJson, ...row }) => ({ ...row, outcome: row.outcome as "SUCCESS" | "DENIED" | "FAILURE", metadata: JSON.parse(metadataJson) })); }
}
