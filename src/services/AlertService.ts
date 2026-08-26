import type { Alert, AlertSource } from "@/domain/entities/Alert";
import type { AlertListQueryDto } from "@/dto/alert.dto";
import type { AlertRepository } from "@/repositories/AlertRepository";
import { AlertEngine } from "@/services/AlertEngine";
import type { AlertExplainer } from "@/services/AlertExplanationService";
import { NotificationService } from "@/services/NotificationService";
import { RecommendationEngine } from "@/services/RecommendationEngine";
import { HealthEngine } from "@/services/HealthEngine";

export type AlertTrigger = "Sensor Reading" | "Inspection" | "AI Report" | "Health Recalculation";
export interface AlertMonitor { evaluateAsset(assetId: string, trigger: AlertTrigger, triggerId?: string): Promise<Alert[]>; evaluateSensor(deviceId?: string, macAddress?: string, readingId?: string): Promise<Alert[]> }
const severityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 } as const;

export class AlertService implements AlertMonitor {
  constructor(private readonly alerts: AlertRepository, private readonly engine: AlertEngine, private readonly health: HealthEngine, private readonly recommendations: RecommendationEngine, private readonly explainer: AlertExplainer, private readonly notifications: NotificationService) {}
  async list(filters: AlertListQueryDto) {
    const alerts = await this.alerts.list(filters);
    return alerts.toSorted((a, b) => filters.sort === "oldest" ? a.updatedAt.getTime() - b.updatedAt.getTime() : filters.sort === "severity" ? severityRank[a.severity] - severityRank[b.severity] : filters.sort === "asset" ? a.assetId.localeCompare(b.assetId) : b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  get(id: string) { return this.alerts.findById(id); }
  history(id: string) { return this.alerts.getHistory(id); }
  acknowledge(id: string, actor: string, note?: string) { return this.alerts.acknowledge(id, actor, note); }
  resolve(id: string, actor: string, note?: string) { return this.alerts.resolve(id, actor, note); }
  async evaluateSensor(deviceId?: string, macAddress?: string, readingId?: string) { const assetId = await this.alerts.findAssetIdForSensor(deviceId, macAddress); return assetId ? this.evaluateAsset(assetId, "Sensor Reading", readingId) : []; }
  async evaluateAsset(assetId: string, trigger: AlertTrigger, triggerId?: string) {
    const data = await this.alerts.getEvaluationData(assetId); if (!data) return [];
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
      active.push(result.alert); if (result.changed) await this.notifications.notify(result.alert);
    }
    await this.alerts.resolveMissing(assetId, findings.map((finding) => finding.fingerprint), "Alert Engine");
    return active;
  }
  private latest(readings: Array<{ temperature: number | null; vibration: number | null; voltage: number | null; current: number | null; humidity: number | null }>, metric: "temperature" | "vibration" | "voltage" | "current" | "humidity") { return readings.find((reading) => reading[metric] !== null)?.[metric] ?? null; }
}
