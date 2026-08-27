import type { CopilotContextRepository } from "@/repositories/CopilotContextRepository";
import { HealthEngine } from "@/services/HealthEngine";
import type { CopilotAlert, CopilotAssetContext } from "@/services/copilot/types";
import { parseRecommendation } from "@/dto/recommendation.dto";

function deriveAlerts(health: CopilotAssetContext["health"], readings: CopilotAssetContext["sensorReadings"], inspections: CopilotAssetContext["inspections"]): CopilotAlert[] {
  const alerts: CopilotAlert[] = [];
  if (health.maintenancePriority === "Critical" || health.maintenancePriority === "High") alerts.push({ severity: health.maintenancePriority.toLowerCase() as "critical" | "high", source: "health", message: `${health.maintenancePriority} maintenance priority; calculated failure probability ${health.failureProbability}%.` });
  if (health.safetyScore < 60) alerts.push({ severity: health.safetyScore < 45 ? "critical" : "high", source: "health", message: `Safety score is ${health.safetyScore}/100.` });
  const latest = readings.toSorted((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
  if (latest?.temperature !== null && latest?.temperature !== undefined && latest.temperature > 85) alerts.push({ severity: latest.temperature > 110 ? "critical" : "high", source: "sensor", message: `Latest temperature is ${latest.temperature}°C.` });
  if (latest?.vibration !== null && latest?.vibration !== undefined && latest.vibration > 7) alerts.push({ severity: latest.vibration > 15 ? "critical" : "high", source: "sensor", message: `Latest vibration is ${latest.vibration}.` });
  const risk = inspections[0]?.report?.riskLevel.toLowerCase();
  if (risk === "critical" || risk === "high") alerts.push({ severity: risk, source: "inspection", message: `Latest AI report carries ${risk} risk.` });
  return alerts;
}

export class ContextBuilder {
  constructor(private readonly repository: CopilotContextRepository, private readonly healthEngine = new HealthEngine()) {}
  async build(assetIds: string[]): Promise<CopilotAssetContext[]> {
    if (!assetIds.length) return [];
    const assets = await this.repository.findByAssetIds(assetIds);
    return assets.map((asset) => {
      const readings = asset.equipment.sensorDevices.flatMap((device) => device.readings);
      const score = this.healthEngine.calculate(asset.inspections, asset.equipment.maintenanceRecords, asset.createdAt, readings);
      const context: CopilotAssetContext = {
        asset: { assetId: asset.assetId, status: asset.status, createdAt: asset.createdAt.toISOString() },
        equipment: { name: asset.equipment.name, manufacturer: asset.equipment.manufacturer, model: asset.equipment.model, serialNumber: asset.equipment.serialNumber, category: asset.equipment.category, location: asset.equipment.location, description: asset.equipment.description },
        inspections: asset.inspections.map((inspection) => ({ date: inspection.inspectionDate.toISOString(), condition: inspection.overallCondition, notes: inspection.notes, report: inspection.aiReport })),
        maintenanceHistory: asset.equipment.maintenanceRecords.map((record) => ({ date: record.maintenanceDate.toISOString(), type: record.maintenanceType, performedBy: record.performedBy, notes: record.notes })),
        sensorReadings: asset.equipment.sensorDevices.flatMap((device) => device.readings.map((reading) => ({ deviceName: device.deviceName, recordedAt: reading.recordedAt.toISOString(), temperature: reading.temperature, humidity: reading.humidity, vibration: reading.vibration, voltage: reading.voltage, current: reading.current }))),
        health: { overallHealth: score.overallHealth, mechanicalHealth: score.mechanicalHealth, electricalHealth: score.electricalHealth, safetyScore: score.safetyScore, failureProbability: score.failureProbability, maintenancePriority: score.maintenancePriority, drivers: score.drivers },
        alerts: asset.alerts.map((alert) => ({ severity: alert.severity.toLowerCase() as CopilotAlert["severity"], source: "alert" as const, message: alert.title, recommendation: parseRecommendation(alert.recommendation) ?? alert.recommendation })),
        workOrders: asset.workOrders.map((order) => ({ id: order.id, title: order.title, description: order.description, priority: order.priority, status: order.status, assignedTo: order.assignedEngineer?.name ?? order.assignedTo, assignedEngineer: order.assignedEngineer ? { name: order.assignedEngineer.name, skills: order.assignedEngineer.skills.map((entry) => entry.skill.name) } : null, team: order.team?.name ?? null, scheduledStart: order.scheduledStart?.toISOString() ?? null, dueDate: order.dueDate?.toISOString() ?? null })),
      };
      context.alerts.push(...deriveAlerts(context.health, context.sensorReadings, context.inspections));
      return context;
    });
  }
}
