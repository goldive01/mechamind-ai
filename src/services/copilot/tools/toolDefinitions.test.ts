import { describe, expect, it, vi } from "vitest";
import type { AssetOperationsRepository } from "@/repositories/AssetOperationsRepository";
import { AssetQueryService } from "@/services/AssetQueryService";
import { InspectionReportService } from "@/services/InspectionReportService";
import { MaintenanceService } from "@/services/MaintenanceService";
import { createToolDefinitions } from "@/services/copilot/tools/toolDefinitions";

describe("tool definitions", () => {
  it("registers all Phase 2 tools through application services", async () => {
    const repository: AssetOperationsRepository = { search: vi.fn().mockResolvedValue([]), getHealthData: vi.fn().mockResolvedValue(null), createMaintenance: vi.fn().mockResolvedValue({ id: "m1", assetId: "MM-000001", maintenanceDate: new Date() }), getInspectionReport: vi.fn().mockResolvedValue(null) };
    const definitions = createToolDefinitions(new AssetQueryService(repository), new MaintenanceService(repository), new InspectionReportService(repository));
    expect(definitions.map((tool) => tool.name)).toEqual(["searchAssets", "getAssetHealth", "compareAssets", "createMaintenance", "generateInspectionReport", "calculateHealth"]);
    await definitions[0].execute({ query: "pump", limit: 5 });
    expect(repository.search).toHaveBeenCalledWith("pump", 5);
    expect(definitions.find((tool) => tool.name === "createMaintenance")).toMatchObject({ destructive: true, permission: "maintenance:write" });
  });
});

