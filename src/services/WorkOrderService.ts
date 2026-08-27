import type { WorkOrder, WorkOrderStatus } from "@/domain/entities/WorkOrder";
import { assignWorkOrderSchema, changeWorkOrderStatusSchema, createWorkOrderSchema, workOrderListQuerySchema, type AssignWorkOrderDto, type ChangeWorkOrderStatusDto, type CreateWorkOrderDto, type WorkOrderListQueryDto } from "@/dto/work-order.dto";
import type { WorkOrderRepository } from "@/repositories/WorkOrderRepository";

const transitions: Record<WorkOrderStatus, readonly WorkOrderStatus[]> = {
  Draft: ["Scheduled", "Cancelled"], Scheduled: ["In Progress", "On Hold", "Cancelled"], "In Progress": ["On Hold", "Completed", "Cancelled"], "On Hold": ["Scheduled", "In Progress", "Cancelled"], Completed: [], Cancelled: [],
};
export const allowedWorkOrderStatuses = (status: WorkOrderStatus) => transitions[status];

export class WorkOrderNotFoundError extends Error {}
export class InvalidWorkOrderTransitionError extends Error {}
export interface WorkOrderCompletionInventory { deductForCompletedWorkOrder(workOrderId: string): Promise<unknown> }

export class WorkOrderService {
  constructor(private readonly repository: WorkOrderRepository, private readonly clock: () => Date = () => new Date(), private readonly inventory?: WorkOrderCompletionInventory) {}
  create(input: CreateWorkOrderDto) { return this.repository.create(createWorkOrderSchema.parse(input)); }
  list(query: WorkOrderListQueryDto = {}) { return this.repository.list(workOrderListQuerySchema.parse(query)); }
  get(id: string) { return this.repository.findById(id); }
  findByAsset(assetId: string, limit = 6) { return this.repository.findByAsset(assetId, limit); }
  listAssetOptions() { return this.repository.listAssetOptions(); }
  assign(input: AssignWorkOrderDto) { const value = assignWorkOrderSchema.parse(input); return this.require(value.workOrderId).then(() => this.repository.assign(value.workOrderId, value.assignedTo)); }
  async changeStatus(input: ChangeWorkOrderStatusDto): Promise<WorkOrder> {
    const value = changeWorkOrderStatusSchema.parse(input); const current = await this.require(value.workOrderId);
    if (current.status === value.status) { if (value.status === "Completed") await this.inventory?.deductForCompletedWorkOrder(current.id); return current; }
    if (!transitions[current.status].includes(value.status)) throw new InvalidWorkOrderTransitionError(`Cannot move work order from ${current.status} to ${value.status}.`);
    const updated = await this.repository.updateStatus(current.id, value.status, value.status === "Completed" ? this.clock() : null);
    if (value.status === "Completed") await this.inventory?.deductForCompletedWorkOrder(updated.id);
    return updated;
  }
  private async require(id: string) { const order = await this.repository.findById(id); if (!order) throw new WorkOrderNotFoundError(`Work order ${id} was not found.`); return order; }
}
