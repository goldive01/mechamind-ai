import "server-only";
import { prisma } from "@/lib/prisma";
import type { TimelineData, TimelineRepository } from "@/repositories/TimelineRepository";

export class PrismaTimelineRepository implements TimelineRepository {
  async getAssetTimelineData(assetId: string) {
    const asset = await prisma.asset.findUnique({ where: { assetId }, select: {
      assetId: true, createdAt: true, equipment: { select: { name: true,
        maintenanceRecords: { orderBy: { maintenanceDate: "asc" }, select: { id: true, maintenanceDate: true, maintenanceType: true, notes: true, performedBy: true } },
        sensorDevices: { select: { readings: { orderBy: { recordedAt: "desc" }, take: 250, select: { id: true, recordedAt: true, temperature: true, humidity: true, vibration: true, voltage: true, current: true } } } },
      } },
      inspections: { orderBy: { inspectionDate: "asc" }, select: { id: true, overallCondition: true, notes: true, inspectionDate: true, aiReport: { select: { diagnosis: true, recommendations: true, riskLevel: true } } } },
      alerts: { orderBy: { createdAt: "desc" }, select: { id: true, severity: true, status: true, title: true, description: true, recommendation: true, createdAt: true, updatedAt: true } },
    } });
    if (!asset) return null;
    return { asset: { assetId: asset.assetId, name: asset.equipment.name, createdAt: asset.createdAt }, inspections: asset.inspections, readings: asset.equipment.sensorDevices.flatMap((device) => device.readings), maintenance: asset.equipment.maintenanceRecords, alerts: asset.alerts as TimelineData["alerts"] };
  }
}
