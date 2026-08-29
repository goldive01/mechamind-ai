import { describe, expect, it, vi } from "vitest";
import type { MemoryRepository } from "@/repositories/MemoryRepository";
import { MemoryIngestionService } from "@/services/MemoryIngestionService";
describe("MemoryIngestionService", () => {
  it.each([["inspection", "Inspection"], ["workOrder", "WorkOrder"], ["inventory", "Inventory"], ["sensor", "Sensor"], ["timeline", "Timeline"]] as const)("ingests %s events", async (method, sourceType) => { const upsert = vi.fn(async (input) => input); const repository = { upsert } as unknown as MemoryRepository; const service = new MemoryIngestionService(repository, () => new Date("2026-08-29")); await service[method]({ organisationId: "o1", sourceId: "s1", title: "Event", summary: "Observed" }); expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ sourceType, externalKey: `${sourceType}:s1`, event: expect.objectContaining({ sourceType }) })); });
});
