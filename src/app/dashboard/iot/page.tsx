import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LiveRefresh } from "@/components/iot/LiveRefresh";
import { SensorChartGrid } from "@/components/iot/SensorChartGrid";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function LiveSensorDashboard({ searchParams }: { searchParams: Promise<{ deviceId?: string }> }) {
  const { deviceId = "" } = await searchParams;
  const devices = await prisma.sensorDevice.findMany({ include: { asset: { include: { equipment: true } } }, orderBy: { deviceName: "asc" } });
  const readings = await prisma.sensorReading.findMany({ where: deviceId ? { sensorDeviceId: deviceId } : {}, orderBy: { recordedAt: "desc" }, take: 100 });
  readings.reverse();
  const selectedDevice = devices.find((device) => device.id === deviceId);
  const activeDevices = devices.filter((device) => device.lastSeen !== null).length;

  return <div className="space-y-6"><PageHeader title="Live sensor dashboard" description="Near-real-time telemetry across connected asset devices." actions={<Button href="/dashboard/devices/new">Register device</Button>} /><div className="grid gap-6 lg:grid-cols-[1fr_auto]"><Card><form className="flex flex-col gap-3 sm:flex-row"><select name="deviceId" defaultValue={deviceId} className="min-w-72 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">All devices</option>{devices.map((device) => <option key={device.id} value={device.id}>{device.deviceName} · {device.asset.assetId}</option>)}</select><Button type="submit">Apply</Button></form></Card><Card><LiveRefresh /><p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{activeDevices}/{devices.length} devices active · {readings.length} readings shown</p></Card></div>{selectedDevice ? <Card title={selectedDevice.deviceName} description={`${selectedDevice.asset.assetId} · ${selectedDevice.asset.equipment.name} · ${selectedDevice.macAddress}`} /> : null}<SensorChartGrid readings={readings.map((reading) => ({ ...reading, recordedAt: reading.recordedAt.toISOString() }))} /></div>;
}
