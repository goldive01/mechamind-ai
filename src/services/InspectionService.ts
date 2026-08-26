import { analysisDtoSchema } from "@/dto/analysis.dto";
import { saveImageUpload } from "@/lib/uploads";
import type { InspectionRepository } from "@/repositories/InspectionRepository";
import type { AlertMonitor } from "@/services/AlertService";
import { createLogger } from "@/infrastructure/logging/Logger";

const logger = createLogger("InspectionService");

export class InspectionService {
  constructor(private readonly inspections: InspectionRepository, private readonly alerts?: AlertMonitor) {}
  async save(file: File, analysisValue: unknown) {
    const analysis = analysisDtoSchema.parse(analysisValue);
    const imagePath = await saveImageUpload(file);
    const persisted = await this.inspections.saveAnalysis(analysis, imagePath);
    try { await this.alerts?.evaluateAsset(persisted.assetId, "Inspection", persisted.inspectionId); await this.alerts?.evaluateAsset(persisted.assetId, "AI Report", persisted.aiReportId); } catch (error) { logger.error("Automatic alert evaluation failed", error, { assetId: persisted.assetId }); }
    return { success: true as const, ...persisted, imagePath };
  }
}
