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
      }],
    };
    const [context] = await new ContextBuilder(repository).build(["MM-000001"]);
    expect(context.equipment.name).toBe("Pump");
    expect(context.health.failureProbability).toBeGreaterThan(0);
    expect(context.alerts.map((alert) => alert.source)).toEqual(expect.arrayContaining(["health", "sensor", "inspection"]));
  });
});

