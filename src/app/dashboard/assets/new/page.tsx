import { AssetForm } from "@/components/assets/AssetForm";
import { PageHeader } from "@/components/PageHeader";
import { createAsset } from "../actions";

export default function CreateAssetPage() {
  return <div className="space-y-6"><PageHeader title="Create asset" description="Add equipment to the smart asset registry. The next MM asset ID is assigned automatically." /><AssetForm action={createAsset} submitLabel="Create asset" cancelHref="/dashboard/assets" /></div>;
}
