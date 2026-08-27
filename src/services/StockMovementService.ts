import { stockMovementInputSchema, type StockMovementInputDto } from "@/dto/inventory.dto";
import type { InventoryRepository } from "@/repositories/InventoryRepository";

export class StockMovementService {
  constructor(private readonly repository: InventoryRepository, private readonly clock: () => Date = () => new Date()) {}
  record(input: StockMovementInputDto) { return this.repository.recordMovement(stockMovementInputSchema.parse(input)); }
  deductForCompletedWorkOrder(workOrderId: string) { return this.repository.deductWorkOrderParts(workOrderId, this.clock()); }
}
