import type { Alert } from "@/domain/entities/Alert";
import type { NotificationProvider } from "@/services/notifications/NotificationProvider";
export class NotificationService {
  constructor(private readonly providers: NotificationProvider[]) {}
  async notify(alert: Alert) { await Promise.all(this.providers.map((provider) => provider.send({ channel: provider.channel, alert, subject: `${alert.severity} alert for ${alert.assetId}`, message: `${alert.description} ${alert.recommendation}` }))); }
}
