import "server-only";
import { prisma } from "@/lib/prisma";
import type { AssetOperationsRepository } from "@/repositories/AssetOperationsRepository";

const healthInclude = { equipment: { include: { maintenanceRecords: { orderBy: { maintenanceDate: "asc" as const } }, sensorDevices: { include: { readings: { orderBy: { recordedAt: "desc" as const }, take: 100 } } } } }, inspections: { orderBy: { inspectionDate: "asc" as const }, include: { aiReport: true } } };

export class PrismaAssetOperationsRepository implements AssetOperationsRepository {
  async search(query: string, limit: number) {
    const assets = await prisma.asset.findMany({ where: query ? { OR: [{ assetId: { contains: query } }, { status: { contains: query } }, { equipment: { is: { name: { contains: query } } } }, { equipment: { is: { manufacturer: { contains: query } } } }, { equipment: { is: { category: { contains: query } } } }, { equipment: { is: { location: { contains: query } } } }] } : {}, include: { equipment: true }, orderBy: { assetId: "asc" }, take: limit });
    return assets.map((asset) => ({ assetId: asset.assetId, status: asset.status, name: asset.equipment.name, manufacturer: asset.equipment.manufacturer, model: asset.equipment.model, category: asset.equipment.category, location: asset.equipment.location }));
  }
  async getHealthData(assetId: string) {
    const asset = await prisma.asset.findUnique({ where: { assetId }, include: healthInclude });
    if (!asset) return null;
    return { asset: { assetId: asset.assetId, status: asset.status, name: asset.equipment.name, manufacturer: asset.equipment.manufacturer, model: asset.equipment.model, category: asset.equipment.category, location: asset.equipment.location, createdAt: asset.createdAt }, inspections: asset.inspections, maintenance: asset.equipment.maintenanceRecords, readings: asset.equipment.sensorDevices.flatMap((device) => device.readings) };
  }
  async createMaintenance(input: { assetId: string; maintenanceType: string; performedBy: string; notes?: string; maintenanceDate: Date }) {
    const asset = await prisma.asset.findUniqueOrThrow({ where: { assetId: input.assetId }, select: { equipmentId: true } });
    const record = await prisma.maintenanceRecord.create({ data: { equipmentId: asset.equipmentId, maintenanceType: input.maintenanceType, performedBy: input.performedBy, notes: input.notes, maintenanceDate: input.maintenanceDate } });
    return { id: record.id, assetId: input.assetId, maintenanceDate: record.maintenanceDate };
  }
  async getInspectionReport(assetId: string, inspectionId?: string) {
    const inspection = await prisma.inspection.findFirst({ where: { asset: { assetId }, ...(inspectionId ? { id: inspectionId } : {}) }, include: { asset: true, equipment: true, aiReport: true, images: true }, orderBy: { inspectionDate: "desc" } });
    if (!inspection?.aiReport) return null;
    return { reportId: inspection.aiReport.id, assetId: inspection.asset.assetId, equipmentName: inspection.equipment.name, manufacturer: inspection.equipment.manufacturer, category: inspection.equipment.category, condition: inspection.overallCondition, summary: inspection.aiReport.diagnosis, recommendations: inspection.aiReport.recommendations.split(" | "), riskLevel: inspection.aiReport.riskLevel, inspectionDate: inspection.inspectionDate, imagePath: inspection.images[0]?.imagePath ?? inspection.equipment.image };
  }
}

