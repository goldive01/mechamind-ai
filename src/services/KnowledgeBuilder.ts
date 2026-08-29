import type { EngineeringMemory } from "@/domain/entities/EngineeringMemory";
import type { KnowledgeNodeType } from "@/domain/entities/EngineeringKnowledge";
import type { KnowledgeBuildDto, KnowledgeEdgeDto, KnowledgeFactDto, KnowledgeNodeDto } from "@/dto/knowledge.dto";
import { KnowledgeGraph } from "@/services/KnowledgeGraph";

export interface KnowledgeUpdater { updateFromMemory(memory: EngineeringMemory): Promise<unknown> }
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const strings = (value: unknown) => Array.isArray(value) ? value.map(text).filter((item): item is string => item !== null) : [];
const key = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160) || "unknown";
const categoryName = (type: KnowledgeNodeType) => type === "SparePart" ? "Spare Parts" : `${type}s`;

export class KnowledgeBuilder implements KnowledgeUpdater {
  constructor(private readonly graph: KnowledgeGraph) {}

  build(memory: EngineeringMemory): KnowledgeBuildDto {
    const nodes: KnowledgeNodeDto[] = [];
    const edges: KnowledgeEdgeDto[] = [];
    const facts: KnowledgeFactDto[] = [];
    const addNode = (nodeType: KnowledgeNodeType, externalKey: string, label = externalKey, description?: string | null) => {
      const node = { organisationId: memory.organisationId, nodeType, externalKey: key(externalKey), label, description: description ?? null, categoryKey: key(nodeType), confidence: memory.confidence, occurrenceCount: 1 } satisfies KnowledgeNodeDto;
      const existing = nodes.find((item) => item.nodeType === node.nodeType && item.externalKey === node.externalKey);
      if (existing) return existing;
      nodes.push(node); return node;
    };
    const connect = (from: KnowledgeNodeDto, to: KnowledgeNodeDto, relationship: string) => edges.push({ organisationId: memory.organisationId, fromNodeKey: from.externalKey, fromNodeType: from.nodeType, toNodeKey: to.externalKey, toNodeType: to.nodeType, relationship, confidence: memory.confidence, occurrenceCount: 1, sourceMemoryId: memory.id });
    const root = memory.assetId ? addNode("Asset", memory.assetId) : memory.equipmentId ? addNode("Component", memory.equipmentId) : addNode(memory.sourceType === "Recommendation" ? "Recommendation" : "Procedure", `${memory.sourceType}:${memory.sourceId}`, memory.title, memory.summary);
    const dimensions: Array<[KnowledgeNodeType, string | null, string]> = [
      ["Component", memory.equipmentId, "HAS_COMPONENT"], ["Engineer", memory.engineerId, "INVOLVES_ENGINEER"], ["SparePart", memory.partId, "USES_SPARE_PART"], ["Failure", memory.fault, "EXPERIENCED_FAILURE"], ["Sensor", memory.sensorId, "MONITORED_BY"],
    ];
    for (const [nodeType, value, relationship] of dimensions) if (value) { const node = addNode(nodeType, value, value, nodeType === "Failure" ? memory.summary : null); if (node !== root) connect(root, node, relationship); }

    if (["WorkOrder", "EngineerAssignment", "CompletedRepair"].includes(memory.sourceType)) {
      const order = addNode("WorkOrder", memory.sourceId, memory.title, memory.summary); if (order !== root) connect(root, order, memory.sourceType === "CompletedRepair" ? "REPAIRED_BY" : "HAS_WORK_ORDER");
    }
    const recommendations = memory.sourceType === "Recommendation" ? [memory.summary] : strings(memory.details.recommendations);
    for (const recommendation of recommendations) { const node = addNode("Recommendation", recommendation, recommendation); if (node !== root) connect(root, node, "HAS_RECOMMENDATION"); }
    const procedures = [...strings(memory.details.procedures), ...strings(memory.details.actions), ...(text(memory.details.procedure) ? [text(memory.details.procedure)!] : [])];
    for (const procedure of procedures) { const node = addNode("Procedure", procedure, procedure); if (node !== root) connect(root, node, "USES_PROCEDURE"); }
    const components = strings(memory.details.detectedComponents);
    for (const component of components) { const node = addNode("Component", component, component); if (node !== root) connect(root, node, "HAS_COMPONENT"); }

    const addFact = (predicate: string, value: string) => facts.push({ organisationId: memory.organisationId, nodeKey: root.externalKey, nodeType: root.nodeType, predicate, value, confidence: memory.confidence, occurrenceCount: 1, sourceMemoryId: memory.id });
    addFact("SUMMARY", memory.summary);
    addFact("SOURCE_TYPE", memory.sourceType);
    addFact("OCCURRED_AT", memory.occurredAt.toISOString());
    if (memory.successful !== null) addFact("SUCCESSFUL", String(memory.successful));
    for (const tag of memory.tags) addFact(`TAG_${key(tag.name).toUpperCase().replace(/-/g, "_")}`, tag.value ?? tag.name);

    return {
      categories: [...new Set(nodes.map((node) => node.nodeType))].map((nodeType) => ({ organisationId: memory.organisationId, key: key(nodeType), name: categoryName(nodeType) })),
      nodes,
      edges: [...new Map(edges.map((edge) => [`${edge.fromNodeType}:${edge.fromNodeKey}:${edge.relationship}:${edge.toNodeType}:${edge.toNodeKey}`, edge])).values()],
      facts: [...new Map(facts.map((fact) => [`${fact.nodeType}:${fact.nodeKey}:${fact.predicate}:${fact.value}`, fact])).values()],
    };
  }

  updateFromMemory(memory: EngineeringMemory) { return this.graph.apply(this.build(memory)); }
}
