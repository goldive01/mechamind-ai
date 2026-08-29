import { createInventoryItemSchema, createPartSchema, inventoryQuerySchema, reserveInventorySchema, updatePartSchema, workOrderPartInputSchema, type CreateInventoryItemDto, type CreatePartDto, type InventoryQueryDto, type ReserveInventoryDto, type UpdatePartDto, type WorkOrderPartInputDto } from "@/dto/inventory.dto";
import type { InventoryRepository } from "@/repositories/InventoryRepository";
export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}
  createPart(input: CreatePartDto) { return this.repository.createPart(createPartSchema.parse(input)); }
  updatePart(input: UpdatePartDto) { return this.repository.updatePart(updatePartSchema.parse(input)); }
  listParts(query: InventoryQueryDto = {}) { return this.repository.listParts(inventoryQuerySchema.parse(query)); }
  createInventoryItem(input: CreateInventoryItemDto) { return this.repository.createInventoryItem(createInventoryItemSchema.parse(input)); }
  listInventoryItems(query: InventoryQueryDto = {}) { return this.repository.listInventoryItems(inventoryQuerySchema.parse(query)); }
  summary() { return this.repository.summary(); }
  reserve(input: ReserveInventoryDto) { const value = reserveInventorySchema.parse(input); return this.repository.reserve(value.inventoryItemId, value.quantity); }
  release(input: ReserveInventoryDto) { const value = reserveInventorySchema.parse(input); return this.repository.release(value.inventoryItemId, value.quantity); }
  allocateToWorkOrder(input: WorkOrderPartInputDto) { return this.repository.addWorkOrderPart(workOrderPartInputSchema.parse(input)); }
}
