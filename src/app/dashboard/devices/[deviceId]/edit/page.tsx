import { notFound } from "next/navigation";
import { DeviceForm } from "@/components/iot/DeviceForm";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { updateDevice } from "../../actions";

export default async function EditDevicePage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const [device, assets] = await Promise.all([prisma.sensorDevice.findUnique({ where: { id: deviceId } }), prisma.asset.findMany({ include: { equipment: true }, orderBy: { assetId: "asc" } })]);
  if (!device) notFound();
  return <div className="space-y-6"><PageHeader title={`Edit ${device.deviceName}`} description="Update registration and asset assignment." /><DeviceForm action={updateDevice.bind(null, device.id)} assets={assets.map((asset) => ({ id: asset.id, assetId: asset.assetId, name: asset.equipment.name }))} values={{ assetId: device.assetId, deviceName: device.deviceName, sensorType: device.sensorType, macAddress: device.macAddress, firmwareVersion: device.firmwareVersion }} submitLabel="Save changes" cancelHref={`/dashboard/devices/${device.id}`} /></div>;
}
