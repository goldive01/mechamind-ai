import type { AlertListQueryDto, CreateAlertDto, UpdateAlertDto } from "@/dto/alert.dto";
import { createLogger, type Logger } from "@/infrastructure/logging/Logger";
import type { AlertRepository } from "@/repositories/AlertRepository";
import { AlertEvaluationService } from "@/services/AlertEvaluationService";
export type { AlertMonitor, AlertTrigger } from "@/services/AlertEvaluationService";
import { AlertEngine } from "@/services/AlertEngine";
import type { AlertExplainer } from "@/services/AlertExplanationService";
import { NotificationService } from "@/services/NotificationService";
import { RecommendationEngine } from "@/services/RecommendationEngine";
import { HealthEngine } from "@/services/HealthEngine";

const severityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 } as const;

export class AlertService extends AlertEvaluationService {
  private readonly repository: AlertRepository;
  private readonly lifecycleLogger: Pick<Logger, "info">;
  constructor(alerts: AlertRepository, engine: AlertEngine, health: HealthEngine, recommendations: RecommendationEngine, explainer: AlertExplainer, notifications: NotificationService, logger: Pick<Logger, "info"> = createLogger("AlertService")) {
    super(alerts, engine, health, recommendations, explainer, notifications);
    this.repository = alerts;
    this.lifecycleLogger = logger;
  }
  async create(input: CreateAlertDto) {
    const alert = await this.repository.create(input);
    this.lifecycleLogger.info("alert created", { alertId: alert.id, assetId: alert.assetId, severity: alert.severity });
    return alert;
  }
  async list(filters: AlertListQueryDto) {
    const alerts = await this.repository.list(filters);
    return alerts.toSorted((a, b) => filters.sort === "oldest" ? a.updatedAt.getTime() - b.updatedAt.getTime() : filters.sort === "severity" ? severityRank[a.severity] - severityRank[b.severity] : filters.sort === "asset" ? a.assetId.localeCompare(b.assetId) : b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  get(id: string) { return this.repository.findById(id); }
  findActive() { return this.repository.findActive(); }
  findByAsset(assetId: string) { return this.repository.findByAsset(assetId); }
  search(query: string) { return this.repository.search(query.trim()); }
  update(id: string, input: UpdateAlertDto) {
    if (input.status) throw new Error("Use acknowledge or resolve to change alert status.");
    return this.repository.update(id, input);
  }
  delete(id: string) { return this.repository.delete(id); }
  history(id: string) { return this.repository.getHistory(id); }
  async acknowledge(id: string, actor: string, note?: string) {
    const current = await this.requireAlert(id);
    if (current.status === "Resolved") throw new Error("Resolved alerts cannot be acknowledged.");
    if (current.status === "Acknowledged") return current;
    const alert = await this.repository.acknowledge(id, actor, note);
    this.lifecycleLogger.info("alert acknowledged", { alertId: alert.id, assetId: alert.assetId, actor });
    return alert;
  }
  async resolve(id: string, actor: string, note?: string) {
    const current = await this.requireAlert(id);
    if (current.status === "Resolved") return current;
    const alert = await this.repository.resolve(id, actor, note);
    this.lifecycleLogger.info("alert resolved", { alertId: alert.id, assetId: alert.assetId, actor });
    return alert;
  }
  private async requireAlert(id: string) {
    const alert = await this.repository.findById(id);
    if (!alert) throw new Error(`Alert ${id} was not found.`);
    return alert;
  }
}
