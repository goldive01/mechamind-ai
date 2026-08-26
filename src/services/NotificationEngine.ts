import type { Alert } from "@/domain/entities/Alert";
import { notificationSchema, type NotificationDto } from "@/dto/notification.dto";
import { EscalationEngine } from "@/services/EscalationEngine";
import { NotificationQueue } from "@/services/NotificationQueue";

export class NotificationEngine {
  constructor(private readonly escalations = new EscalationEngine(), private readonly queue = new NotificationQueue(), private readonly now: () => Date = () => new Date()) {}
  schedule(alert: Alert) {
    const createdAt = this.now(); const rule = this.escalations.evaluate(alert.severity); const scheduled: NotificationDto[] = [];
    const initialAt = rule.initialMode === "Daily Summary" ? this.nextDailySummary(createdAt) : createdAt;
    for (const channel of rule.initialChannels) scheduled.push(this.create(alert, channel, rule.initialMode, initialAt, createdAt));
    if (rule.escalateAfterMinutes) { const escalationAt = new Date(createdAt.getTime() + rule.escalateAfterMinutes * 60_000); for (const channel of rule.escalationChannels) scheduled.push(this.create(alert, channel, "Escalation", escalationAt, createdAt)); }
    scheduled.forEach((notification) => this.queue.enqueue(notification)); return scheduled;
  }
  due(now = this.now()) { return this.queue.dequeueDue(now); }
  cancelAlert(alertId: string) { return this.queue.cancelAlert(alertId); }
  pending() { return this.queue.pending(); }
  private create(alert: Alert, channel: NotificationDto["channel"], mode: NotificationDto["mode"], scheduledAt: Date, createdAt: Date) { return notificationSchema.parse({ id: crypto.randomUUID(), alertId: alert.id, assetId: alert.assetId, severity: alert.severity, channel, mode, subject: `${mode}: ${alert.severity} alert for ${alert.assetId}`, message: `${alert.title}. ${alert.description}`, scheduledAt, createdAt }); }
  private nextDailySummary(now: Date) { const next = new Date(now); next.setHours(8, 0, 0, 0); if (next <= now) next.setDate(next.getDate() + 1); return next; }
}
