import type { InventoryQuery, Page, Warehouse } from "@/domain/entities/Inventory";
import type { CreateWarehouseDto, UpdateWarehouseDto } from "@/dto/inventory.dto";
export interface WarehouseRepository { create(input: CreateWarehouseDto): Promise<Warehouse>; update(input: UpdateWarehouseDto): Promise<Warehouse>; list(query: InventoryQuery): Promise<Page<Warehouse>>; }
