import type { InventoryRecommendation } from "@/domain/entities/Inventory";
import type { InventoryRepository } from "@/repositories/InventoryRepository";

export class InventoryRecommendationService {
  constructor(private readonly repository: InventoryRepository) {}
  recommend(requiredTools: string[]): Promise<InventoryRecommendation[]> { return requiredTools.length ? this.repository.recommendParts(requiredTools) : Promise.resolve([]); }
}
