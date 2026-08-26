import { describe, expect, it, vi } from "vitest";
import type { Alert, AlertHistoryEntry } from "@/domain/entities/Alert";
import type { AlertRepository, PersistAlertFinding } from "@/repositories/AlertRepository";
import { AlertEngine } from "@/services/AlertEngine";
import { AlertEvaluationService } from "@/services/AlertEvaluationService";
import { HealthEngine } from "@/services/HealthEngine";
import { NotificationService } from "@/services/NotificationService";
import { RecommendationEngine } from "@/services/RecommendationEngine";

const now = new Date("2026-08-26T10:00:00Z");
const healthyScore = { overallHealth: 90, safetyScore: 90, maintenanceScore: 90, reliabilityScore: 90, failureProbability: 5, trend: [], trendDelta: 0, hasInspectionData: true };
const health = { calculate: vi.fn(() => healthyScore) } as unknown as HealthEngine;
const makeAlert = (finding: PersistAlertFinding): Alert => ({ id: "alert-1", assetId: finding.assetId, assetName: "Pump", fingerprint: finding.fingerprint, severity: finding.severity, category: finding.category, status: "Open", source: finding.source, metric: finding.metric, title: finding.title, description: finding.description, recommendation: finding.recommendation, triggerType: finding.triggerType, triggerId: finding.triggerId, observedValue: finding.observedValue, thresholdValue: finding.thresholdValue, acknowledgedAt: null, acknowledgedBy: null, resolvedAt: null, resolvedBy: null, createdAt: now, updatedAt: now });

function repository(reading: { temperature?: number; vibration?: number; voltage?: number; current?: number; humidity?: number } = {}): AlertRepository {
  const normalized = { temperature: null, vibration: null, voltage: null, current: null, humidity: null, ...reading };
  return {
    create: vi.fn(), list: vi.fn(), findById: vi.fn(), findActive: vi.fn(), findByAsset: vi.fn(), update: vi.fn(), delete: vi.fn(), search: vi.fn(),
    findByFingerprint: vi.fn().mockResolvedValue(null), getHistory: vi.fn().mockResolvedValue([] as AlertHistoryEntry[]), findAssetIdForSensor: vi.fn().mockResolvedValue("MM-000001"),
    getEvaluationData: vi.fn().mockResolvedValue({ asset: { assetId: "MM-000001", status: "Active", name: "Pump", manufacturer: "Mecha", model: "P1", category: "Pump", location: null, createdAt: now }, inspections: [], maintenance: [], readings: [normalized] .map((values) => ({ ...values, recordedAt: now })) }),
    upsertFinding: vi.fn(async (finding) => ({ alert: makeAlert(finding), changed: true })), resolveMissing: vi.fn().mockResolvedValue([]), acknowledge: vi.fn(), resolve: vi.fn(),
  };
}

const service = (alerts: AlertRepository, logger = { info: vi.fn() }, explainer = { explain: vi.fn().mockResolvedValue("Threshold exceeded") }) => ({
  instance: new AlertEvaluationService(alerts, new AlertEngine(), health, new RecommendationEngine(), explainer, new NotificationService([]), logger), logger, explainer,
});

describe("AlertEvaluationService", () => {
  it("creates an alert only for an exceeded threshold and logs the evaluation", async () => {
    const alerts = repository({ temperature: 121 });
    const { instance, logger } = service(alerts);
    const result = await instance.evaluateAsset("MM-000001", "Sensor Reading", "reading-1");
    expect(result).toHaveLength(1);
    expect(alerts.upsertFinding).toHaveBeenCalledWith(expect.objectContaining({ fingerprint: "MM-000001:temperature", severity: "Critical" }));
    expect(logger.info).toHaveBeenCalledWith("alert evaluation started", expect.objectContaining({ assetId: "MM-000001" }));
    expect(logger.info).toHaveBeenCalledWith("alert evaluation completed", expect.objectContaining({ findings: 1 }));
  });

  it("reuses an active fingerprint instead of creating a duplicate alert", async () => {
    const alerts = repository({ vibration: 13 });
    const existing = makeAlert({ assetId: "MM-000001", fingerprint: "MM-000001:vibration", severity: "High", category: "Sensor Telemetry", source: "Sensor", metric: "vibration", title: "High vibration alert", description: "Existing explanation", recommendation: "Inspect bearings", triggerType: "Sensor Reading", triggerId: "reading-1", observedValue: 13, thresholdValue: 12 });
    vi.mocked(alerts.findByFingerprint).mockResolvedValue(existing);
    vi.mocked(alerts.upsertFinding).mockResolvedValue({ alert: existing, changed: false });
    const { instance, explainer } = service(alerts);
    await instance.evaluateAsset("MM-000001", "Sensor Reading", "reading-2");
    expect(alerts.create).not.toHaveBeenCalled();
    expect(alerts.upsertFinding).toHaveBeenCalledTimes(1);
    expect(explainer.explain).not.toHaveBeenCalled();
  });

  it("automatically resolves active alerts after values return to normal", async () => {
    const alerts = repository({ temperature: 45, vibration: 2, voltage: 230, current: 30, humidity: 50 });
    vi.mocked(alerts.resolveMissing).mockResolvedValue([{ id: "old-alert" } as Alert]);
    const { instance, logger } = service(alerts);
    expect(await instance.evaluateAsset("MM-000001", "Health Recalculation")).toEqual([]);
    expect(alerts.resolveMissing).toHaveBeenCalledWith("MM-000001", [], "Alert Engine");
    expect(logger.info).toHaveBeenCalledWith("alert evaluation completed", expect.objectContaining({ resolved: 1 }));
  });

  it("evaluates all sensor and health thresholds", () => {
    const findings = new AlertEngine().evaluate({ assetId: "MM-000001", reading: { temperature: 121, vibration: 19, voltage: 50, current: 201, humidity: 98 }, health: { ...healthyScore, overallHealth: 20, failureProbability: 85 } });
    expect(new Set(findings.map(({ metric }) => metric))).toEqual(new Set(["temperature", "vibration", "voltage", "current", "humidity", "overall_health", "failure_probability"]));
  });
});
