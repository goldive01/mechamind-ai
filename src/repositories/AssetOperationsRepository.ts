import type { HealthInspection, HealthMaintenanceRecord, HealthSensorReading } from "@/domain/entities/Health";

export interface AssetSummary { assetId: string; status: string; name: string; manufacturer: string; model: string; category: string; location: string | null }
export interface AssetHealthData { asset: AssetSummary & { createdAt: Date }; inspections: HealthInspection[]; maintenance: HealthMaintenanceRecord[]; readings: HealthSensorReading[] }
export interface InspectionReportData { reportId: string; assetId: string; equipmentName: string; manufacturer: string; category: string; condition: string; summary: string; recommendations: string[]; riskLevel: string; inspectionDate: Date; imagePath: string | null }

export interface AssetOperationsRepository {
  search(query: string, limit: number): Promise<AssetSummary[]>;
  getHealthData(assetId: string): Promise<AssetHealthData | null>;
  createMaintenance(input: { assetId: string; maintenanceType: string; performedBy: string; notes?: string; maintenanceDate: Date }): Promise<{ id: string; assetId: string; maintenanceDate: Date }>;
  getInspectionReport(assetId: string, inspectionId?: string): Promise<InspectionReportData | null>;
}

