import "server-only";
import { prisma } from "@/lib/prisma";
import type { TimelineData, TimelineRepository } from "@/repositories/TimelineRepository";

export class PrismaTimelineRepository implements TimelineRepository {
  constructor(private readonly organisationId: string) {}
  async getAssetTimelineData(assetId: string) {
    const asset = await prisma.asset.findFirst({ where: { assetId, organisationId: this.organisationId }, select: {
      assetId: true, organisationId: true, organisation: { select: { name: true } }, createdAt: true, equipment: { select: { name: true, site: { select: { name: true } }, building: { select: { name: true } }, area: { select: { name: true } },
        maintenanceRecords: { orderBy: { maintenanceDate: "asc" }, select: { id: true, maintenanceDate: true, maintenanceType: true, notes: true, performedBy: true } },
        sensorDevices: { select: { readings: { orderBy: { recordedAt: "desc" }, take: 250, select: { id: true, recordedAt: true, temperature: true, humidity: true, vibration: true, voltage: true, current: true } } } },
      } },
      inspections: { orderBy: { inspectionDate: "asc" }, select: { id: true, overallCondition: true, notes: true, inspectionDate: true, aiReport: { select: { diagnosis: true, recommendations: true, riskLevel: true } } } },
      alerts: { orderBy: { createdAt: "desc" }, select: { id: true, severity: true, status: true, title: true, description: true, recommendation: true, createdAt: true, updatedAt: true } },
      workOrders: { orderBy: { updatedAt: "desc" }, select: { id: true, title: true, description: true, priority: true, status: true, assignedTo: true, scheduledStart: true, dueDate: true, completedAt: true, createdAt: true, updatedAt: true, assignedEngineer: { select: { id: true, name: true } }, team: { select: { id: true, name: true } } } },
      stockMovements: { orderBy: { createdAt: "desc" }, take: 100, select: { id: true, movementType: true, quantity: true, balanceAfter: true, notes: true, performedBy: true, workOrderId: true, createdAt: true, inventoryItem: { select: { warehouse: { select: { code: true } }, sparePart: { select: { partNumber: true, name: true } } } } } },
    } });
    if (!asset) return null;
    return { asset: { assetId: asset.assetId, name: asset.equipment.name, organisationId: asset.organisationId, organisationName: asset.organisation.name, siteName: asset.equipment.site?.name ?? null, buildingName: asset.equipment.building?.name ?? null, areaName: asset.equipment.area?.name ?? null, createdAt: asset.createdAt }, inspections: asset.inspections, readings: asset.equipment.sensorDevices.flatMap((device) => device.readings), maintenance: asset.equipment.maintenanceRecords, alerts: asset.alerts as TimelineData["alerts"], workOrders: asset.workOrders, stockMovements: asset.stockMovements };
  }
}
