import { createLogger } from "@/infrastructure/logging/Logger";
import type { AlertNotification, NotificationChannel, NotificationProvider } from "@/services/notifications/NotificationProvider";

export class LogNotificationProvider implements NotificationProvider {
  private readonly logger;
  constructor(public readonly channel: NotificationChannel) { this.logger = createLogger(`${channel}Notification`); }
  async send(notification: AlertNotification) { this.logger.info(notification.subject, { alertId: notification.alert.id, assetId: notification.alert.assetId, severity: notification.alert.severity, message: notification.message }); }
}

