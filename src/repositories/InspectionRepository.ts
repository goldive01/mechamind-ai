import type { AnalysisDto } from "@/dto/analysis.dto";

export interface InspectionRepository {
  saveAnalysis(analysis: AnalysisDto, imagePath: string): Promise<{ equipmentId: string; assetId: string; inspectionId: string; aiReportId: string }>;
}
