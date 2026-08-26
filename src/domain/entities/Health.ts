export interface HealthInspection {
  id: string;
  overallCondition: string;
  notes: string | null;
  inspectionDate: Date;
  aiReport: { diagnosis: string; recommendations: string; riskLevel: string } | null;
}

export interface HealthMaintenanceRecord {
  maintenanceDate: Date;
  maintenanceType: string;
  notes: string | null;
}

export interface HealthSensorReading {
  id?: string;
  recordedAt: Date;
  temperature: number | null;
  humidity: number | null;
  vibration: number | null;
  voltage: number | null;
  current: number | null;
}

export type MaintenancePriority = "Critical" | "High" | "Medium" | "Low";

export interface HealthTrendPoint { date: Date; overall: number; mechanical: number; electrical: number; safety: number }

export interface AssetHealthScore {
  overallHealth: number;
  mechanicalHealth: number;
  electricalHealth: number;
  safetyScore: number;
  failureProbability: number;
  maintenancePriority: MaintenancePriority;
  trend: HealthTrendPoint[];
  trendDelta: number;
  nextMaintenanceDate: Date;
  drivers: string[];
}
