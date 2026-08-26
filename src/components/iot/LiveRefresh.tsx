"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => { const timer = window.setInterval(() => router.refresh(), intervalMs); return () => window.clearInterval(timer); }, [intervalMs, router]);
  return <span className="inline-flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Live · refreshes every {intervalMs / 1000}s</span>;
}
