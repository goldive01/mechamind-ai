import type { NotificationChannel, NotificationDto } from "@/dto/notification.dto";
export interface NotificationProvider { channel: Exclude<NotificationChannel, "Log">; send(notification: NotificationDto): Promise<void> }
