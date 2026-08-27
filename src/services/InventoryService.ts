import { inventoryItemInputSchema, sparePartInputSchema, supplierInputSchema, warehouseInputSchema, workOrderPartInputSchema, type InventoryItemInputDto, type SparePartInputDto, type SupplierInputDto, type WarehouseInputDto, type WorkOrderPartInputDto } from "@/dto/inventory.dto";
import type { InventoryRepository } from "@/repositories/InventoryRepository";

export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}
  createWarehouse(input: WarehouseInputDto) { return this.repository.createWarehouse(warehouseInputSchema.parse(input)); }
  listWarehouses() { return this.repository.listWarehouses(); }
  createSupplier(input: SupplierInputDto) { return this.repository.createSupplier(supplierInputSchema.parse(input)); }
  listSuppliers() { return this.repository.listSuppliers(); }
  createSparePart(input: SparePartInputDto) { return this.repository.createSparePart(sparePartInputSchema.parse(input)); }
  listSpareParts() { return this.repository.listSpareParts(); }
  setInventoryItem(input: InventoryItemInputDto) { return this.repository.setInventoryItem(inventoryItemInputSchema.parse(input)); }
  listInventoryItems() { return this.repository.listInventoryItems(); }
  summary() { return this.repository.summary(); }
  movements(limit = 50) { return this.repository.listMovements(Math.max(1, Math.min(250, Math.trunc(limit)))); }
  allocateToWorkOrder(input: WorkOrderPartInputDto) { return this.repository.addWorkOrderPart(workOrderPartInputSchema.parse(input)); }
}
