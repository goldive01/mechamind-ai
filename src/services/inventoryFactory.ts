import "server-only";
import { PrismaInventoryRepository } from "@/infrastructure/repositories/PrismaInventoryRepository";
import { PrismaStockMovementRepository } from "@/infrastructure/repositories/PrismaStockMovementRepository";
import { PrismaSupplierRepository } from "@/infrastructure/repositories/PrismaSupplierRepository";
import { PrismaWarehouseRepository } from "@/infrastructure/repositories/PrismaWarehouseRepository";
import { InventoryService } from "@/services/InventoryService";
import { StockMovementService } from "@/services/StockMovementService";
import { SupplierService } from "@/services/SupplierService";
import { WarehouseService } from "@/services/WarehouseService";
import { createMemoryIngestionService } from "@/services/memoryFactory";

export const createInventoryRepository = () => new PrismaInventoryRepository();
export const createInventoryService = () => new InventoryService(createInventoryRepository());
export const createStockMovementService = () => new StockMovementService(new PrismaStockMovementRepository(), undefined, createMemoryIngestionService());
export const createWarehouseService = () => new WarehouseService(new PrismaWarehouseRepository());
export const createSupplierService = () => new SupplierService(new PrismaSupplierRepository());
