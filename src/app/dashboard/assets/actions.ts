"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assetInputFromForm } from "@/dto/asset.dto";
import { PrismaAssetRepository } from "@/infrastructure/repositories/PrismaAssetRepository";
import { AssetService } from "@/services/AssetService";
import { requireDashboardPermission } from "@/lib/auth-session";

const assetService = new AssetService(new PrismaAssetRepository());

export async function createAsset(formData: FormData) {
  await requireDashboardPermission("assets:write");
  const asset = await assetService.create(assetInputFromForm(formData));

  revalidatePath("/dashboard/assets");
  redirect(`/dashboard/assets/${asset.assetId}`);
}

export async function updateAsset(assetId: string, formData: FormData) {
  await requireDashboardPermission("assets:write");
  await assetService.update(assetId, assetInputFromForm(formData));

  revalidatePath("/dashboard/assets");
  revalidatePath(`/dashboard/assets/${assetId}`);
  redirect(`/dashboard/assets/${assetId}`);
}
