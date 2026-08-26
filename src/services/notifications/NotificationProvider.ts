import type { Alert } from "@/domain/entities/Alert";
export type NotificationChannel = "Email" | "Push" | "SMS";
export interface AlertNotification { channel: NotificationChannel; alert: Alert; subject: string; message: string }
export interface NotificationProvider { channel: NotificationChannel; send(notification: AlertNotification): Promise<void> }

