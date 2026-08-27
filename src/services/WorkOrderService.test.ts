import { describe, expect, it, vi } from "vitest";
import type { WorkOrder } from "@/domain/entities/WorkOrder";
import type { WorkOrderRepository } from "@/repositories/WorkOrderRepository";
import { InvalidWorkOrderTransitionError, WorkOrderService } from "@/services/WorkOrderService";
import { WorkOrderScheduler } from "@/services/WorkOrderScheduler";

const now = new Date("2026-08-26T12:00:00Z");
const order = (status: WorkOrder["status"] = "Draft"): WorkOrder => ({ id: "wo-1", assetId: "MM-000001", assetName: "Pump", title: "Inspect bearing", description: "Inspect drive-end bearing", priority: "High", status, assignedTo: null, scheduledStart: now, dueDate: new Date("2026-08-27T12:00:00Z"), completedAt: null, createdAt: now, updatedAt: now });
const repository = (current = order()): WorkOrderRepository => ({
  create: vi.fn(async (input) => ({ ...current, ...input, assignedTo: input.assignedTo ?? null, scheduledStart: input.scheduledStart ?? null, dueDate: input.dueDate ?? null })), findById: vi.fn().mockResolvedValue(current), list: vi.fn().mockResolvedValue([current]), findByAsset: vi.fn().mockResolvedValue([current]), assign: vi.fn(async (_id, assignedTo) => ({ ...current, assignedTo })), updateStatus: vi.fn(async (_id, status, completedAt) => ({ ...current, status, completedAt })), findSchedulable: vi.fn().mockResolvedValue([current]), listAssetOptions: vi.fn().mockResolvedValue([{ assetId: current.assetId, name: current.assetName }]),
});

describe("WorkOrderService", () => {
  it("creates a validated work order and assigns it", async () => { const repo = repository(); const service = new WorkOrderService(repo); const created = await service.create({ assetId: "MM-000001", title: "Inspect bearing", description: "Inspect drive-end bearing", priority: "High", assignedTo: null, scheduledStart: now, dueDate: new Date("2026-08-27T12:00:00Z") }); expect(created.priority).toBe("High"); expect((await service.assign({ workOrderId: created.id, assignedTo: "Alex Engineer" })).assignedTo).toBe("Alex Engineer"); });
  it("enforces status transitions and records completion time", async () => { const repo = repository(order("In Progress")); const service = new WorkOrderService(repo, () => now); const completed = await service.changeStatus({ workOrderId: "wo-1", status: "Completed" }); expect(completed).toMatchObject({ status: "Completed", completedAt: now }); expect(repo.updateStatus).toHaveBeenCalledWith("wo-1", "Completed", now); await expect(new WorkOrderService(repository(order("Draft"))).changeStatus({ workOrderId: "wo-1", status: "Completed" })).rejects.toBeInstanceOf(InvalidWorkOrderTransitionError); });
  it("deducts allocated stock when a work order completes", async () => { const inventory = { deductForCompletedWorkOrder: vi.fn().mockResolvedValue([]) }; await new WorkOrderService(repository(order("In Progress")), () => now, inventory).changeStatus({ workOrderId: "wo-1", status: "Completed" }); expect(inventory.deductForCompletedWorkOrder).toHaveBeenCalledWith("wo-1"); });
  it("retries an idempotent stock deduction for an already completed order", async () => { const inventory = { deductForCompletedWorkOrder: vi.fn().mockResolvedValue([]) }; await new WorkOrderService(repository(order("Completed")), () => now, inventory).changeStatus({ workOrderId: "wo-1", status: "Completed" }); expect(inventory.deductForCompletedWorkOrder).toHaveBeenCalledWith("wo-1"); });
  it("rejects due dates before the scheduled start", () => { expect(() => new WorkOrderService(repository()).create({ assetId: "MM-000001", title: "Inspect bearing", description: "Inspect bearing", priority: "Medium", scheduledStart: now, dueDate: new Date("2026-08-25T12:00:00Z") })).toThrow(); });
});

describe("WorkOrderScheduler", () => {
  it("promotes due draft work orders to scheduled", async () => { const repo = repository(); const scheduled = await new WorkOrderScheduler(repo, () => now).run(); expect(scheduled[0].status).toBe("Scheduled"); expect(repo.findSchedulable).toHaveBeenCalledWith(now); expect(repo.updateStatus).toHaveBeenCalledWith("wo-1", "Scheduled", null); });
});
