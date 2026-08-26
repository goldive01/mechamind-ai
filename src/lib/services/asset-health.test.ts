import { describe, expect, it } from "vitest";
import { HealthEngine } from "@/services/HealthEngine";

describe("HealthEngine", () => {
  const engine = new HealthEngine();
  const createdAt = new Date("2026-01-01T00:00:00Z");

  it("returns a stable baseline when an asset has no history", () => {
    const health = engine.calculate([], [], createdAt);
    expect(health).toMatchObject({ overallHealth: 63, mechanicalHealth: 60, electricalHealth: 60, safetyScore: 70, maintenancePriority: "Medium" });
    expect(health.drivers).toContain("No maintenance history");
  });

  it("applies live sensor anomalies to health and failure risk", () => {
    const inspection = { id: "i1", overallCondition: "Excellent", notes: null, inspectionDate: createdAt, aiReport: { diagnosis: "Normal", recommendations: "Monitor", riskLevel: "Low" } };
    const normal = engine.calculate([inspection], [], createdAt);
    const anomalous = engine.calculate([inspection], [], createdAt, [{ recordedAt: new Date("2026-01-02T00:00:00Z"), temperature: 120, humidity: 95, vibration: 20, voltage: 600, current: 150 }]);
    expect(anomalous.overallHealth).toBeLessThan(normal.overallHealth);
    expect(anomalous.failureProbability).toBeGreaterThan(normal.failureProbability);
    expect(anomalous.drivers).toContain("Live sensor safety threshold exceeded");
  });
});
