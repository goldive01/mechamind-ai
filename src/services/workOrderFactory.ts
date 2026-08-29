import "server-only";
import { PrismaWorkOrderRepository } from "@/infrastructure/repositories/PrismaWorkOrderRepository";
import { WorkOrderScheduler } from "@/services/WorkOrderScheduler";
import { WorkOrderService } from "@/services/WorkOrderService";
import { createStockMovementService } from "@/services/inventoryFactory";
import { createMemoryIngestionService } from "@/services/memoryFactory";

export const createWorkOrderService = () => new WorkOrderService(new PrismaWorkOrderRepository(), undefined, createStockMovementService(), createMemoryIngestionService());
export const createWorkOrderScheduler = () => new WorkOrderScheduler(new PrismaWorkOrderRepository());
