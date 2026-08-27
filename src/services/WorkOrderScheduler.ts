import type { WorkOrder } from "@/domain/entities/WorkOrder";
import type { WorkOrderRepository } from "@/repositories/WorkOrderRepository";

export class WorkOrderScheduler {
  constructor(private readonly repository: WorkOrderRepository, private readonly clock: () => Date = () => new Date()) {}
  async run(): Promise<WorkOrder[]> {
    const due = await this.repository.findSchedulable(this.clock());
    return Promise.all(due.map((order) => this.repository.updateStatus(order.id, "Scheduled", null)));
  }
}
