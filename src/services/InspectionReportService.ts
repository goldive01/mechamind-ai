import type { AssetOperationsRepository } from "@/repositories/AssetOperationsRepository";

export class InspectionReportService {
  constructor(private readonly assets: AssetOperationsRepository) {}
  async generate(assetId: string, inspectionId?: string) {
    const report = await this.assets.getInspectionReport(assetId, inspectionId);
    if (!report) return null;
    return { ...report, inspectionDate: report.inspectionDate.toISOString(), generatedAt: new Date().toISOString() };
  }
}

