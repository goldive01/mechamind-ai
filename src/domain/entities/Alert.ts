import type { AssetHealthScore } from "@/domain/entities/Health";

export type AlertSeverity = "Critical" | "High" | "Medium" | "Low";
export type AlertStatus = "Open" | "Acknowledged" | "Resolved";
export type AlertMetric = "temperature" | "vibration" | "voltage" | "current" | "humidity" | "health_trend" | "failure_probability";
export type AlertSource = "Sensor" | "Health" | "Inspection" | "AI Report";

export interface Alert {
  id: string; assetId: string; assetName: string; fingerprint: string; severity: AlertSeverity; category: string; status: AlertStatus; source: AlertSource; metric: AlertMetric;
  title: string; description: string; recommendation: string; triggerType: string | null; triggerId: string | null; observedValue: number | null; thresholdValue: number | null;
  acknowledgedAt: Date | null; acknowledgedBy: string | null; resolvedAt: Date | null; resolvedBy: string | null; createdAt: Date; updatedAt: Date;
}

export interface AlertHistoryEntry { id: string; alertId: string; eventType: string; fromValue: string | null; toValue: string | null; actor: string | null; note: string | null; createdAt: Date }
export interface AlertFinding { assetId: string; fingerprint: string; severity: AlertSeverity; category: string; source: AlertSource; metric: AlertMetric; title: string; triggerType: string | null; triggerId: string | null; observedValue: number; thresholdValue: number }
export interface AlertEvaluationInput {
  assetId: string;
  reading?: { temperature: number | null; vibration: number | null; voltage: number | null; current: number | null; humidity: number | null } | null;
  health?: Pick<AssetHealthScore, "trendDelta" | "failureProbability" | "overallHealth" | "safetyScore"> | null;
  source?: AlertSource;
  triggerType?: string;
  triggerId?: string;
  sensorTriggerId?: string;
}
