import { Card } from "@/components/Card";
import type { AssetHealthRow } from "@/components/health/AssetHealthTable";

export function FailureRiskWidget({ assets }: { assets: AssetHealthRow[] }) {
  const elevated = assets.filter((asset) => asset.health.failureProbability >= 40).sort((a, b) => b.health.failureProbability - a.health.failureProbability);
  const average = assets.length ? Math.round(assets.reduce((sum, asset) => sum + asset.health.failureProbability, 0) / assets.length) : 0;

  return <Card title="Failure risk" description="Assets with elevated deterministic failure probability."><div className="flex items-end justify-between"><div><p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{average}%</p><p className="mt-1 text-sm text-slate-500">Fleet average</p></div><span className="rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700">{elevated.length} elevated</span></div><div className="mt-5 space-y-3">{elevated.slice(0, 4).map((asset) => <div key={asset.assetId} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"><div><p className="text-sm font-medium">{asset.assetId} · {asset.name}</p><p className="mt-1 text-xs text-slate-500">{asset.health.drivers[0]}</p></div><p className="font-semibold text-red-600 dark:text-red-400">{asset.health.failureProbability}%</p></div>)}{elevated.length === 0 ? <p className="text-sm text-slate-600 dark:text-slate-400">No elevated failure risks detected.</p> : null}</div></Card>;
}
