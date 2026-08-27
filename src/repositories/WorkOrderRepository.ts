import type { WorkOrder, WorkOrderStatus } from "@/domain/entities/WorkOrder";
import type { CreateWorkOrderDto, WorkOrderListQueryDto } from "@/dto/work-order.dto";

export interface WorkOrderRepository {
  create(input: CreateWorkOrderDto): Promise<WorkOrder>;
  findById(id: string): Promise<WorkOrder | null>;
  list(query?: WorkOrderListQueryDto): Promise<WorkOrder[]>;
  findByAsset(assetId: string, limit?: number): Promise<WorkOrder[]>;
  assign(id: string, assignedTo: string | null): Promise<WorkOrder>;
  updateStatus(id: string, status: WorkOrderStatus, completedAt: Date | null): Promise<WorkOrder>;
  findSchedulable(now: Date): Promise<WorkOrder[]>;
  listAssetOptions(): Promise<Array<{ assetId: string; name: string }>>;
}
