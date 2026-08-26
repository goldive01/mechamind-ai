import type { Alert, AlertSource } from "@/domain/entities/Alert";
import { createLogger, type Logger } from "@/infrastructure/logging/Logger";
import type { AlertRepository } from "@/repositories/AlertRepository";
import { AlertEngine } from "@/services/AlertEngine";
import type { AlertExplainer } from "@/services/AlertExplanationService";
import { HealthEngine } from "@/services/HealthEngine";
import { NotificationService } from "@/services/NotificationService";
import { RecommendationEngine } from "@/services/RecommendationEngine";

export type AlertTrigger = "Sensor Reading" | "Inspection" | "AI Report" | "Health Recalculation";

export interface AlertMonitor {
  evaluateAsset(assetId: string, trigger: AlertTrigger, triggerId?: string): Promise<Alert[]>;
  evaluateSensor(deviceId?: string, macAddress?: string, readingId?: string): Promise<Alert[]>;
}

export class AlertEvaluationService implements AlertMonitor {
  constructor(
    protected readonly alerts: AlertRepository,
    private readonly engine: AlertEngine,
    private readonly health: HealthEngine,
    private readonly recommendations: RecommendationEngine,
    private readonly explainer: AlertExplainer,
    private readonly notifications: NotificationService,
    private readonly logger: Pick<Logger, "info"> = createLogger("AlertEvaluationService"),
  ) {}

  async evaluateSensor(deviceId?: string, macAddress?: string, readingId?: string) {
    const assetId = await this.alerts.findAssetIdForSensor(deviceId, macAddress);
    if (!assetId) {
      this.logger.info("alert evaluation completed", { trigger: "Sensor Reading", readingId, findings: 0, reason: "asset not found" });
      return [];
    }
    return this.evaluateAsset(assetId, "Sensor Reading", readingId);
  }

  async evaluateAsset(assetId: string, trigger: AlertTrigger, triggerId?: string) {
    this.logger.info("alert evaluation started", { assetId, trigger, triggerId });
    const data = await this.alerts.getEvaluationData(assetId);
    if (!data) {
      this.logger.info("alert evaluation completed", { assetId, trigger, triggerId, findings: 0, reason: "asset not found" });
      return [];
    }

    const readings = data.readings.toSorted((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    const latest = { temperature: this.latest(readings, "temperature"), vibration: this.latest(readings, "vibration"), voltage: this.latest(readings, "voltage"), current: this.latest(readings, "current"), humidity: this.latest(readings, "humidity") };
    const health = this.health.calculate(data.inspections, data.maintenance, data.asset.createdAt, readings);
    const source: AlertSource = trigger === "Inspection" ? "Inspection" : trigger === "AI Report" ? "AI Report" : trigger === "Sensor Reading" ? "Sensor" : "Health";
    const findings = this.engine.evaluate({ assetId, reading: latest, health, source, triggerType: trigger, triggerId, sensorTriggerId: trigger === "Sensor Reading" ? triggerId : readings[0]?.id });
    const active: Alert[] = [];

    for (const finding of findings) {
      const existing = await this.alerts.findByFingerprint(finding.fingerprint);
      const description = existing && existing.severity === finding.severity && existing.status !== "Resolved" ? existing.description : await this.explainer.explain(finding);
      const result = await this.alerts.upsertFinding({ ...finding, description, recommendation: this.recommendations.recommend(finding) });
      active.push(result.alert);
      if (result.changed) await this.notifications.notify(result.alert);
    }

    const resolved = await this.alerts.resolveMissing(assetId, findings.map((finding) => finding.fingerprint), "Alert Engine");
    this.logger.info("alert evaluation completed", { assetId, trigger, triggerId, findings: active.length, resolved: resolved.length });
    return active;
  }

  private latest(readings: Array<{ temperature: number | null; vibration: number | null; voltage: number | null; current: number | null; humidity: number | null }>, metric: "temperature" | "vibration" | "voltage" | "current" | "humidity") {
    return readings.find((reading) => reading[metric] !== null)?.[metric] ?? null;
  }
}
