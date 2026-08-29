import { knowledgeBuildDtoSchema, type KnowledgeBuildDto } from "@/dto/knowledge.dto";
import type { KnowledgeRepository } from "@/repositories/KnowledgeRepository";

export class KnowledgeGraph {
  constructor(private readonly repository: KnowledgeRepository) {}
  apply(input: KnowledgeBuildDto) { return this.repository.apply(knowledgeBuildDtoSchema.parse(input)); }
}
