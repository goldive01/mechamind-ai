import "server-only";
import type { KnowledgeEdge, KnowledgeFact, KnowledgeGraphResult, KnowledgeNode, KnowledgeNodeType } from "@/domain/entities/EngineeringKnowledge";
import type { KnowledgeBuildDto, KnowledgeSearchDto, KnowledgeTraversalDto } from "@/dto/knowledge.dto";
import { prisma } from "@/lib/prisma";
import type { KnowledgeRepository } from "@/repositories/KnowledgeRepository";

type NodeRecord = Awaited<ReturnType<typeof prisma.knowledgeNode.findFirstOrThrow>> & { category?: { id: string; organisationId: string; key: string; name: string; description: string | null; createdAt: Date; updatedAt: Date } | null; facts: KnowledgeFact[] };
const mapNode = (node: NodeRecord): KnowledgeNode => ({ ...node, nodeType: node.nodeType as KnowledgeNodeType, category: node.category ?? null, facts: node.facts });
const aggregate = (confidence: number, occurrences: number, nextConfidence: number, nextOccurrences: number) => (confidence * occurrences + nextConfidence * nextOccurrences) / (occurrences + nextOccurrences);

export class PrismaKnowledgeRepository implements KnowledgeRepository {
  async apply(input: KnowledgeBuildDto): Promise<KnowledgeGraphResult> {
    const organisationId = input.nodes[0].organisationId;
    return prisma.$transaction(async (tx) => {
      const categoryIds = new Map<string, string>();
      for (const category of input.categories) {
        const saved = await tx.knowledgeCategory.upsert({ where: { organisationId_key: { organisationId: category.organisationId, key: category.key } }, create: category, update: { name: category.name, description: category.description ?? null } });
        categoryIds.set(category.key, saved.id);
      }
      const nodeIds = new Map<string, string>();
      for (const node of input.nodes) {
        const identity = { organisationId_nodeType_externalKey: { organisationId: node.organisationId, nodeType: node.nodeType, externalKey: node.externalKey } };
        const existing = await tx.knowledgeNode.findUnique({ where: identity });
        const confidence = existing ? aggregate(existing.confidence, existing.occurrenceCount, node.confidence, node.occurrenceCount) : node.confidence;
        const saved = await tx.knowledgeNode.upsert({ where: identity, create: { organisationId: node.organisationId, nodeType: node.nodeType, externalKey: node.externalKey, label: node.label, description: node.description ?? null, categoryId: node.categoryKey ? categoryIds.get(node.categoryKey) : undefined, confidence, occurrenceCount: node.occurrenceCount }, update: { label: node.label, description: node.description ?? null, categoryId: node.categoryKey ? categoryIds.get(node.categoryKey) : undefined, confidence, occurrenceCount: { increment: node.occurrenceCount } } });
        nodeIds.set(`${node.nodeType}:${node.externalKey}`, saved.id);
      }
      for (const edge of input.edges) {
        const fromNodeId = nodeIds.get(`${edge.fromNodeType}:${edge.fromNodeKey}`); const toNodeId = nodeIds.get(`${edge.toNodeType}:${edge.toNodeKey}`); if (!fromNodeId || !toNodeId) continue;
        const identity = { organisationId_fromNodeId_toNodeId_relationship: { organisationId: edge.organisationId, fromNodeId, toNodeId, relationship: edge.relationship } };
        const existing = await tx.knowledgeEdge.findUnique({ where: identity });
        const confidence = existing ? aggregate(existing.confidence, existing.occurrenceCount, edge.confidence, edge.occurrenceCount) : edge.confidence;
        await tx.knowledgeEdge.upsert({ where: identity, create: { organisationId: edge.organisationId, fromNodeId, toNodeId, relationship: edge.relationship, confidence, occurrenceCount: edge.occurrenceCount, sourceMemoryId: edge.sourceMemoryId ?? null }, update: { confidence, occurrenceCount: { increment: edge.occurrenceCount }, sourceMemoryId: edge.sourceMemoryId ?? null } });
      }
      for (const fact of input.facts) {
        const nodeId = nodeIds.get(`${fact.nodeType}:${fact.nodeKey}`); if (!nodeId) continue;
        const identity = { organisationId_nodeId_predicate_value: { organisationId: fact.organisationId, nodeId, predicate: fact.predicate, value: fact.value } };
        const existing = await tx.knowledgeFact.findUnique({ where: identity });
        const confidence = existing ? aggregate(existing.confidence, existing.occurrenceCount, fact.confidence, fact.occurrenceCount) : fact.confidence;
        await tx.knowledgeFact.upsert({ where: identity, create: { organisationId: fact.organisationId, nodeId, predicate: fact.predicate, value: fact.value, confidence, occurrenceCount: fact.occurrenceCount, sourceMemoryId: fact.sourceMemoryId ?? null }, update: { confidence, occurrenceCount: { increment: fact.occurrenceCount }, sourceMemoryId: fact.sourceMemoryId ?? null } });
      }
      return this.load(tx, organisationId, [...nodeIds.values()]);
    });
  }

  async search(input: KnowledgeSearchDto): Promise<KnowledgeGraphResult> {
    const terms = [...new Set(input.query.toLowerCase().match(/[a-z0-9]+/g) ?? [])].filter((term) => term.length > 2).slice(0, 12);
    const predicates = [...(input.assetIds?.length ? [{ nodeType: "Asset", externalKey: { in: input.assetIds.map((value) => value.toLowerCase()) } }] : []), ...terms.flatMap((term) => [{ label: { contains: term } }, { description: { contains: term } }, { externalKey: { contains: term } }, { facts: { some: { OR: [{ predicate: { contains: term } }, { value: { contains: term } }] } } }])];
    const nodes = await prisma.knowledgeNode.findMany({ where: { organisationId: input.organisationId, nodeType: input.nodeTypes?.length ? { in: input.nodeTypes } : undefined, OR: predicates.length ? predicates : undefined }, orderBy: [{ confidence: "desc" }, { updatedAt: "desc" }], take: input.limit, include: { category: true, facts: true } });
    return this.load(prisma, input.organisationId, nodes.map((node) => node.id), nodes as NodeRecord[]);
  }

  async traverse(input: KnowledgeTraversalDto): Promise<KnowledgeGraphResult> {
    const root = await prisma.knowledgeNode.findFirst({ where: { id: input.nodeId, organisationId: input.organisationId }, select: { id: true } });
    if (!root) return { nodes: [], edges: [], facts: [] };
    const visited = new Set([root.id]); let frontier = [root.id]; const edges: KnowledgeEdge[] = [];
    for (let depth = 0; depth < input.depth && frontier.length && visited.size < input.limit; depth++) {
      const layer = await prisma.knowledgeEdge.findMany({ where: { organisationId: input.organisationId, OR: [{ fromNodeId: { in: frontier } }, { toNodeId: { in: frontier } }] }, take: input.limit * 2 });
      edges.push(...layer); const next: string[] = [];
      for (const edge of layer) for (const id of [edge.fromNodeId, edge.toNodeId]) if (!visited.has(id) && visited.size < input.limit) { visited.add(id); next.push(id); }
      frontier = next;
    }
    const nodeIds = [...visited]; const result = await this.load(prisma, input.organisationId, nodeIds); return { ...result, edges: [...new Map(edges.map((edge) => [edge.id, edge])).values()] };
  }

  private async load(client: Pick<typeof prisma, "knowledgeNode" | "knowledgeEdge" | "knowledgeFact">, organisationId: string, nodeIds: string[], existingNodes?: NodeRecord[]): Promise<KnowledgeGraphResult> {
    if (!nodeIds.length) return { nodes: [], edges: [], facts: [] };
    const [nodes, edges, facts] = await Promise.all([
      existingNodes ? Promise.resolve(existingNodes) : client.knowledgeNode.findMany({ where: { organisationId, id: { in: nodeIds } }, include: { category: true, facts: true } }),
      client.knowledgeEdge.findMany({ where: { organisationId, OR: [{ fromNodeId: { in: nodeIds } }, { toNodeId: { in: nodeIds } }] } }),
      client.knowledgeFact.findMany({ where: { organisationId, nodeId: { in: nodeIds } } }),
    ]);
    return { nodes: (nodes as NodeRecord[]).map(mapNode), edges: edges as KnowledgeEdge[], facts: facts as KnowledgeFact[] };
  }
}
