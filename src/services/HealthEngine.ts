import type { AssetHealthScore, HealthInspection, HealthMaintenanceRecord, HealthSensorReading } from "@/domain/entities/Health";
import { calculateAssetHealth } from "@/lib/services/asset-health";

/** Stateless deterministic health-scoring application service. */
export class HealthEngine {
  calculate(inspections: HealthInspection[], maintenanceRecords: HealthMaintenanceRecord[], createdAt: Date, sensorReadings: HealthSensorReading[] = []): AssetHealthScore {
    return calculateAssetHealth(inspections, maintenanceRecords, createdAt, sensorReadings);
  }
}

