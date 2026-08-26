import type { NotificationDto } from "@/dto/notification.dto";

export class NotificationQueue {
  private items: NotificationDto[] = [];
  enqueue(notification: NotificationDto) { this.items.push(notification); }
  dequeueDue(now = new Date()) { const due = this.items.filter((item) => item.scheduledAt <= now); this.items = this.items.filter((item) => item.scheduledAt > now); return due.toSorted((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()); }
  cancelAlert(alertId: string) { const count = this.items.filter((item) => item.alertId === alertId).length; this.items = this.items.filter((item) => item.alertId !== alertId); return count; }
  pending() { return [...this.items]; }
}
