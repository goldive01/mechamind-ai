import "server-only";
import type { AnalysisDto } from "@/dto/analysis.dto";
import { allocateAssetId } from "@/lib/assets";
import { prisma } from "@/lib/prisma";
import type { InspectionRepository } from "@/repositories/InspectionRepository";

export class PrismaInspectionRepository implements InspectionRepository {
  async saveAnalysis(analysis: AnalysisDto, imagePath: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.equipment.findFirst({ where: { name: analysis.equipmentName }, include: { asset: true } });
      const equipment = existing ?? await tx.equipment.create({ data: { name: analysis.equipmentName, manufacturer: analysis.manufacturer, model: "AI Scan", serialNumber: `${analysis.equipmentName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`, category: analysis.category, description: analysis.summary, location: "Auto-detected", image: imagePath }, include: { asset: true } });
      const asset = equipment.asset ?? await tx.asset.create({ data: { assetId: await allocateAssetId(tx), equipmentId: equipment.id, primaryImage: imagePath } });
      const inspection = await tx.inspection.create({ data: { equipmentId: equipment.id, assetId: asset.id, overallCondition: analysis.estimatedCondition, notes: analysis.summary, inspectionDate: new Date(), images: { create: [{ imagePath }] }, aiReport: { create: { diagnosis: analysis.summary, assetId: asset.id, recommendations: analysis.maintenanceRecommendations.join(" | "), riskLevel: analysis.safetyHazards.length > 0 ? "High" : "Medium" } } }, include: { aiReport: true } });
      return { equipmentId: equipment.id, assetId: asset.assetId, inspectionId: inspection.id, aiReportId: inspection.aiReport!.id };
    });
  }
}
