import type { Alert } from "@/domain/entities/Alert";
import { createLogger, type Logger } from "@/infrastructure/logging/Logger";
import { NotificationEngine } from "@/services/NotificationEngine";
import type { NotificationProvider } from "@/services/notifications/NotificationProvider";

export class NotificationService {
  private readonly providerByChannel;
  private timer?: ReturnType<typeof setTimeout>;
  constructor(providers: NotificationProvider[], private readonly engine = new NotificationEngine(), private readonly logger: Pick<Logger, "info" | "warn"> = createLogger("NotificationService")) { this.providerByChannel = new Map(providers.map((provider) => [provider.channel, provider])); }
  async notify(alert: Alert) { const scheduled = this.engine.schedule(alert); await this.dispatchDue(); this.armNext(); return scheduled; }
  async dispatchDue(now?: Date) {
    const due = this.engine.due(now);
    await Promise.all(due.map(async (notification) => {
      if (notification.channel === "Log") { this.logger.info(notification.subject, { alertId: notification.alertId, assetId: notification.assetId, severity: notification.severity, mode: notification.mode }); return; }
      const provider = this.providerByChannel.get(notification.channel);
      if (!provider) { this.logger.warn("Notification provider is not configured", { notificationId: notification.id, channel: notification.channel }); return; }
      try { await provider.send(notification); } catch (error) { this.logger.warn("Notification provider failed", { notificationId: notification.id, channel: notification.channel, error: error instanceof Error ? error.message : error }); }
    }));
    this.armNext();
    return due;
  }
  cancelAlert(alertId: string) { const cancelled = this.engine.cancelAlert(alertId); this.armNext(); return cancelled; }
  pending() { return this.engine.pending(); }
  private armNext() {
    if (this.timer) clearTimeout(this.timer);
    const next = this.engine.pending().toSorted((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];
    if (!next) { this.timer = undefined; return; }
    this.timer = setTimeout(() => { void this.dispatchDue(); }, Math.max(0, next.scheduledAt.getTime() - Date.now()));
    this.timer.unref?.();
  }
}
