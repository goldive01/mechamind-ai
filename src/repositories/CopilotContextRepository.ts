export interface CopilotContextRecord {
  assetId: string;
  status: string;
  createdAt: Date;
  equipment: {
    name: string; manufacturer: string; model: string; serialNumber: string; category: string; location: string | null; description: string | null;
    maintenanceRecords: Array<{ maintenanceDate: Date; maintenanceType: string; performedBy: string; notes: string | null }>;
    sensorDevices: Array<{ deviceName: string; readings: Array<{ recordedAt: Date; temperature: number | null; humidity: number | null; vibration: number | null; voltage: number | null; current: number | null }> }>;
  };
  inspections: Array<{ id: string; inspectionDate: Date; overallCondition: string; notes: string | null; aiReport: { diagnosis: string; recommendations: string; riskLevel: string } | null }>;
  alerts: Array<{ severity: string; source: string; title: string; recommendation: string }>;
}

export interface CopilotContextRepository {
  findByAssetIds(assetIds: string[]): Promise<CopilotContextRecord[]>;
  listAssetOptions(): Promise<Array<{ assetId: string; name: string }>>;
}
