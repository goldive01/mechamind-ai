import { SensorChart } from "@/components/iot/SensorChart";

export interface SensorReadingView {
  recordedAt: string;
  temperature: number | null;
  humidity: number | null;
  vibration: number | null;
  voltage: number | null;
  current: number | null;
}

export function SensorChartGrid({ readings }: { readings: SensorReadingView[] }) {
  const series = <K extends keyof Omit<SensorReadingView, "recordedAt">>(key: K) => readings.flatMap((reading) => reading[key] === null ? [] : [{ recordedAt: reading.recordedAt, value: reading[key] as number }]);
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><SensorChart title="Temperature" unit="°C" points={series("temperature")} color="#ef4444" /><SensorChart title="Humidity" unit="%" points={series("humidity")} color="#06b6d4" /><SensorChart title="Vibration" unit="mm/s" points={series("vibration")} color="#10b981" /><SensorChart title="Voltage" unit="V" points={series("voltage")} color="#f59e0b" /><SensorChart title="Current" unit="A" points={series("current")} color="#8b5cf6" /></div>;
}
