import { describe, expect, it, vi } from "vitest";
import type { Alert, AlertHistoryEntry } from "@/domain/entities/Alert";
import type { AlertRepository, PersistAlertFinding } from "@/repositories/AlertRepository";
import { AlertEngine } from "@/services/AlertEngine";
import { AlertService } from "@/services/AlertService";
import { HealthEngine } from "@/services/HealthEngine";
import { NotificationService } from "@/services/NotificationService";
import { RecommendationEngine } from "@/services/RecommendationEngine";

const now = new Date("2026-08-25T12:00:00Z");
const makeAlert = (finding: PersistAlertFinding): Alert => ({ id: "a1", assetId: finding.assetId, assetName: "Pump", fingerprint: finding.fingerprint, severity: finding.severity, category: finding.category, status: "Open", source: finding.source, metric: finding.metric, title: finding.title, description: finding.description, recommendation: finding.recommendation, triggerType: finding.triggerType, triggerId: finding.triggerId, observedValue: finding.observedValue, thresholdValue: finding.thresholdValue, acknowledgedAt: null, acknowledgedBy: null, resolvedAt: null, resolvedBy: null, createdAt: now, updatedAt: now });

function repository(reading: number | null): AlertRepository {
  return {
    list: vi.fn().mockResolvedValue([]), findById: vi.fn().mockResolvedValue(null), findByFingerprint: vi.fn().mockResolvedValue(null), getHistory: vi.fn().mockResolvedValue([] as AlertHistoryEntry[]),
    getEvaluationData: vi.fn().mockResolvedValue({ asset: { assetId: "MM-000001", status: "Active", name: "Pump", manufacturer: "Mecha", model: "P1", category: "Pump", location: null, createdAt: now }, inspections: [], maintenance: [], readings: reading === null ? [] : [{ recordedAt: now, temperature: reading, vibration: null, voltage: null, current: null, humidity: null }] }),
    findAssetIdForSensor: vi.fn().mockResolvedValue("MM-000001"), upsertFinding: vi.fn(async (finding) => ({ alert: makeAlert(finding), changed: true })), resolveMissing: vi.fn().mockResolvedValue([]), acknowledge: vi.fn(), resolve: vi.fn(),
  };
}

describe("AlertService", () => {
  it("persists findings, recommendations, explanations, and notifications", async () => {
    const alerts = repository(125); const provider = { channel: "Email" as const, send: vi.fn().mockResolvedValue(undefined) };
    const service = new AlertService(alerts, new AlertEngine(), new HealthEngine(), new RecommendationEngine(), { explain: vi.fn().mockResolvedValue("AI explanation") }, new NotificationService([provider]));
    const result = await service.evaluateAsset("MM-000001", "Sensor Reading");
    expect(result[0]).toMatchObject({ severity: "Critical", description: "AI explanation" });
    expect(alerts.upsertFinding).toHaveBeenCalledWith(expect.objectContaining({ metric: "temperature", recommendation: expect.stringContaining("cooling") }));
    expect(provider.send).toHaveBeenCalledTimes(result.length);
  });

  it("resolves prior active alerts when conditions normalize", async () => {
    const alerts = repository(null);
    await new AlertService(alerts, new AlertEngine(), new HealthEngine(), new RecommendationEngine(), { explain: vi.fn() }, new NotificationService([])).evaluateAsset("MM-000001", "Health Recalculation");
    expect(alerts.resolveMissing).toHaveBeenCalledWith("MM-000001", ["MM-000001:failure_probability"], "Alert Engine");
  });
});
