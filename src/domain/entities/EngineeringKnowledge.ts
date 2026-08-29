export const knowledgeNodeTypes = ["Asset", "Component", "Engineer", "SparePart", "Failure", "Recommendation", "Sensor", "Procedure", "WorkOrder"] as const;
export type KnowledgeNodeType = typeof knowledgeNodeTypes[number];

export interface KnowledgeCategory { id: string; organisationId: string; key: string; name: string; description: string | null; createdAt: Date; updatedAt: Date }
export interface KnowledgeFact { id: string; organisationId: string; nodeId: string; predicate: string; value: string; confidence: number; occurrenceCount: number; sourceMemoryId: string | null; createdAt: Date; updatedAt: Date }
export interface KnowledgeEdge { id: string; organisationId: string; fromNodeId: string; toNodeId: string; relationship: string; confidence: number; occurrenceCount: number; sourceMemoryId: string | null; createdAt: Date; updatedAt: Date }
export interface KnowledgeNode { id: string; organisationId: string; categoryId: string | null; nodeType: KnowledgeNodeType; externalKey: string; label: string; description: string | null; confidence: number; occurrenceCount: number; createdAt: Date; updatedAt: Date; category?: KnowledgeCategory | null; facts: KnowledgeFact[] }
export interface KnowledgeGraphResult { nodes: KnowledgeNode[]; edges: KnowledgeEdge[]; facts: KnowledgeFact[] }
