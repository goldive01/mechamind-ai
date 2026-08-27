import type { InventoryItem, InventoryRecommendation, SparePart, StockMovement, Supplier, Warehouse } from "@/domain/entities/Inventory";
import type { InventoryItemInputDto, SparePartInputDto, StockMovementInputDto, SupplierInputDto, WarehouseInputDto, WorkOrderPartInputDto } from "@/dto/inventory.dto";

export interface InventorySummary { warehouses: number; spareParts: number; totalUnits: number; lowStockItems: number; inventoryValue: number }
export interface InventoryRepository {
  createWarehouse(input: WarehouseInputDto): Promise<Warehouse>;
  listWarehouses(): Promise<Warehouse[]>;
  createSupplier(input: SupplierInputDto): Promise<Supplier>;
  listSuppliers(): Promise<Supplier[]>;
  createSparePart(input: SparePartInputDto): Promise<SparePart>;
  listSpareParts(): Promise<SparePart[]>;
  setInventoryItem(input: InventoryItemInputDto): Promise<InventoryItem>;
  listInventoryItems(): Promise<InventoryItem[]>;
  summary(): Promise<InventorySummary>;
  recordMovement(input: StockMovementInputDto): Promise<StockMovement>;
  listMovements(limit?: number): Promise<StockMovement[]>;
  addWorkOrderPart(input: WorkOrderPartInputDto): Promise<void>;
  deductWorkOrderParts(workOrderId: string, completedAt: Date): Promise<StockMovement[]>;
  recommendParts(terms: string[]): Promise<InventoryRecommendation[]>;
  inventoryContextForAssets(assetIds: string[]): Promise<Array<{ assetId: string; lowStock: InventoryRecommendation[]; allocatedParts: Array<{ workOrderId: string; sku: string; name: string; quantity: number; deducted: boolean }> }>>;
}
