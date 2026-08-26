import type { Alert, AlertSource } from "@/domain/entities/Alert";
import type { AlertListQueryDto, CreateAlertDto, UpdateAlertDto } from "@/dto/alert.dto";
import { createLogger, type Logger } from "@/infrastructure/logging/Logger";
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
  constructor(private readonly alerts: AlertRepository, private readonly engine: AlertEngine, private readonly health: HealthEngine, private readonly recommendations: RecommendationEngine, private readonly explainer: AlertExplainer, private readonly notifications: NotificationService, private readonly logger: Pick<Logger, "info"> = createLogger("AlertService")) {}
  async create(input: CreateAlertDto) {
    const alert = await this.alerts.create(input);
    this.logger.info("alert created", { alertId: alert.id, assetId: alert.assetId, severity: alert.severity });
    return alert;
  }
  async list(filters: AlertListQueryDto) {
    const alerts = await this.alerts.list(filters);
    return alerts.toSorted((a, b) => filters.sort === "oldest" ? a.updatedAt.getTime() - b.updatedAt.getTime() : filters.sort === "severity" ? severityRank[a.severity] - severityRank[b.severity] : filters.sort === "asset" ? a.assetId.localeCompare(b.assetId) : b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  get(id: string) { return this.alerts.findById(id); }
  findActive() { return this.alerts.findActive(); }
  findByAsset(assetId: string) { return this.alerts.findByAsset(assetId); }
  search(query: string) { return this.alerts.search(query.trim()); }
  update(id: string, input: UpdateAlertDto) {
    if (input.status) throw new Error("Use acknowledge or resolve to change alert status.");
    return this.alerts.update(id, input);
  }
  delete(id: string) { return this.alerts.delete(id); }
  history(id: string) { return this.alerts.getHistory(id); }
  async acknowledge(id: string, actor: string, note?: string) {
    const current = await this.requireAlert(id);
    if (current.status === "Resolved") throw new Error("Resolved alerts cannot be acknowledged.");
    if (current.status === "Acknowledged") return current;
    const alert = await this.alerts.acknowledge(id, actor, note);
    this.logger.info("alert acknowledged", { alertId: alert.id, assetId: alert.assetId, actor });
    return alert;
  }
  async resolve(id: string, actor: string, note?: string) {
    const current = await this.requireAlert(id);
    if (current.status === "Resolved") return current;
    const alert = await this.alerts.resolve(id, actor, note);
    this.logger.info("alert resolved", { alertId: alert.id, assetId: alert.assetId, actor });
    return alert;
  }
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
      if (!existing) this.logger.info("alert created", { alertId: result.alert.id, assetId: result.alert.assetId, severity: result.alert.severity });
      active.push(result.alert); if (result.changed) await this.notifications.notify(result.alert);
    }
    await this.alerts.resolveMissing(assetId, findings.map((finding) => finding.fingerprint), "Alert Engine");
    return active;
  }
  private latest(readings: Array<{ temperature: number | null; vibration: number | null; voltage: number | null; current: number | null; humidity: number | null }>, metric: "temperature" | "vibration" | "voltage" | "current" | "humidity") { return readings.find((reading) => reading[metric] !== null)?.[metric] ?? null; }
  private async requireAlert(id: string) {
    const alert = await this.alerts.findById(id);
    if (!alert) throw new Error(`Alert ${id} was not found.`);
    return alert;
  }
}
