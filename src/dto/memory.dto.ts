import { z } from "zod";
import { memorySourceTypes } from "@/domain/entities/EngineeringMemory";

const id = z.string().trim().min(1).max(191);
export const memoryEventDtoSchema = z.object({ id: id.optional(), memoryId: id.optional(), eventType: id, sourceType: id, sourceId: id, payload: z.record(z.string(), z.unknown()).default({}), occurredAt: z.coerce.date() });
export const memoryRelationshipDtoSchema = z.object({ id: id.optional(), fromMemoryId: id, toMemoryId: id, relationship: id, strength: z.number().min(0).max(1).default(1) }).refine((value) => value.fromMemoryId !== value.toMemoryId, { message: "A memory cannot relate to itself." });
export const memoryTagDtoSchema = z.object({ id: id.optional(), memoryId: id.optional(), name: id, value: z.string().trim().max(500).nullable().optional().default(null) });
export const engineeringMemoryDtoSchema = z.object({
  id: id.optional(), organisationId: id, sourceType: z.enum(memorySourceTypes), sourceId: id, externalKey: id, title: z.string().trim().min(1).max(300), summary: z.string().trim().min(1).max(5000), details: z.record(z.string(), z.unknown()).default({}),
  equipmentId: id.nullable().optional(), assetId: id.nullable().optional(), fault: z.string().trim().max(500).nullable().optional(), engineerId: id.nullable().optional(), partId: id.nullable().optional(), sensorId: id.nullable().optional(), alertId: id.nullable().optional(), timelineType: z.string().trim().max(100).nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.7), successful: z.boolean().nullable().optional(), occurrenceCount: z.number().int().positive().default(1), occurredAt: z.coerce.date(), lastObservedAt: z.coerce.date().optional(), tags: z.array(memoryTagDtoSchema.omit({ memoryId: true })).max(30).default([]), event: memoryEventDtoSchema.omit({ memoryId: true }).optional(),
});
export const memorySearchDtoSchema = z.object({ organisationId: id, query: z.string().trim().max(1000).default(""), equipmentId: id.optional(), assetId: id.optional(), fault: z.string().trim().optional(), engineerId: id.optional(), partId: id.optional(), sensorId: id.optional(), alertId: id.optional(), timelineType: z.string().trim().optional(), limit: z.number().int().min(1).max(100).default(25) });
export type EngineeringMemoryDto = z.infer<typeof engineeringMemoryDtoSchema>;
export type MemoryEventDto = z.infer<typeof memoryEventDtoSchema>;
export type MemoryRelationshipDto = z.infer<typeof memoryRelationshipDtoSchema>;
export type MemoryTagDto = z.infer<typeof memoryTagDtoSchema>;
export type MemorySearchDto = z.infer<typeof memorySearchDtoSchema>;
