import { LogNotificationProvider } from "@/services/notifications/LogNotificationProvider";
export class WebhookProvider extends LogNotificationProvider { constructor() { super("Webhook"); } }
