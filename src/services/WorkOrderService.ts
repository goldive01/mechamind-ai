import type { WorkOrder, WorkOrderStatus } from "@/domain/entities/WorkOrder";
import { assignWorkOrderSchema, changeWorkOrderStatusSchema, createWorkOrderSchema, workOrderListQuerySchema, type AssignWorkOrderDto, type ChangeWorkOrderStatusDto, type CreateWorkOrderDto, type WorkOrderListQueryDto } from "@/dto/work-order.dto";
import type { WorkOrderRepository } from "@/repositories/WorkOrderRepository";
import type { MemoryIngestor } from "@/services/MemoryIngestionService";
import { createLogger } from "@/infrastructure/logging/Logger";
const logger = createLogger("WorkOrderService");

const transitions: Record<WorkOrderStatus, readonly WorkOrderStatus[]> = {
  Draft: ["Scheduled", "Cancelled"], Scheduled: ["In Progress", "On Hold", "Cancelled"], "In Progress": ["On Hold", "Completed", "Cancelled"], "On Hold": ["Scheduled", "In Progress", "Cancelled"], Completed: [], Cancelled: [],
};
export const allowedWorkOrderStatuses = (status: WorkOrderStatus) => transitions[status];

export class WorkOrderNotFoundError extends Error {}
export class InvalidWorkOrderTransitionError extends Error {}
export interface WorkOrderCompletionInventory { deductForCompletedWorkOrder(workOrderId: string): Promise<unknown> }

export class WorkOrderService {
  constructor(private readonly repository: WorkOrderRepository, private readonly clock: () => Date = () => new Date(), private readonly inventory?: WorkOrderCompletionInventory, private readonly memories?: MemoryIngestor) {}
  create(input: CreateWorkOrderDto) { const value = createWorkOrderSchema.parse(input); return this.createValidated(value); }
  list(query: WorkOrderListQueryDto = {}) { return this.repository.list(workOrderListQuerySchema.parse(query)); }
  get(id: string) { return this.repository.findById(id); }
  findByAsset(assetId: string, limit = 6) { return this.repository.findByAsset(assetId, limit); }
  listAssetOptions() { return this.repository.listAssetOptions(); }
  async assign(input: AssignWorkOrderDto) { const value = assignWorkOrderSchema.parse(input); await this.require(value.workOrderId); const order = await this.repository.assign(value.workOrderId, value.assignedTo); await this.capture(order, "EngineerAssignment", "Assigned"); return order; }
  async changeStatus(input: ChangeWorkOrderStatusDto): Promise<WorkOrder> {
    const value = changeWorkOrderStatusSchema.parse(input); const current = await this.require(value.workOrderId);
    if (current.status === value.status) { if (value.status === "Completed") await this.inventory?.deductForCompletedWorkOrder(current.id); return current; }
    if (!transitions[current.status].includes(value.status)) throw new InvalidWorkOrderTransitionError(`Cannot move work order from ${current.status} to ${value.status}.`);
    const updated = await this.repository.updateStatus(current.id, value.status, value.status === "Completed" ? this.clock() : null);
    if (value.status === "Completed") await this.inventory?.deductForCompletedWorkOrder(updated.id);
    await this.capture(updated, value.status === "Completed" ? "CompletedRepair" : "WorkOrder", "StatusChanged");
    return updated;
  }
  private async capture(order: WorkOrder, sourceType: "WorkOrder" | "EngineerAssignment" | "CompletedRepair", eventType: string) { try { await this.memories?.ingest({ organisationId: "legacy", sourceType, sourceId: order.id, deduplicationKey: `${sourceType}:${order.id}`, eventType, title: order.title, summary: `${order.status}: ${order.description}`, assetId: order.assetId, engineerId: order.assignedTo, successful: sourceType === "CompletedRepair" ? true : null, confidence: sourceType === "CompletedRepair" ? 0.95 : 0.8, occurredAt: order.completedAt ?? order.updatedAt, details: { status: order.status, priority: order.priority, assignedTo: order.assignedTo }, tags: [{ name: "work-order", value: order.id }] }); } catch (error) { logger.error("Engineering memory ingestion failed", error, { workOrderId: order.id }); } }
  private async require(id: string) { const order = await this.repository.findById(id); if (!order) throw new WorkOrderNotFoundError(`Work order ${id} was not found.`); return order; }
  private async createValidated(input: CreateWorkOrderDto) { const order = await this.repository.create(input); await this.capture(order, "WorkOrder", "Created"); return order; }
}
