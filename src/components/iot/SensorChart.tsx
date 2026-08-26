export interface SensorPoint { recordedAt: string; value: number; }
interface SensorChartProps { title: string; unit: string; points: SensorPoint[]; color: string; }

function coordinates(points: SensorPoint[]): string {
  if (!points.length) return "";
  const values = points.map((point) => point.value); const minimum = Math.min(...values); const maximum = Math.max(...values); const range = maximum - minimum || 1;
  return points.map((point, index) => `${points.length === 1 ? 50 : (index / (points.length - 1)) * 100},${90 - ((point.value - minimum) / range) * 80}`).join(" ");
}

export function SensorChart({ title, unit, points, color }: SensorChartProps) {
  const latest = points.at(-1)?.value;
  return <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-slate-500">{points.length} readings</p></div><p className="text-lg font-semibold">{latest === undefined ? "—" : `${latest.toFixed(1)} ${unit}`}</p></div>{points.length ? <svg viewBox="0 0 100 100" role="img" aria-label={`${title} readings`} className="mt-4 h-32 w-full" preserveAspectRatio="none"><path d="M0 25H100 M0 50H100 M0 75H100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" /><polyline points={coordinates(points)} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" /></svg> : <p className="mt-8 text-sm text-slate-500">No data available.</p>}</div>;
}
