import "server-only";
import { prisma } from "@/lib/prisma";
import type { CopilotContextRepository } from "@/repositories/CopilotContextRepository";

export class PrismaCopilotContextRepository implements CopilotContextRepository {
  constructor(private readonly organisationId: string) {}
  async listAssetOptions() {
    const assets = await prisma.asset.findMany({ where: { organisationId: this.organisationId }, select: { assetId: true, equipment: { select: { name: true } } }, orderBy: { assetId: "asc" } });
    return assets.map((asset) => ({ assetId: asset.assetId, name: asset.equipment.name }));
  }
  async findByAssetIds(assetIds: string[]) {
    const assets = await prisma.asset.findMany({
      where: { organisationId: this.organisationId, assetId: { in: [...new Set(assetIds)] } },
      select: {
        assetId: true, status: true, createdAt: true,
        equipment: { select: {
          name: true, manufacturer: true, model: true, serialNumber: true, category: true, location: true, description: true,
          maintenanceRecords: { orderBy: { maintenanceDate: "desc" }, take: 12, select: { maintenanceDate: true, maintenanceType: true, performedBy: true, notes: true } },
          sensorDevices: { select: { deviceName: true, readings: { orderBy: { recordedAt: "desc" }, take: 24, select: { recordedAt: true, temperature: true, humidity: true, vibration: true, voltage: true, current: true } } } },
        } },
        inspections: { orderBy: { inspectionDate: "desc" }, take: 8, select: { id: true, inspectionDate: true, overallCondition: true, notes: true, aiReport: { select: { diagnosis: true, recommendations: true, riskLevel: true } } } },
        alerts: { where: { status: { not: "Resolved" } }, orderBy: { updatedAt: "desc" }, take: 8, select: { severity: true, source: true, title: true, recommendation: true } },
        workOrders: { where: { status: { notIn: ["Completed", "Cancelled"] } }, orderBy: { updatedAt: "desc" }, take: 8, select: { id: true, title: true, description: true, priority: true, status: true, assignedTo: true, scheduledStart: true, dueDate: true, assignedEngineer: { select: { name: true, skills: { select: { skill: { select: { name: true } } } } } }, team: { select: { name: true } }, parts: { select: { quantity: true, deductedAt: true, inventoryItem: { select: { available: true, shelf: true, warehouse: { select: { code: true, name: true } }, sparePart: { select: { partNumber: true, name: true, reorderLevel: true } } } } } } } },
      },
      orderBy: { assetId: "asc" },
    });
    const inventory = await prisma.inventoryItem.findMany({ where: { movements: { some: { asset: { organisationId: this.organisationId } } } }, select: { available: true, shelf: true, warehouse: { select: { name: true } }, sparePart: { select: { partNumber: true, name: true, compatibleAssetTypes: true } } } });
    return assets.map((asset) => ({ ...asset, compatibleInventory: inventory.filter((item) => { try { const types = JSON.parse(item.sparePart.compatibleAssetTypes) as unknown; return Array.isArray(types) && types.some((type) => typeof type === "string" && type.toLowerCase() === asset.equipment.category.toLowerCase()); } catch { return false; } }) }));
  }
}
