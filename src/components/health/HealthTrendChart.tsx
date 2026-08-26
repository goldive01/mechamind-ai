import type { HealthTrendPoint } from "@/lib/services/asset-health";

interface HealthTrendChartProps {
  points: HealthTrendPoint[];
  compact?: boolean;
}

function polyline(points: HealthTrendPoint[], key: keyof Pick<HealthTrendPoint, "overall" | "mechanical" | "electrical" | "safety">): string {
  if (!points.length) return "";
  return points.map((point, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 100 - point[key];
    return `${x},${y}`;
  }).join(" ");
}

export function HealthTrendChart({ points, compact = false }: HealthTrendChartProps) {
  if (!points.length) return <p className="text-sm text-slate-600 dark:text-slate-400">No inspection history available for trend analysis.</p>;
  const series = compact ? [{ key: "overall" as const, color: "#06b6d4", label: "Overall" }] : [
    { key: "overall" as const, color: "#06b6d4", label: "Overall" },
    { key: "mechanical" as const, color: "#10b981", label: "Mechanical" },
    { key: "electrical" as const, color: "#f59e0b", label: "Electrical" },
    { key: "safety" as const, color: "#ef4444", label: "Safety" },
  ];

  return <div><svg viewBox="0 0 100 100" role="img" aria-label="Asset health trend" className={compact ? "h-16 w-full" : "h-64 w-full"} preserveAspectRatio="none"><path d="M0 25H100 M0 50H100 M0 75H100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />{series.map((item) => <polyline key={item.key} points={polyline(points, item.key)} fill="none" stroke={item.color} strokeWidth={compact ? 3 : 1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />)}</svg>{compact ? null : <div className="mt-4 flex flex-wrap gap-4">{series.map((item) => <span key={item.key} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>}</div>;
}
