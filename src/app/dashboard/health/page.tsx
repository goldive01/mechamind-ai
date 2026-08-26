import { AssetHealthTable } from "@/components/health/AssetHealthTable";
import { FailureRiskWidget } from "@/components/health/FailureRiskWidget";
import { KpiCard } from "@/components/health/KpiCard";
import { UpcomingMaintenance } from "@/components/health/UpcomingMaintenance";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { getAssetHealthRows } from "@/lib/health-data";

export const dynamic = "force-dynamic";

export default async function HealthDashboardPage() {
  const assets = await getAssetHealthRows();
  const averageHealth = assets.length ? Math.round(assets.reduce((sum, asset) => sum + asset.health.overallHealth, 0) / assets.length) : 0;
  const averageSafety = assets.length ? Math.round(assets.reduce((sum, asset) => sum + asset.health.safetyScore, 0) / assets.length) : 0;
  const criticalAssets = assets.filter((asset) => asset.health.maintenancePriority === "Critical").length;
  const improvingAssets = assets.filter((asset) => asset.health.trendDelta > 0).length;

  return <div className="space-y-6"><PageHeader title="Health dashboard" description="Deterministic predictive maintenance insights calculated from inspections, AI findings, and maintenance history." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Fleet health" value={`${averageHealth}%`} detail={`${assets.length} registered assets`} tone={averageHealth >= 80 ? "good" : averageHealth >= 60 ? "warning" : "critical"} /><KpiCard label="Fleet safety" value={`${averageSafety}%`} detail="Average safety score" tone={averageSafety >= 80 ? "good" : averageSafety >= 60 ? "warning" : "critical"} /><KpiCard label="Critical priority" value={String(criticalAssets)} detail="Assets requiring attention" tone={criticalAssets ? "critical" : "good"} /><KpiCard label="Improving trend" value={String(improvingAssets)} detail="Assets improving since last inspection" tone="good" /></div><div className="grid gap-6 xl:grid-cols-2"><FailureRiskWidget assets={assets} /><UpcomingMaintenance assets={assets} limit={5} /></div><Card title="Asset health" description="Current subsystem scores, failure probability, priority, and historical trend for every asset."><AssetHealthTable assets={assets} /></Card></div>;
}
