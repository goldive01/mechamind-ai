import { analysisDtoSchema } from "@/dto/analysis.dto";
import { saveImageUpload } from "@/lib/uploads";
import type { InspectionRepository } from "@/repositories/InspectionRepository";
import type { AlertMonitor } from "@/services/AlertEvaluationService";
import { createLogger } from "@/infrastructure/logging/Logger";
import type { MemoryIngestor } from "@/services/MemoryIngestionService";

const logger = createLogger("InspectionService");

export class InspectionService {
  constructor(private readonly inspections: InspectionRepository, private readonly alerts?: AlertMonitor, private readonly memories?: MemoryIngestor) {}
  async save(file: File, analysisValue: unknown) {
    const analysis = analysisDtoSchema.parse(analysisValue);
    const imagePath = await saveImageUpload(file);
    const persisted = await this.inspections.saveAnalysis(analysis, imagePath);
    try { await this.memories?.ingest({ organisationId: "legacy", sourceType: "Inspection", sourceId: persisted.inspectionId, title: `${analysis.equipmentName} inspection`, summary: analysis.summary, equipmentId: persisted.equipmentId, assetId: persisted.assetId, fault: analysis.maintenanceRecommendations[0] ?? null, confidence: 0.85, occurredAt: new Date(), details: { condition: analysis.estimatedCondition, recommendations: analysis.maintenanceRecommendations, safetyHazards: analysis.safetyHazards }, tags: [{ name: "equipment", value: analysis.equipmentName }, { name: "category", value: analysis.category }] }); await this.memories?.ingest({ organisationId: "legacy", sourceType: "Recommendation", sourceId: persisted.aiReportId, title: `Recommendations for ${analysis.equipmentName}`, summary: analysis.maintenanceRecommendations.join("; ") || analysis.summary, assetId: persisted.assetId, confidence: 0.8, details: { recommendations: analysis.maintenanceRecommendations }, tags: [{ name: "inspection", value: persisted.inspectionId }] }); } catch (error) { logger.error("Engineering memory ingestion failed", error, { assetId: persisted.assetId }); }
    try { await this.alerts?.evaluateAsset(persisted.assetId, "Inspection", persisted.inspectionId); await this.alerts?.evaluateAsset(persisted.assetId, "AI Report", persisted.aiReportId); } catch (error) { logger.error("Automatic alert evaluation failed", error, { assetId: persisted.assetId }); }
    return { success: true as const, ...persisted, imagePath };
  }
}
