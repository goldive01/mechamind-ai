import "server-only";
import type { AssetInputDto } from "@/dto/asset.dto";
import { allocateAssetId } from "@/lib/assets";
import { prisma } from "@/lib/prisma";
import type { AssetRepository } from "@/repositories/AssetRepository";

export class PrismaAssetRepository implements AssetRepository {
  async create(input: AssetInputDto) {
    return prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.create({ data: { name: input.name, manufacturer: input.manufacturer, model: input.model, serialNumber: input.serialNumber, category: input.category, location: input.location, description: input.description, image: input.primaryImage } });
      const asset = await tx.asset.create({ data: { assetId: await allocateAssetId(tx), equipmentId: equipment.id, status: input.status, primaryImage: input.primaryImage } });
      return { assetId: asset.assetId };
    });
  }

  async update(assetId: string, input: AssetInputDto) {
    await prisma.asset.update({ where: { assetId }, data: { status: input.status, primaryImage: input.primaryImage, equipment: { update: { name: input.name, manufacturer: input.manufacturer, model: input.model, serialNumber: input.serialNumber, category: input.category, location: input.location, description: input.description, image: input.primaryImage } } } });
  }
}

