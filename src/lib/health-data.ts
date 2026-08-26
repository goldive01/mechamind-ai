import "server-only";

import { prisma } from "@/lib/prisma";
import { HealthEngine } from "@/services/HealthEngine";
import { createAlertService } from "@/services/alertFactory";
const healthEngine = new HealthEngine();

const healthRelations = {
  equipment: {
    include: {
      maintenanceRecords: { orderBy: { maintenanceDate: "asc" as const } },
      sensorDevices: { include: { readings: { orderBy: { recordedAt: "desc" as const }, take: 100 } } },
    },
  },
  inspections: {
    orderBy: { inspectionDate: "asc" as const },
    include: { aiReport: true },
  },
};

export async function getAssetHealthRows() {
  const assets = await prisma.asset.findMany({ include: healthRelations, orderBy: { assetId: "asc" } });
  const rows = assets.map((asset) => ({
    assetId: asset.assetId,
    name: asset.equipment.name,
    location: asset.equipment.location,
    health: healthEngine.calculate(asset.inspections, asset.equipment.maintenanceRecords, asset.createdAt, asset.equipment.sensorDevices.flatMap((device) => device.readings)),
  }));
  await Promise.allSettled(assets.map((asset) => createAlertService().evaluateAsset(asset.assetId, "Health Recalculation")));
  return rows;
}

export async function getAssetHealth(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { assetId }, include: healthRelations });
  if (!asset) return null;
  await createAlertService().evaluateAsset(asset.assetId, "Health Recalculation").catch(() => undefined);
  return {
    asset,
    health: healthEngine.calculate(asset.inspections, asset.equipment.maintenanceRecords, asset.createdAt, asset.equipment.sensorDevices.flatMap((device) => device.readings)),
  };
}
