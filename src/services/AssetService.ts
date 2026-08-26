import type { AssetInputDto } from "@/dto/asset.dto";
import type { AssetRepository } from "@/repositories/AssetRepository";

export class AssetService {
  constructor(private readonly assets: AssetRepository) {}
  create(input: AssetInputDto) { return this.assets.create(input); }
  async update(assetId: string, input: AssetInputDto) {
    if (!assetId.trim()) throw new Error("Asset id is required.");
    await this.assets.update(assetId, input);
  }
}

