import Link from "next/link";
import { HealthTrendChart } from "@/components/health/HealthTrendChart";
import type { AssetHealthScore } from "@/lib/services/asset-health";

export interface AssetHealthRow {
  assetId: string;
  name: string;
  location: string | null;
  health: AssetHealthScore;
}

export function AssetHealthTable({ assets }: { assets: AssetHealthRow[] }) {
  if (!assets.length) return <p className="text-sm text-slate-600 dark:text-slate-400">No assets are available for health analysis.</p>;

  return <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500 dark:border-slate-800"><tr><th className="pb-3 pr-4">Asset</th><th className="pb-3 px-3">Overall</th><th className="pb-3 px-3">Mechanical</th><th className="pb-3 px-3">Electrical</th><th className="pb-3 px-3">Safety</th><th className="pb-3 px-3">Failure</th><th className="pb-3 px-3">Priority</th><th className="pb-3 pl-3">Trend</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{assets.map((asset) => <tr key={asset.assetId}><td className="py-4 pr-4"><Link href={`/dashboard/assets/${asset.assetId}/health`} className="font-semibold text-cyan-700 hover:text-cyan-600 dark:text-cyan-400">{asset.assetId}</Link><p className="mt-1 font-medium">{asset.name}</p><p className="mt-1 text-xs text-slate-500">{asset.location ?? "Location not set"}</p></td><td className="px-3 font-semibold">{asset.health.overallHealth}%</td><td className="px-3">{asset.health.mechanicalHealth}%</td><td className="px-3">{asset.health.electricalHealth}%</td><td className="px-3">{asset.health.safetyScore}%</td><td className="px-3">{asset.health.failureProbability}%</td><td className="px-3"><span className="rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700">{asset.health.maintenancePriority}</span></td><td className="w-36 pl-3"><HealthTrendChart points={asset.health.trend} compact /></td></tr>)}</tbody></table></div>;
}
