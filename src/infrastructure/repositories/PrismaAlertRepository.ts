import "server-only";
import type { Alert, AlertHistoryEntry, AlertSeverity, AlertSource, AlertStatus, AlertMetric } from "@/domain/entities/Alert";
import type { AlertListQueryDto } from "@/dto/alert.dto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AlertRepository, PersistAlertFinding } from "@/repositories/AlertRepository";

const includeAsset = { asset: { include: { equipment: true } } } as const;
type AlertRow = Prisma.AlertGetPayload<{ include: typeof includeAsset }>;
const toDomain = (row: AlertRow): Alert => ({ id: row.id, assetId: row.asset.assetId, assetName: row.asset.equipment.name, fingerprint: row.fingerprint, severity: row.severity as AlertSeverity, category: row.category, status: row.status as AlertStatus, source: row.source as AlertSource, metric: row.metric as AlertMetric, title: row.title, description: row.description, recommendation: row.recommendation, triggerType: row.triggerType, triggerId: row.triggerId, observedValue: row.observedValue, thresholdValue: row.thresholdValue, acknowledgedAt: row.acknowledgedAt, acknowledgedBy: row.acknowledgedBy, resolvedAt: row.resolvedAt, resolvedBy: row.resolvedBy, createdAt: row.createdAt, updatedAt: row.updatedAt });
const toHistory = (row: { id: string; alertId: string; eventType: string; fromValue: string | null; toValue: string | null; actor: string | null; note: string | null; createdAt: Date }): AlertHistoryEntry => row;
const evaluationInclude = { equipment: { include: { maintenanceRecords: { orderBy: { maintenanceDate: "asc" as const } }, sensorDevices: { include: { readings: { orderBy: { recordedAt: "desc" as const }, take: 100 } } } } }, inspections: { orderBy: { inspectionDate: "asc" as const }, include: { aiReport: true } } };

export class PrismaAlertRepository implements AlertRepository {
  async list(filters: AlertListQueryDto) {
    const rows = await prisma.alert.findMany({ where: { severity: filters.severity, status: filters.status, category: filters.category || undefined, asset: filters.assetId ? { assetId: filters.assetId } : undefined, OR: filters.search ? [{ title: { contains: filters.search } }, { description: { contains: filters.search } }, { recommendation: { contains: filters.search } }, { asset: { assetId: { contains: filters.search } } }, { asset: { equipment: { is: { name: { contains: filters.search } } } } }] : undefined }, include: includeAsset, orderBy: { updatedAt: "desc" } });
    return rows.map(toDomain);
  }
  async findById(id: string) { const row = await prisma.alert.findUnique({ where: { id }, include: includeAsset }); return row ? toDomain(row) : null; }
  async findByFingerprint(fingerprint: string) { const row = await prisma.alert.findUnique({ where: { fingerprint }, include: includeAsset }); return row ? toDomain(row) : null; }
  async getHistory(alertId: string) { return (await prisma.alertHistory.findMany({ where: { alertId }, orderBy: { createdAt: "asc" } })).map(toHistory); }
  async getEvaluationData(assetId: string) {
    const asset = await prisma.asset.findUnique({ where: { assetId }, include: evaluationInclude }); if (!asset) return null;
    return { asset: { assetId: asset.assetId, status: asset.status, name: asset.equipment.name, manufacturer: asset.equipment.manufacturer, model: asset.equipment.model, category: asset.equipment.category, location: asset.equipment.location, createdAt: asset.createdAt }, inspections: asset.inspections, maintenance: asset.equipment.maintenanceRecords, readings: asset.equipment.sensorDevices.flatMap((device) => device.readings) };
  }
  async findAssetIdForSensor(deviceId?: string, macAddress?: string) {
    const device = await prisma.sensorDevice.findFirst({ where: deviceId ? { id: deviceId } : { macAddress }, select: { asset: { select: { assetId: true } } } }); return device?.asset.assetId ?? null;
  }
  async upsertFinding(finding: PersistAlertFinding) {
    return prisma.$transaction(async (tx) => {
      const { assetId, ...alertData } = finding;
      const asset = await tx.asset.findUniqueOrThrow({ where: { assetId }, select: { id: true } });
      const existing = await tx.alert.findUnique({ where: { fingerprint: finding.fingerprint } });
      if (!existing) {
        const created = await tx.alert.create({ data: { assetId: asset.id, ...alertData }, include: includeAsset });
        await tx.alertHistory.create({ data: { alertId: created.id, eventType: "Created", toValue: finding.severity, actor: "Alert Engine", note: finding.description } });
        return { alert: toDomain(created), changed: true };
      }
      const reopened = existing.status === "Resolved"; const severityChanged = existing.severity !== finding.severity;
      const updated = await tx.alert.update({ where: { id: existing.id }, data: { severity: finding.severity, category: finding.category, status: reopened ? "Open" : existing.status, source: finding.source, title: finding.title, description: finding.description, recommendation: finding.recommendation, triggerType: finding.triggerType, triggerId: finding.triggerId, observedValue: finding.observedValue, thresholdValue: finding.thresholdValue, resolvedAt: reopened ? null : existing.resolvedAt, resolvedBy: reopened ? null : existing.resolvedBy }, include: includeAsset });
      if (reopened) await tx.alertHistory.create({ data: { alertId: existing.id, eventType: "Reopened", fromValue: "Resolved", toValue: "Open", actor: "Alert Engine" } });
      if (severityChanged) await tx.alertHistory.create({ data: { alertId: existing.id, eventType: "Severity Changed", fromValue: existing.severity, toValue: finding.severity, actor: "Alert Engine" } });
      return { alert: toDomain(updated), changed: reopened || severityChanged };
    });
  }
  async resolveMissing(assetId: string, activeFingerprints: string[], actor: string) {
    const active = await prisma.alert.findMany({ where: { asset: { assetId }, status: { not: "Resolved" }, fingerprint: { notIn: activeFingerprints } }, include: includeAsset });
    const resolved: Alert[] = [];
    for (const row of active) resolved.push(await this.resolve(row.id, actor, "Condition returned within configured thresholds."));
    return resolved;
  }
  async acknowledge(id: string, actor: string, note?: string) { return this.transition(id, "Acknowledged", actor, note); }
  async resolve(id: string, actor: string, note?: string) { return this.transition(id, "Resolved", actor, note); }
  private async transition(id: string, status: "Acknowledged" | "Resolved", actor: string, note?: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.alert.findUniqueOrThrow({ where: { id } });
      const now = new Date();
      const updated = await tx.alert.update({ where: { id }, data: status === "Acknowledged" ? { status, acknowledgedAt: now, acknowledgedBy: actor } : { status, resolvedAt: now, resolvedBy: actor }, include: includeAsset });
      if (current.status !== status) await tx.alertHistory.create({ data: { alertId: id, eventType: status, fromValue: current.status, toValue: status, actor, note } });
      return toDomain(updated);
    });
  }
}
