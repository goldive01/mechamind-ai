import Link from "next/link";
import { Card } from "@/components/Card";
import type { AssetHealthRow } from "@/components/health/AssetHealthTable";

export function UpcomingMaintenance({ assets, limit }: { assets: AssetHealthRow[]; limit?: number }) {
  const ordered = [...assets].sort((a, b) => a.health.nextMaintenanceDate.getTime() - b.health.nextMaintenanceDate.getTime());
  const visible = limit ? ordered.slice(0, limit) : ordered;
  const now = new Date();

  return <Card title="Upcoming maintenance" description="Recommended service windows based on current health and maintenance history."><div className="divide-y divide-slate-200 dark:divide-slate-800">{visible.map((asset) => { const overdue = asset.health.nextMaintenanceDate < now; return <div key={asset.assetId} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div><Link href={`/dashboard/assets/${asset.assetId}/health`} className="font-medium hover:text-cyan-600">{asset.assetId} · {asset.name}</Link><p className="mt-1 text-xs text-slate-500">{asset.health.maintenancePriority} priority</p></div><div className="text-right"><p className={overdue ? "text-sm font-semibold text-red-600 dark:text-red-400" : "text-sm font-medium"}>{asset.health.nextMaintenanceDate.toLocaleDateString()}</p><p className="mt-1 text-xs text-slate-500">{overdue ? "Overdue" : "Scheduled"}</p></div></div>; })}{visible.length === 0 ? <p className="text-sm text-slate-600 dark:text-slate-400">No maintenance recommendations available.</p> : null}</div></Card>;
}
