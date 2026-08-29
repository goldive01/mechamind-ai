import "server-only";
import type { EngineeringMemory, MemoryEvent, MemorySourceType, MemoryTag } from "@/domain/entities/EngineeringMemory";
import type { EngineeringMemoryDto, MemoryRelationshipDto, MemorySearchDto } from "@/dto/memory.dto";
import { prisma } from "@/lib/prisma";
import type { MemoryRepository } from "@/repositories/MemoryRepository";

type MemoryDbRecord = Awaited<ReturnType<typeof prisma.engineeringMemory.findFirstOrThrow>> & { events: Array<{ id: string; memoryId: string; eventType: string; sourceType: string; sourceId: string; payloadJson: string; occurredAt: Date; createdAt: Date }>; tags: Array<{ id: string; memoryId: string; name: string; value: string | null; createdAt: Date }> };
const json = (value: string): Record<string, unknown> => { try { const parsed: unknown = JSON.parse(value); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}; } catch { return {}; } };
const map = (record: MemoryDbRecord): EngineeringMemory => ({ ...record, sourceType: record.sourceType as MemorySourceType, details: json(record.detailsJson), events: record.events.map((event): MemoryEvent => ({ ...event, payload: json(event.payloadJson) })), tags: record.tags as MemoryTag[] });
const include = { events: { orderBy: { occurredAt: "desc" as const } }, tags: true } as const;

export class PrismaMemoryRepository implements MemoryRepository {
  async upsert(input: EngineeringMemoryDto) {
    const organisationId = await this.resolveOrganisationId(input);
    const event = input.event;
    const data = { sourceType: input.sourceType, sourceId: input.sourceId, title: input.title, summary: input.summary, detailsJson: JSON.stringify(input.details), equipmentId: input.equipmentId ?? null, assetId: input.assetId ?? null, fault: input.fault ?? null, engineerId: input.engineerId ?? null, partId: input.partId ?? null, sensorId: input.sensorId ?? null, alertId: input.alertId ?? null, timelineType: input.timelineType ?? null, confidence: input.confidence, successful: input.successful ?? null, occurredAt: input.occurredAt, lastObservedAt: input.lastObservedAt ?? input.occurredAt };
    const record = await prisma.engineeringMemory.upsert({
      where: { organisationId_externalKey: { organisationId, externalKey: input.externalKey } },
      create: { organisationId, externalKey: input.externalKey, occurrenceCount: input.occurrenceCount, ...data, tags: { create: input.tags.map((tag) => ({ name: tag.name, value: tag.value ?? null })) }, events: event ? { create: { eventType: event.eventType, sourceType: event.sourceType, sourceId: event.sourceId, payloadJson: JSON.stringify(event.payload), occurredAt: event.occurredAt } } : undefined },
      update: { ...data, occurrenceCount: { increment: input.occurrenceCount }, tags: { deleteMany: {}, create: input.tags.map((tag) => ({ name: tag.name, value: tag.value ?? null })) }, events: event ? { create: { eventType: event.eventType, sourceType: event.sourceType, sourceId: event.sourceId, payloadJson: JSON.stringify(event.payload), occurredAt: event.occurredAt } } : undefined }, include,
    });
    return map(record);
  }
  async findById(id: string, organisationId: string) { const record = await prisma.engineeringMemory.findFirst({ where: { id, organisationId }, include }); return record ? map(record) : null; }
  async search(input: MemorySearchDto) {
    const dimensions = { equipmentId: input.equipmentId, assetId: input.assetId, fault: input.fault ? { contains: input.fault } : undefined, engineerId: input.engineerId, partId: input.partId, sensorId: input.sensorId, alertId: input.alertId, timelineType: input.timelineType };
    const terms = [...new Set(input.query.toLowerCase().match(/[a-z0-9]+/g) ?? [])].filter((term) => term.length > 2).slice(0, 12);
    const records = await prisma.engineeringMemory.findMany({ where: { organisationId: input.organisationId, ...dimensions, OR: terms.length ? terms.flatMap((term) => [{ title: { contains: term } }, { summary: { contains: term } }, { fault: { contains: term } }, { detailsJson: { contains: term } }, { tags: { some: { OR: [{ name: { contains: term } }, { value: { contains: term } }] } } }]) : undefined }, orderBy: { lastObservedAt: "desc" }, take: input.limit, include });
    return records.map(map);
  }
  async relate(input: MemoryRelationshipDto) { await prisma.memoryRelationship.upsert({ where: { fromMemoryId_toMemoryId_relationship: { fromMemoryId: input.fromMemoryId, toMemoryId: input.toMemoryId, relationship: input.relationship } }, create: input, update: { strength: input.strength } }); }
  private async resolveOrganisationId(input: EngineeringMemoryDto) {
    if (input.organisationId !== "legacy") return input.organisationId;
    if (input.assetId) { const asset = await prisma.asset.findUnique({ where: { assetId: input.assetId }, select: { organisationId: true } }); if (asset) return asset.organisationId; }
    if (input.sensorId) { const device = await prisma.sensorDevice.findFirst({ where: { OR: [{ id: input.sensorId }, { macAddress: input.sensorId }] }, select: { asset: { select: { organisationId: true } } } }); if (device) return device.asset.organisationId; }
    if (input.sourceType === "Inventory") { const movement = await prisma.stockMovement.findUnique({ where: { id: input.sourceId }, select: { asset: { select: { organisationId: true } } } }); if (movement?.asset) return movement.asset.organisationId; }
    if (["WorkOrder", "EngineerAssignment", "CompletedRepair"].includes(input.sourceType)) { const order = await prisma.workOrder.findUnique({ where: { id: input.sourceId }, select: { asset: { select: { organisationId: true } } } }); if (order) return order.asset.organisationId; }
    if (input.sourceType === "Inspection") { const inspection = await prisma.inspection.findUnique({ where: { id: input.sourceId }, select: { asset: { select: { organisationId: true } } } }); if (inspection) return inspection.asset.organisationId; }
    return input.organisationId;
  }
}
