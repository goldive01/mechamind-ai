import { adjustInventorySchema, inventoryQuerySchema, stockMovementSchema, transferInventorySchema, type AdjustInventoryDto, type InventoryQueryDto, type StockMovementDto, type TransferInventoryDto } from "@/dto/inventory.dto";
import type { StockMovementRepository } from "@/repositories/StockMovementRepository";
import type { MemoryIngestor } from "@/services/MemoryIngestionService";
export class StockMovementService {
  constructor(private readonly repository: StockMovementRepository, private readonly clock: () => Date = () => new Date(), private readonly memories?: MemoryIngestor) {}
  async record(input: StockMovementDto) { const movement = await this.repository.record(stockMovementSchema.parse(input)); await this.capture(movement); return movement; }
  async adjust(input: AdjustInventoryDto) { const movement = await this.repository.adjust(adjustInventorySchema.parse(input)); await this.capture(movement); return movement; }
  async transfer(input: TransferInventoryDto) { const movements = await this.repository.transfer(transferInventorySchema.parse(input)); await Promise.all(movements.map((movement) => this.capture(movement))); return movements; }
  history(query: InventoryQueryDto = {}) { return this.repository.list(inventoryQuerySchema.parse(query)); }
  async deductForCompletedWorkOrder(workOrderId: string) { const movements = await this.repository.deductWorkOrderParts(workOrderId, this.clock()); await Promise.all(movements.map((movement) => this.capture(movement))); return movements; }
  private async capture(movement: Awaited<ReturnType<StockMovementRepository["record"]>>) { await this.memories?.ingest({ organisationId: "legacy", sourceType: "Inventory", sourceId: movement.id, title: `${movement.movementType} inventory`, summary: `${movement.quantity} units; balance ${movement.balanceAfter}`, partId: movement.inventoryItemId, successful: true, occurredAt: movement.createdAt, details: { ...movement }, tags: [{ name: "movement", value: movement.movementType }, ...(movement.workOrderId ? [{ name: "work-order", value: movement.workOrderId }] : [])] }); }
}
