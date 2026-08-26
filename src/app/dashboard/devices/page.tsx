import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function DevicesPage() {
  const devices = await prisma.sensorDevice.findMany({ include: { asset: { include: { equipment: true } }, _count: { select: { readings: true } } }, orderBy: { deviceName: "asc" } });
  return <div className="space-y-6"><PageHeader title="Devices" description="Register and manage IoT sensor devices linked to smart assets." actions={<Button href="/dashboard/devices/new">Register device</Button>} /><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{devices.map((device) => <Link key={device.id} href={`/dashboard/devices/${device.id}`} className="block transition hover:-translate-y-0.5"><Card className="h-full"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">{device.asset.assetId}</p><h2 className="mt-2 text-lg font-semibold">{device.deviceName}</h2></div><span className="rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700">{device.sensorType}</span></div><div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400"><p>{device.asset.equipment.name}</p><p>{device.macAddress}</p><p>Firmware {device.firmwareVersion}</p><p>{device._count.readings} readings · Last seen {device.lastSeen?.toLocaleString() ?? "Never"}</p></div></Card></Link>)}</div>{devices.length === 0 ? <Card><p className="text-sm text-slate-600 dark:text-slate-400">No devices registered.</p></Card> : null}</div>;
}
