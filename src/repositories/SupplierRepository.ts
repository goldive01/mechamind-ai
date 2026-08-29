import type { InventoryQuery, Page, Supplier } from "@/domain/entities/Inventory";
import type { CreateSupplierDto, UpdateSupplierDto } from "@/dto/inventory.dto";
export interface SupplierRepository { create(input: CreateSupplierDto): Promise<Supplier>; update(input: UpdateSupplierDto): Promise<Supplier>; list(query: InventoryQuery): Promise<Page<Supplier>>; }
