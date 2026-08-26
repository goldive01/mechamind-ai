import "server-only";
import { PrismaAlertRepository } from "@/infrastructure/repositories/PrismaAlertRepository";
import { AlertEngine } from "@/services/AlertEngine";
import { AIAlertExplanationService } from "@/services/AlertExplanationService";
import { AlertService } from "@/services/AlertService";
import { HealthEngine } from "@/services/HealthEngine";
import { NotificationService } from "@/services/NotificationService";
import { NotificationEngine } from "@/services/NotificationEngine";
import { NotificationQueue } from "@/services/NotificationQueue";
import { EscalationEngine } from "@/services/EscalationEngine";
import { OpenAIRecommendationEnhancer, RecommendationEngine } from "@/services/RecommendationEngine";
import { EmailProvider } from "@/services/notifications/EmailProvider";
import { PushProvider } from "@/services/notifications/PushProvider";
import { SMSProvider } from "@/services/notifications/SMSProvider";
import { TeamsProvider } from "@/services/notifications/TeamsProvider";
import { SlackProvider } from "@/services/notifications/SlackProvider";
import { WebhookProvider } from "@/services/notifications/WebhookProvider";

const notificationQueue = new NotificationQueue();
const notificationEngine = new NotificationEngine(new EscalationEngine(), notificationQueue);
const notificationService = new NotificationService([new EmailProvider(), new PushProvider(), new SMSProvider(), new TeamsProvider(), new SlackProvider(), new WebhookProvider()], notificationEngine);

export function createAlertService() {
  const recommendations = new RecommendationEngine(undefined, new OpenAIRecommendationEnhancer());
  return new AlertService(new PrismaAlertRepository(), new AlertEngine(), new HealthEngine(), recommendations, new AIAlertExplanationService(recommendations), notificationService);
}
