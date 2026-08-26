import { notFound } from "next/navigation";
import { AssetForm } from "@/components/assets/AssetForm";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { updateAsset } from "../../actions";

export default async function EditAssetPage({ params }: PageProps<"/dashboard/assets/[assetId]/edit">) {
  const { assetId } = await params;
  const asset = await prisma.asset.findUnique({ where: { assetId }, include: { equipment: true } });
  if (!asset) notFound();
  const action = updateAsset.bind(null, asset.assetId);

  return <div className="space-y-6"><PageHeader title={`Edit ${asset.assetId}`} description="Update the registry and linked equipment information." /><AssetForm action={action} submitLabel="Save changes" cancelHref={`/dashboard/assets/${asset.assetId}`} values={{ name: asset.equipment.name, manufacturer: asset.equipment.manufacturer, model: asset.equipment.model, serialNumber: asset.equipment.serialNumber, category: asset.equipment.category, location: asset.equipment.location ?? "", description: asset.equipment.description ?? "", status: asset.status, primaryImage: asset.primaryImage ?? asset.equipment.image ?? "" }} /></div>;
}
