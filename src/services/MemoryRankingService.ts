import type { EngineeringMemory, RankedMemory } from "@/domain/entities/EngineeringMemory";

export interface MemoryRankingInput { query: string; assetIds?: string[]; now?: Date }
const tokens = (value: string) => new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
export class MemoryRankingService {
  similarity(query: string, memory: EngineeringMemory) {
    const left = tokens(query); if (!left.size) return 0.5;
    const right = tokens([memory.title, memory.summary, memory.fault, memory.assetId, ...memory.tags.flatMap((tag) => [tag.name, tag.value])].filter(Boolean).join(" "));
    const intersection = [...left].filter((token) => right.has(token)).length;
    const union = new Set([...left, ...right]).size;
    return union ? intersection / union : 0;
  }
  rank(memories: EngineeringMemory[], input: MemoryRankingInput): RankedMemory[] {
    const now = input.now ?? new Date();
    return memories.map((memory) => {
      const ageDays = Math.max(0, (now.getTime() - memory.lastObservedAt.getTime()) / 86_400_000);
      const recency = Math.exp(-ageDays / 180);
      const similarity = Math.min(1, this.similarity(input.query, memory) + (memory.assetId && input.assetIds?.includes(memory.assetId) ? 0.35 : 0));
      const successOutcome = memory.successful === true ? 1 : memory.successful === false ? 0 : 0.5;
      const frequency = Math.min(1, Math.log1p(memory.occurrenceCount) / Math.log(11));
      const ranking = { recency, similarity, confidence: memory.confidence, successOutcome, frequency };
      const rank = recency * 0.2 + similarity * 0.35 + memory.confidence * 0.2 + successOutcome * 0.15 + frequency * 0.1;
      return { ...memory, rank, ranking };
    }).toSorted((a, b) => b.rank - a.rank);
  }
}
