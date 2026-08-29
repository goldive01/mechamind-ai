import { knowledgeSearchDtoSchema, knowledgeTraversalDtoSchema, type KnowledgeSearchDto, type KnowledgeTraversalDto } from "@/dto/knowledge.dto";
import type { KnowledgeRepository } from "@/repositories/KnowledgeRepository";

export class KnowledgeSearch {
  constructor(private readonly repository: KnowledgeRepository) {}
  search(input: KnowledgeSearchDto) { return this.repository.search(knowledgeSearchDtoSchema.parse(input)); }
  traverse(input: KnowledgeTraversalDto) { return this.repository.traverse(knowledgeTraversalDtoSchema.parse(input)); }
}
