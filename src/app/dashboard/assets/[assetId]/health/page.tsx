import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { HealthScoreGrid } from "@/components/health/HealthScoreGrid";
import { HealthTrendChart } from "@/components/health/HealthTrendChart";
import { PageHeader } from "@/components/PageHeader";
import { getAssetHealth } from "@/lib/health-data";

export default async function AssetHealthPage({ params }: PageProps<"/dashboard/assets/[assetId]/health">) {
  const { assetId } = await params;
  const result = await getAssetHealth(assetId);
  if (!result) notFound();
  const { asset, health } = result;

  return <div className="space-y-6"><PageHeader title={`${asset.assetId} health`} description={`Predictive maintenance profile for ${asset.equipment.name}.`} actions={<Button href={`/dashboard/assets/${asset.assetId}`} variant="secondary">Asset details</Button>} /><HealthScoreGrid health={health} /><div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]"><Card title="Health trend" description="Subsystem scores derived from each inspection in chronological order."><HealthTrendChart points={health.trend} /></Card><Card title="Risk drivers" description="Signals contributing to the current maintenance priority."><ul className="space-y-3">{health.drivers.map((driver) => <li key={driver} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/70">{driver}</li>)}</ul><div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Recommended maintenance</p><p className="mt-2 text-lg font-semibold">{health.nextMaintenanceDate.toLocaleDateString()}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{health.maintenancePriority} priority</p></div></Card></div></div>;
}
