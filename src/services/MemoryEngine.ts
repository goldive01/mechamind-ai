import type { RankedMemory } from "@/domain/entities/EngineeringMemory";
import { memorySearchDtoSchema } from "@/dto/memory.dto";
import { MemoryRankingService } from "@/services/MemoryRankingService";
import { MemorySearchService } from "@/services/MemorySearchService";
export class MemoryEngine {
  constructor(private readonly searchService: MemorySearchService, private readonly ranking = new MemoryRankingService()) {}
  async recall(input: { organisationId: string; query: string; assetIds?: string[]; limit?: number }): Promise<RankedMemory[]> {
    const search = memorySearchDtoSchema.parse({ organisationId: input.organisationId, query: input.query, limit: Math.max(25, input.limit ?? 8) });
    const candidates = await this.searchService.search(search);
    return this.ranking.rank(candidates, { query: input.query, assetIds: input.assetIds }).slice(0, input.limit ?? 8);
  }
}
