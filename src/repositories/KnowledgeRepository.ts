import type { KnowledgeGraphResult } from "@/domain/entities/EngineeringKnowledge";
import type { KnowledgeBuildDto, KnowledgeSearchDto, KnowledgeTraversalDto } from "@/dto/knowledge.dto";

export interface KnowledgeRepository {
  apply(input: KnowledgeBuildDto): Promise<KnowledgeGraphResult>;
  search(input: KnowledgeSearchDto): Promise<KnowledgeGraphResult>;
  traverse(input: KnowledgeTraversalDto): Promise<KnowledgeGraphResult>;
}
