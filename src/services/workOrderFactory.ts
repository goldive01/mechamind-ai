import "server-only";
import { PrismaWorkOrderRepository } from "@/infrastructure/repositories/PrismaWorkOrderRepository";
import { WorkOrderScheduler } from "@/services/WorkOrderScheduler";
import { WorkOrderService } from "@/services/WorkOrderService";
import { createStockMovementService } from "@/services/inventoryFactory";

export const createWorkOrderService = () => new WorkOrderService(new PrismaWorkOrderRepository(), undefined, createStockMovementService());
export const createWorkOrderScheduler = () => new WorkOrderScheduler(new PrismaWorkOrderRepository());
