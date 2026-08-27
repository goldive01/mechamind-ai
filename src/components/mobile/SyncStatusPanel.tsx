"use client";

import { useEffect, useState } from "react";
import { retrySynchronization, synchronizeNow } from "@/app/mobile/actions";
import type { SyncOperation, SyncQueueSummary } from "@/domain/entities/FieldMobile";

export function SyncStatusPanel({ summary, failed }: { summary: SyncQueueSummary; failed: SyncOperation[] }) {
  const [online, setOnline] = useState(true);
  useEffect(() => { const update = () => setOnline(navigator.onLine); update(); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
  const outstanding = summary.pending + summary.syncing + summary.failed;
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-500" : "bg-amber-500"}`}/><h2 className="font-semibold">Synchronization</h2></div><p className="mt-1 text-xs text-slate-500">{online ? "Online" : "Offline"} · {outstanding} outstanding · {summary.synced} synced</p></div><form action={synchronizeNow}><button disabled={!online || !outstanding} className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Sync now</button></form></div>{summary.failed ? <div className="mt-4 space-y-2">{failed.slice(0, 4).map((item) => <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-red-50 p-3 dark:bg-red-950/30"><div className="min-w-0"><p className="truncate text-xs font-medium">{item.entity} · {item.entityId}</p><p className="truncate text-xs text-red-600">{item.lastError}</p></div><form action={retrySynchronization}><input type="hidden" name="operationId" value={item.id}/><button disabled={!online} className="text-xs font-semibold text-cyan-700 disabled:opacity-40">Retry</button></form></div>)}</div> : null}</section>;
}
