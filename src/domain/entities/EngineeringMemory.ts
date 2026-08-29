export const memorySourceTypes = ["Inspection", "WorkOrder", "Alert", "Recommendation", "Inventory", "Timeline", "Sensor", "EngineerAssignment", "CompletedRepair"] as const;
export type MemorySourceType = typeof memorySourceTypes[number];

export interface MemoryEvent { id: string; memoryId: string; eventType: string; sourceType: string; sourceId: string; payload: Record<string, unknown>; occurredAt: Date; createdAt: Date }
export interface MemoryRelationship { id: string; fromMemoryId: string; toMemoryId: string; relationship: string; strength: number; createdAt: Date }
export interface MemoryTag { id: string; memoryId: string; name: string; value: string | null; createdAt: Date }
export interface EngineeringMemory {
  id: string; organisationId: string; sourceType: MemorySourceType; sourceId: string; externalKey: string; title: string; summary: string; details: Record<string, unknown>;
  equipmentId: string | null; assetId: string | null; fault: string | null; engineerId: string | null; partId: string | null; sensorId: string | null; alertId: string | null; timelineType: string | null;
  confidence: number; successful: boolean | null; occurrenceCount: number; occurredAt: Date; lastObservedAt: Date; createdAt: Date; updatedAt: Date; events: MemoryEvent[]; tags: MemoryTag[];
}
export interface RankedMemory extends EngineeringMemory { rank: number; ranking: { recency: number; similarity: number; confidence: number; successOutcome: number; frequency: number } }
