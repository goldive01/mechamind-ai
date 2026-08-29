import { describe, expect, it } from "vitest";
import type { CopilotContextRepository } from "@/repositories/CopilotContextRepository";
import { ContextBuilder } from "@/services/copilot/ContextBuilder";

describe("ContextBuilder", () => {
  it("combines operational records, health analytics, and alerts", async () => {
    const repository: CopilotContextRepository = {
      listAssetOptions: async () => [],
      findByAssetIds: async () => [{
        assetId: "MM-000001", status: "Needs Attention", createdAt: new Date("2026-01-01Z"),
        equipment: { name: "Pump", manufacturer: "Mecha", model: "P1", serialNumber: "S1", category: "Pump", location: "Plant", description: null,
          maintenanceRecords: [], sensorDevices: [{ deviceName: "Monitor", readings: [{ recordedAt: new Date("2026-01-03Z"), temperature: 120, humidity: 95, vibration: 20, voltage: 600, current: 150 }] }] },
        inspections: [{ id: "i1", inspectionDate: new Date("2026-01-02Z"), overallCondition: "Poor", notes: "Bearing failure hazard", aiReport: { diagnosis: "Bearing fault", recommendations: "Stop and inspect", riskLevel: "High" } }],
        alerts: [{ severity: "High", source: "Sensor", title: "High vibration alert", recommendation: "Inspect bearings" }],
        workOrders: [{ id: "w1", title: "Replace bearing", description: "Replace worn bearing", priority: "High", status: "Scheduled", assignedTo: "Engineer", scheduledStart: new Date("2026-01-04Z"), dueDate: null, parts: [{ quantity: 2, deductedAt: null, inventoryItem: { available: 12, shelf: "B-14", warehouse: { code: "MAIN", name: "Warehouse A" }, sparePart: { partNumber: "BRG-01", name: "SKF 6204 Bearing", reorderLevel: 4 } } }] }],
        compatibleInventory: [{ available: 12, shelf: "B-14", warehouse: { name: "Warehouse A" }, sparePart: { partNumber: "BRG-01", name: "SKF 6204 Bearing", compatibleAssetTypes: "[\"Pump\"]" } }],
      }],
    };
    const access = { userId: "u1", role: "Engineer", permissions: ["assets:read", "copilot:use"] };
    const [context] = await new ContextBuilder(repository).build(["MM-000001"], access);
    expect(context.access).toEqual(access);
    expect(context.equipment.name).toBe("Pump");
    expect(context.health.failureProbability).toBeGreaterThan(0);
    expect(context.alerts.map((alert) => alert.source)).toEqual(expect.arrayContaining(["health", "sensor", "inspection"]));
    expect(context.alerts).toContainEqual(expect.objectContaining({ source: "alert", message: "High vibration alert", recommendation: "Inspect bearings" }));
    expect(context.workOrders).toContainEqual(expect.objectContaining({ id: "w1", status: "Scheduled", scheduledStart: "2026-01-04T00:00:00.000Z" }));
    expect(context.inventory.allocatedParts).toContainEqual(expect.objectContaining({ partNumber: "BRG-01", availableQuantity: 12, warehouse: "Warehouse A", shelf: "B-14", repairReadiness: "Repair can begin immediately." }));
    expect(context.inventory.compatibleParts).toContainEqual(expect.objectContaining({ partNumber: "BRG-01", availableQuantity: 12, warehouse: "Warehouse A" }));
  });
});
