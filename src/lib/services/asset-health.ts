import type { AssetHealthScore, HealthInspection, HealthMaintenanceRecord, HealthSensorReading, HealthTrendPoint, MaintenancePriority } from "@/domain/entities/Health";
export type { AssetHealthScore, HealthInspection, HealthMaintenanceRecord, HealthSensorReading, HealthTrendPoint, MaintenancePriority } from "@/domain/entities/Health";

const conditionScores: Record<string, number> = {
  excellent: 96,
  good: 84,
  fair: 66,
  "needs attention": 44,
  poor: 30,
  critical: 16,
};

const mechanicalTerms = ["vibration", "bearing", "shaft", "seal", "wear", "leak", "hydraulic", "alignment", "lubrication", "crack"];
const electricalTerms = ["voltage", "current", "wiring", "cable", "electrical", "motor", "grounding", "circuit", "battery", "overheat"];
const safetyTerms = ["hazard", "unsafe", "danger", "critical", "fire", "exposed", "loose", "leak", "seepage", "guard"];
const faultTerms = ["fault", "failure", "degradation", "damage", "issue", "defect", "imbalance", "worn"];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countTerms(text: string, terms: string[]): number {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
}

function conditionScore(condition: string): number {
  return conditionScores[condition.trim().toLowerCase()] ?? 60;
}

function riskPenalty(riskLevel?: string): number {
  switch (riskLevel?.toLowerCase()) {
    case "critical": return 36;
    case "high": return 26;
    case "medium": return 13;
    case "low": return 4;
    default: return 8;
  }
}

function maintenanceAdjustment(date: Date, maintenance: HealthMaintenanceRecord[]): number {
  const latest = maintenance.filter((record) => record.maintenanceDate <= date).at(-1);
  if (!latest) return -8;
  const ageDays = Math.max(0, (date.getTime() - latest.maintenanceDate.getTime()) / 86_400_000);
  if (ageDays <= 30) return 9;
  if (ageDays <= 90) return 5;
  if (ageDays <= 180) return 0;
  if (ageDays <= 365) return -6;
  return -12;
}

function scoreInspection(inspection: HealthInspection, maintenance: HealthMaintenanceRecord[]): HealthTrendPoint {
  const base = conditionScore(inspection.overallCondition);
  const reportText = `${inspection.notes ?? ""} ${inspection.aiReport?.diagnosis ?? ""} ${inspection.aiReport?.recommendations ?? ""}`.toLowerCase();
  const mechanicalSignals = countTerms(reportText, mechanicalTerms);
  const electricalSignals = countTerms(reportText, electricalTerms);
  const safetySignals = countTerms(reportText, safetyTerms);
  const faults = countTerms(reportText, faultTerms);
  const maintenanceEffect = maintenanceAdjustment(inspection.inspectionDate, maintenance);
  const risk = riskPenalty(inspection.aiReport?.riskLevel);

  const mechanical = clamp(base + maintenanceEffect - mechanicalSignals * 7 - faults * 3 - risk * 0.2);
  const electrical = clamp(base + maintenanceEffect - electricalSignals * 8 - faults * 2 - risk * 0.2);
  const safety = clamp(100 - risk - safetySignals * 8 - faults * 2 + Math.max(0, maintenanceEffect / 2));
  const overall = clamp(mechanical * 0.4 + electrical * 0.3 + safety * 0.3);

  return { date: inspection.inspectionDate, overall, mechanical, electrical, safety };
}

export function calculateAssetHealth(
  inspections: HealthInspection[],
  maintenanceRecords: HealthMaintenanceRecord[],
  createdAt: Date,
  sensorReadings: HealthSensorReading[] = [],
): AssetHealthScore {
  const orderedInspections = [...inspections].sort((a, b) => a.inspectionDate.getTime() - b.inspectionDate.getTime());
  const orderedMaintenance = [...maintenanceRecords].sort((a, b) => a.maintenanceDate.getTime() - b.maintenanceDate.getTime());
  const trend = orderedInspections.map((inspection) => scoreInspection(inspection, orderedMaintenance));
  const latest = trend.at(-1) ?? { date: createdAt, overall: 60, mechanical: 60, electrical: 60, safety: 70 };
  const previous = trend.at(-2);
  const latestSensor = [...sensorReadings].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()).at(-1);
  let mechanicalSensorPenalty = 0;
  let electricalSensorPenalty = 0;
  let safetySensorPenalty = 0;
  if (latestSensor) {
    if (latestSensor.vibration !== null && latestSensor.vibration > 7) mechanicalSensorPenalty += Math.min(35, (latestSensor.vibration - 7) * 3);
    if (latestSensor.temperature !== null && latestSensor.temperature > 85) electricalSensorPenalty += Math.min(25, (latestSensor.temperature - 85) * 0.6);
    if (latestSensor.voltage !== null && (latestSensor.voltage > 500 || (latestSensor.voltage > 0 && latestSensor.voltage < 100))) electricalSensorPenalty += 14;
    if (latestSensor.current !== null && latestSensor.current > 100) electricalSensorPenalty += Math.min(20, (latestSensor.current - 100) * 0.1);
    if (latestSensor.humidity !== null && latestSensor.humidity > 90) safetySensorPenalty += 8;
    if (latestSensor.temperature !== null && latestSensor.temperature > 110) safetySensorPenalty += 20;
    if (latestSensor.vibration !== null && latestSensor.vibration > 15) safetySensorPenalty += 15;
  }
  const current = {
    date: latestSensor?.recordedAt ?? latest.date,
    mechanical: clamp(latest.mechanical - mechanicalSensorPenalty),
    electrical: clamp(latest.electrical - electricalSensorPenalty),
    safety: clamp(latest.safety - safetySensorPenalty),
    overall: 0,
  };
  current.overall = clamp(current.mechanical * 0.4 + current.electrical * 0.3 + current.safety * 0.3);
  const healthTrend = latestSensor ? [...trend, current] : trend;
  const comparisonPoint = latestSensor ? latest : previous;
  const trendDelta = comparisonPoint ? current.overall - comparisonPoint.overall : 0;
  const latestInspection = orderedInspections.at(-1);
  const latestText = `${latestInspection?.notes ?? ""} ${latestInspection?.aiReport?.diagnosis ?? ""} ${latestInspection?.aiReport?.recommendations ?? ""}`.toLowerCase();
  const faults = countTerms(latestText, faultTerms);
  const hazards = countTerms(latestText, safetyTerms);
  const failureProbability = clamp(
    100 - current.overall + faults * 4 + hazards * 3 + (mechanicalSensorPenalty + electricalSensorPenalty + safetySensorPenalty) * 0.4 + Math.max(0, -trendDelta) * 1.5,
  );
  const maintenancePriority: MaintenancePriority = failureProbability >= 65 || current.safety < 45
    ? "Critical"
    : failureProbability >= 40 || current.overall < 60
      ? "High"
      : failureProbability >= 20 || current.overall < 78
        ? "Medium"
        : "Low";
  const intervalDays = { Critical: 7, High: 14, Medium: 30, Low: 90 }[maintenancePriority];
  const lastMaintenanceDate = orderedMaintenance.at(-1)?.maintenanceDate ?? latestInspection?.inspectionDate ?? createdAt;
  const nextMaintenanceDate = new Date(lastMaintenanceDate.getTime() + intervalDays * 86_400_000);
  const drivers: string[] = [];
  if (hazards > 0) drivers.push(`${hazards} safety indicator${hazards === 1 ? "" : "s"}`);
  if (faults > 0) drivers.push(`${faults} fault indicator${faults === 1 ? "" : "s"}`);
  if (trendDelta < 0) drivers.push(`${Math.abs(trendDelta)} point health decline`);
  if (!orderedMaintenance.length) drivers.push("No maintenance history");
  if (mechanicalSensorPenalty > 0) drivers.push("Elevated live vibration");
  if (electricalSensorPenalty > 0) drivers.push("Live electrical or temperature anomaly");
  if (safetySensorPenalty > 0) drivers.push("Live sensor safety threshold exceeded");
  if (!drivers.length) drivers.push("No material risk indicators");

  return {
    overallHealth: current.overall,
    mechanicalHealth: current.mechanical,
    electricalHealth: current.electrical,
    safetyScore: current.safety,
    failureProbability,
    maintenancePriority,
    trend: healthTrend,
    trendDelta,
    nextMaintenanceDate,
    drivers,
  };
}
