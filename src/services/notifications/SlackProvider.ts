import { LogNotificationProvider } from "@/services/notifications/LogNotificationProvider";
export class SlackProvider extends LogNotificationProvider { constructor() { super("Slack"); } }
