import { DeviceForm } from "@/components/iot/DeviceForm";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { createDevice } from "../actions";

export default async function RegisterDevicePage() {
  const assets = await prisma.asset.findMany({ include: { equipment: true }, orderBy: { assetId: "asc" } });
  return <div className="space-y-6"><PageHeader title="Register device" description="Connect an IoT sensor device to a registered asset." /><DeviceForm action={createDevice} assets={assets.map((asset) => ({ id: asset.id, assetId: asset.assetId, name: asset.equipment.name }))} submitLabel="Register device" cancelHref="/dashboard/devices" /></div>;
}
