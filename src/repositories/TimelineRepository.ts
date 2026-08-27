import type { AlertSeverity } from "@/domain/entities/Alert";
import type { HealthInspection, HealthMaintenanceRecord, HealthSensorReading } from "@/domain/entities/Health";

export interface TimelineData {
  asset: { assetId: string; name: string; createdAt: Date };
  inspections: HealthInspection[];
  readings: HealthSensorReading[];
  maintenance: Array<HealthMaintenanceRecord & { id: string; performedBy: string }>;
  alerts: Array<{ id: string; severity: AlertSeverity; status: string; title: string; description: string; recommendation: string; createdAt: Date; updatedAt: Date }>;
  workOrders: Array<{ id: string; title: string; description: string; priority: string; status: string; assignedTo: string | null; scheduledStart: Date | null; dueDate: Date | null; completedAt: Date | null; createdAt: Date; updatedAt: Date; assignedEngineer?: { id: string; name: string } | null; team?: { id: string; name: string } | null }>;
}
export interface TimelineRepository { getAssetTimelineData(assetId: string): Promise<TimelineData | null>; }
