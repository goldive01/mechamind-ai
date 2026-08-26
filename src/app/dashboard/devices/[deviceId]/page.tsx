import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LiveRefresh } from "@/components/iot/LiveRefresh";
import { SensorChartGrid } from "@/components/iot/SensorChartGrid";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function DeviceDetailsPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const device = await prisma.sensorDevice.findUnique({ where: { id: deviceId }, include: { asset: { include: { equipment: true } }, readings: { orderBy: { recordedAt: "desc" }, take: 100 } } });
  if (!device) notFound();
  const chronologicalReadings = [...device.readings].reverse();
  return <div className="space-y-6"><PageHeader title={device.deviceName} description={`${device.asset.assetId} · ${device.asset.equipment.name}`} actions={<div className="flex gap-3"><Button href="/dashboard/iot" variant="secondary">Live dashboard</Button><Button href={`/dashboard/devices/${device.id}/edit`}>Edit device</Button></div>} /><div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]"><Card title="Device information"><dl className="grid gap-4 sm:grid-cols-2">{[["MAC address", device.macAddress], ["Sensor type", device.sensorType], ["Firmware", device.firmwareVersion], ["Last seen", device.lastSeen?.toLocaleString() ?? "Never"]].map(([label, value]) => <div key={label}><dt className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl></Card><Card title="Live status"><LiveRefresh /><p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Showing the latest {device.readings.length} readings from this device.</p></Card></div><SensorChartGrid readings={chronologicalReadings.map((reading) => ({ ...reading, recordedAt: reading.recordedAt.toISOString() }))} /></div>;
}
