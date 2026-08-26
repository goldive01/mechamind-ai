import "server-only";
import { PrismaAlertRepository } from "@/infrastructure/repositories/PrismaAlertRepository";
import { AlertEngine } from "@/services/AlertEngine";
import { AIAlertExplanationService } from "@/services/AlertExplanationService";
import { AlertService } from "@/services/AlertService";
import { HealthEngine } from "@/services/HealthEngine";
import { NotificationService } from "@/services/NotificationService";
import { RecommendationEngine } from "@/services/RecommendationEngine";
import { LogNotificationProvider } from "@/services/notifications/LogNotificationProvider";

export function createAlertService() {
  const recommendations = new RecommendationEngine();
  return new AlertService(new PrismaAlertRepository(), new AlertEngine(), new HealthEngine(), recommendations, new AIAlertExplanationService(recommendations), new NotificationService([new LogNotificationProvider("Email"), new LogNotificationProvider("Push"), new LogNotificationProvider("SMS")]));
}

