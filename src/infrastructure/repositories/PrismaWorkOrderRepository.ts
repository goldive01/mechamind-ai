import "server-only";
import type { WorkOrder, WorkOrderPriority, WorkOrderStatus } from "@/domain/entities/WorkOrder";
import type { CreateWorkOrderDto, WorkOrderListQueryDto } from "@/dto/work-order.dto";
import { prisma } from "@/lib/prisma";
import type { WorkOrderRepository } from "@/repositories/WorkOrderRepository";

const include = { asset: { select: { assetId: true, equipment: { select: { name: true } } } } } as const;
type RecordWithAsset = Awaited<ReturnType<typeof prisma.workOrder.findFirstOrThrow>> & { asset: { assetId: string; equipment: { name: string } } };
const map = (record: RecordWithAsset): WorkOrder => ({ id: record.id, assetId: record.asset.assetId, assetName: record.asset.equipment.name, title: record.title, description: record.description, priority: record.priority as WorkOrderPriority, status: record.status as WorkOrderStatus, assignedTo: record.assignedTo, scheduledStart: record.scheduledStart, dueDate: record.dueDate, completedAt: record.completedAt, createdAt: record.createdAt, updatedAt: record.updatedAt });

export class PrismaWorkOrderRepository implements WorkOrderRepository {
  async create(input: CreateWorkOrderDto) {
    const record = await prisma.workOrder.create({ data: { asset: { connect: { assetId: input.assetId } }, title: input.title, description: input.description, priority: input.priority, assignedTo: input.assignedTo ?? null, scheduledStart: input.scheduledStart ?? null, dueDate: input.dueDate ?? null }, include });
    return map(record);
  }
  async findById(id: string) { const record = await prisma.workOrder.findUnique({ where: { id }, include }); return record ? map(record) : null; }
  async list(query: WorkOrderListQueryDto = {}) {
    const records = await prisma.workOrder.findMany({ where: { status: query.status, priority: query.priority, assignedTo: query.assignedTo ? { contains: query.assignedTo } : undefined, asset: query.assetId ? { assetId: query.assetId } : undefined }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }], include });
    return records.map(map);
  }
  async findByAsset(assetId: string, limit = 6) { const records = await prisma.workOrder.findMany({ where: { asset: { assetId } }, orderBy: { updatedAt: "desc" }, take: limit, include }); return records.map(map); }
  async assign(id: string, assignedTo: string | null) { return map(await prisma.workOrder.update({ where: { id }, data: { assignedTo }, include })); }
  async updateStatus(id: string, status: WorkOrderStatus, completedAt: Date | null) { return map(await prisma.workOrder.update({ where: { id }, data: { status, completedAt }, include })); }
  async findSchedulable(now: Date) { const records = await prisma.workOrder.findMany({ where: { status: "Draft", scheduledStart: { lte: now } }, orderBy: { scheduledStart: "asc" }, include }); return records.map(map); }
  async listAssetOptions() { const assets = await prisma.asset.findMany({ orderBy: { assetId: "asc" }, select: { assetId: true, equipment: { select: { name: true } } } }); return assets.map((asset) => ({ assetId: asset.assetId, name: asset.equipment.name })); }
}
