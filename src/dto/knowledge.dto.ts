import { z } from "zod";
import { knowledgeNodeTypes } from "@/domain/entities/EngineeringKnowledge";

const id = z.string().trim().min(1).max(191);
const confidence = z.number().finite().min(0).max(1).default(0.7);
export const knowledgeCategoryDtoSchema = z.object({ organisationId: id, key: id, name: z.string().trim().min(1).max(200), description: z.string().trim().max(1000).nullable().optional() });
export const knowledgeNodeDtoSchema = z.object({ organisationId: id, nodeType: z.enum(knowledgeNodeTypes), externalKey: id, label: z.string().trim().min(1).max(500), description: z.string().trim().max(5000).nullable().optional(), categoryKey: id.optional(), confidence, occurrenceCount: z.number().int().positive().default(1) });
export const knowledgeEdgeDtoSchema = z.object({ organisationId: id, fromNodeKey: id, fromNodeType: z.enum(knowledgeNodeTypes), toNodeKey: id, toNodeType: z.enum(knowledgeNodeTypes), relationship: id, confidence, occurrenceCount: z.number().int().positive().default(1), sourceMemoryId: id.nullable().optional() }).refine((value) => value.fromNodeKey !== value.toNodeKey || value.fromNodeType !== value.toNodeType, { message: "A knowledge node cannot connect to itself." });
export const knowledgeFactDtoSchema = z.object({ organisationId: id, nodeKey: id, nodeType: z.enum(knowledgeNodeTypes), predicate: id, value: z.string().trim().min(1).max(5000), confidence, occurrenceCount: z.number().int().positive().default(1), sourceMemoryId: id.nullable().optional() });
export const knowledgeBuildDtoSchema = z.object({ categories: z.array(knowledgeCategoryDtoSchema).max(20).default([]), nodes: z.array(knowledgeNodeDtoSchema).min(1).max(100), edges: z.array(knowledgeEdgeDtoSchema).max(200).default([]), facts: z.array(knowledgeFactDtoSchema).max(300).default([]) });
export const knowledgeSearchDtoSchema = z.object({ organisationId: id, query: z.string().trim().max(1000).default(""), nodeTypes: z.array(z.enum(knowledgeNodeTypes)).max(9).optional(), assetIds: z.array(id).max(20).optional(), limit: z.number().int().min(1).max(100).default(25) });
export const knowledgeTraversalDtoSchema = z.object({ organisationId: id, nodeId: id, depth: z.number().int().min(0).max(4).default(2), limit: z.number().int().min(1).max(200).default(100) });
export type KnowledgeCategoryDto = z.infer<typeof knowledgeCategoryDtoSchema>;
export type KnowledgeNodeDto = z.infer<typeof knowledgeNodeDtoSchema>;
export type KnowledgeEdgeDto = z.infer<typeof knowledgeEdgeDtoSchema>;
export type KnowledgeFactDto = z.infer<typeof knowledgeFactDtoSchema>;
export type KnowledgeBuildDto = z.infer<typeof knowledgeBuildDtoSchema>;
export type KnowledgeSearchDto = z.infer<typeof knowledgeSearchDtoSchema>;
export type KnowledgeTraversalDto = z.infer<typeof knowledgeTraversalDtoSchema>;
