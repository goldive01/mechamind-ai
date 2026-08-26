import { KpiCard } from "@/components/health/KpiCard";
import type { AssetHealthScore } from "@/lib/services/asset-health";

function scoreTone(score: number): "good" | "warning" | "critical" {
  return score >= 80 ? "good" : score >= 60 ? "warning" : "critical";
}

export function HealthScoreGrid({ health }: { health: AssetHealthScore }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><KpiCard label="Overall health" value={`${health.overallHealth}%`} tone={scoreTone(health.overallHealth)} /><KpiCard label="Mechanical health" value={`${health.mechanicalHealth}%`} tone={scoreTone(health.mechanicalHealth)} /><KpiCard label="Electrical health" value={`${health.electricalHealth}%`} tone={scoreTone(health.electricalHealth)} /><KpiCard label="Safety score" value={`${health.safetyScore}%`} tone={scoreTone(health.safetyScore)} /><KpiCard label="Failure probability" value={`${health.failureProbability}%`} tone={health.failureProbability >= 65 ? "critical" : health.failureProbability >= 40 ? "warning" : "good"} /><KpiCard label="Maintenance priority" value={health.maintenancePriority} tone={health.maintenancePriority === "Critical" ? "critical" : health.maintenancePriority === "High" ? "warning" : "good"} /></div>;
}
