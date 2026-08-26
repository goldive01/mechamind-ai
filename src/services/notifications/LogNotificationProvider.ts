import { createLogger } from "@/infrastructure/logging/Logger";
import type { NotificationChannel, NotificationDto } from "@/dto/notification.dto";
import type { NotificationProvider } from "@/services/notifications/NotificationProvider";

export class LogNotificationProvider implements NotificationProvider {
  private readonly logger;
  constructor(public readonly channel: Exclude<NotificationChannel, "Log">) { this.logger = createLogger(`${channel}Notification`); }
  async send(notification: NotificationDto) { this.logger.info(notification.subject, { notificationId: notification.id, alertId: notification.alertId, assetId: notification.assetId, severity: notification.severity, mode: notification.mode, message: notification.message }); }
}
