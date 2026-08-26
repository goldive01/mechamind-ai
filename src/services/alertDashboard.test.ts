import { describe, expect, it } from "vitest";
import type { Alert } from "@/domain/entities/Alert";
import { groupAlertsByResolution, recentAlerts } from "@/services/alertDashboard";

const alert = (id: string, status: Alert["status"], createdAt: string): Alert => ({
  id, status, createdAt: new Date(createdAt), updatedAt: new Date(createdAt), assetId: "MM-000001", assetName: "Pump",
  fingerprint: `MM-000001:${id}`, severity: "High", category: "Sensor Telemetry", source: "Sensor", metric: "temperature",
  title: "Temperature alert", description: "Threshold exceeded", recommendation: "Inspect cooling", triggerType: "Sensor Reading",
  triggerId: "reading-1", observedValue: 90, thresholdValue: 85, acknowledgedAt: null, acknowledgedBy: null, resolvedAt: null, resolvedBy: null,
});

describe("alert dashboard helpers", () => {
  it("separates active and resolved alerts", () => {
    const grouped = groupAlertsByResolution([alert("open", "Open", "2026-01-01"), alert("ack", "Acknowledged", "2026-01-02"), alert("done", "Resolved", "2026-01-03")]);
    expect(grouped.active.map(({ id }) => id)).toEqual(["open", "ack"]);
    expect(grouped.resolved.map(({ id }) => id)).toEqual(["done"]);
  });

  it("returns the newest alerts without mutating repository order", () => {
    const alerts = [alert("old", "Resolved", "2026-01-01"), alert("new", "Open", "2026-01-03"), alert("middle", "Open", "2026-01-02")];
    expect(recentAlerts(alerts, 2).map(({ id }) => id)).toEqual(["new", "middle"]);
    expect(alerts.map(({ id }) => id)).toEqual(["old", "new", "middle"]);
  });
});
