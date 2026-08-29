import type { KnowledgeGraphResult } from "@/domain/entities/EngineeringKnowledge";
import { KnowledgeSearch } from "@/services/KnowledgeSearch";

const uniqueById = <T extends { id: string }>(values: T[]) => [...new Map(values.map((value) => [value.id, value])).values()];
export class KnowledgeEngine {
  constructor(private readonly knowledge: KnowledgeSearch) {}
  async recall(input: { organisationId: string; query: string; assetIds?: string[]; limit?: number; depth?: number }): Promise<KnowledgeGraphResult> {
    const limit = input.limit ?? 25;
    const found = await this.knowledge.search({ organisationId: input.organisationId, query: input.query, assetIds: input.assetIds, limit });
    const roots = found.nodes.slice(0, Math.min(8, limit));
    const traversed = await Promise.all(roots.map((node) => this.knowledge.traverse({ organisationId: input.organisationId, nodeId: node.id, depth: input.depth ?? 2, limit })));
    return {
      nodes: uniqueById([...found.nodes, ...traversed.flatMap((result) => result.nodes)]).slice(0, limit),
      edges: uniqueById([...found.edges, ...traversed.flatMap((result) => result.edges)]).slice(0, limit * 2),
      facts: uniqueById([...found.facts, ...traversed.flatMap((result) => result.facts)]).slice(0, limit * 3),
    };
  }
}
