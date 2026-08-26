import { Card } from "@/components/Card";

interface KpiCardProps {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "good" | "warning" | "critical";
}

const tones = {
  default: "text-slate-900 dark:text-slate-100",
  good: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
};

export function KpiCard({ label, value, detail, tone = "default" }: KpiCardProps) {
  return <Card><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p><p className={`mt-3 text-3xl font-semibold ${tones[tone]}`}>{value}</p>{detail ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{detail}</p> : null}</Card>;
}
