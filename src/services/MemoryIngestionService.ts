import type { MemorySourceType } from "@/domain/entities/EngineeringMemory";
import { engineeringMemoryDtoSchema } from "@/dto/memory.dto";
import type { MemoryRepository } from "@/repositories/MemoryRepository";
import type { KnowledgeUpdater } from "@/services/KnowledgeBuilder";

export interface MemoryIngestionInput {
  organisationId: string; sourceType: MemorySourceType; sourceId: string; eventType?: string; title: string; summary: string; details?: Record<string, unknown>;
  equipmentId?: string | null; assetId?: string | null; fault?: string | null; engineerId?: string | null; partId?: string | null; sensorId?: string | null; alertId?: string | null; timelineType?: string | null;
  confidence?: number; successful?: boolean | null; occurredAt?: Date; tags?: Array<{ name: string; value?: string | null }>; deduplicationKey?: string;
}
export interface MemoryIngestor { ingest(input: MemoryIngestionInput): Promise<unknown> }

export class MemoryIngestionService implements MemoryIngestor {
  constructor(private readonly repository: MemoryRepository, private readonly clock: () => Date = () => new Date(), private readonly knowledge?: KnowledgeUpdater) {}
  async ingest(input: MemoryIngestionInput) {
    const occurredAt = input.occurredAt ?? this.clock();
    const memory = await this.repository.upsert(engineeringMemoryDtoSchema.parse({ ...input, externalKey: input.deduplicationKey ?? `${input.sourceType}:${input.sourceId}`, details: input.details ?? {}, confidence: input.confidence ?? 0.7, occurrenceCount: 1, occurredAt, lastObservedAt: occurredAt, tags: input.tags ?? [], event: { eventType: input.eventType ?? "Observed", sourceType: input.sourceType, sourceId: input.sourceId, payload: input.details ?? {}, occurredAt } }));
    await this.knowledge?.updateFromMemory(memory);
    return memory;
  }
  inspection(input: Omit<MemoryIngestionInput, "sourceType">) { return this.ingest({ ...input, sourceType: "Inspection" }); }
  workOrder(input: Omit<MemoryIngestionInput, "sourceType">) { return this.ingest({ ...input, sourceType: "WorkOrder" }); }
  alert(input: Omit<MemoryIngestionInput, "sourceType">) { return this.ingest({ ...input, sourceType: "Alert" }); }
  recommendation(input: Omit<MemoryIngestionInput, "sourceType">) { return this.ingest({ ...input, sourceType: "Recommendation" }); }
  inventory(input: Omit<MemoryIngestionInput, "sourceType">) { return this.ingest({ ...input, sourceType: "Inventory" }); }
  timeline(input: Omit<MemoryIngestionInput, "sourceType">) { return this.ingest({ ...input, sourceType: "Timeline" }); }
  sensor(input: Omit<MemoryIngestionInput, "sourceType">) { return this.ingest({ ...input, sourceType: "Sensor" }); }
  engineerAssignment(input: Omit<MemoryIngestionInput, "sourceType">) { return this.ingest({ ...input, sourceType: "EngineerAssignment" }); }
  completedRepair(input: Omit<MemoryIngestionInput, "sourceType">) { return this.ingest({ ...input, sourceType: "CompletedRepair", successful: input.successful ?? true }); }
}
