import "server-only";
import { prisma } from "@/lib/prisma";
import type { CopilotContextRepository } from "@/repositories/CopilotContextRepository";

export class PrismaCopilotContextRepository implements CopilotContextRepository {
  async listAssetOptions() {
    const assets = await prisma.asset.findMany({ select: { assetId: true, equipment: { select: { name: true } } }, orderBy: { assetId: "asc" } });
    return assets.map((asset) => ({ assetId: asset.assetId, name: asset.equipment.name }));
  }
  async findByAssetIds(assetIds: string[]) {
    return prisma.asset.findMany({
      where: { assetId: { in: [...new Set(assetIds)] } },
      select: {
        assetId: true, status: true, createdAt: true,
        equipment: { select: {
          name: true, manufacturer: true, model: true, serialNumber: true, category: true, location: true, description: true,
          maintenanceRecords: { orderBy: { maintenanceDate: "desc" }, take: 12, select: { maintenanceDate: true, maintenanceType: true, performedBy: true, notes: true } },
          sensorDevices: { select: { deviceName: true, readings: { orderBy: { recordedAt: "desc" }, take: 24, select: { recordedAt: true, temperature: true, humidity: true, vibration: true, voltage: true, current: true } } } },
        } },
        inspections: { orderBy: { inspectionDate: "desc" }, take: 8, select: { id: true, inspectionDate: true, overallCondition: true, notes: true, aiReport: { select: { diagnosis: true, recommendations: true, riskLevel: true } } } },
      },
      orderBy: { assetId: "asc" },
    });
  }
}
