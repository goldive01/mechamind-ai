import type { InventoryQuery, Page, StockMovement } from "@/domain/entities/Inventory";
import type { AdjustInventoryDto, StockMovementDto, TransferInventoryDto } from "@/dto/inventory.dto";
export interface StockMovementRepository { record(input: StockMovementDto): Promise<StockMovement>; adjust(input: AdjustInventoryDto): Promise<StockMovement>; transfer(input: TransferInventoryDto): Promise<StockMovement[]>; list(query: InventoryQuery): Promise<Page<StockMovement>>; deductWorkOrderParts(workOrderId: string, completedAt: Date): Promise<StockMovement[]>; }
