import type { AlertSeverity } from "@/domain/entities/Alert";
import type { HealthInspection, HealthMaintenanceRecord, HealthSensorReading } from "@/domain/entities/Health";

export interface TimelineData {
  asset: { assetId: string; name: string; createdAt: Date };
  inspections: HealthInspection[];
  readings: HealthSensorReading[];
  maintenance: Array<HealthMaintenanceRecord & { id: string; performedBy: string }>;
  alerts: Array<{ id: string; severity: AlertSeverity; status: string; title: string; description: string; recommendation: string; createdAt: Date; updatedAt: Date }>;
}
export interface TimelineRepository { getAssetTimelineData(assetId: string): Promise<TimelineData | null>; }
