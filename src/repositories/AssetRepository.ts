import type { AssetInputDto } from "@/dto/asset.dto";

export interface AssetRepository {
  create(input: AssetInputDto): Promise<{ assetId: string }>;
  update(assetId: string, input: AssetInputDto): Promise<void>;
}

