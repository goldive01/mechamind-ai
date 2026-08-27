import "server-only";
import { PrismaInventoryRepository } from "@/infrastructure/repositories/PrismaInventoryRepository";
import { InventoryService } from "@/services/InventoryService";
import { StockMovementService } from "@/services/StockMovementService";

export const createInventoryRepository = () => new PrismaInventoryRepository();
export const createInventoryService = () => new InventoryService(createInventoryRepository());
export const createStockMovementService = () => new StockMovementService(createInventoryRepository());
