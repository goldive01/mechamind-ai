import type { EngineeringMemory } from "@/domain/entities/EngineeringMemory";
import type { EngineeringMemoryDto, MemoryRelationshipDto, MemorySearchDto } from "@/dto/memory.dto";
export interface MemoryRepository {
  upsert(input: EngineeringMemoryDto): Promise<EngineeringMemory>;
  findById(id: string, organisationId: string): Promise<EngineeringMemory | null>;
  search(input: MemorySearchDto): Promise<EngineeringMemory[]>;
  relate(input: MemoryRelationshipDto): Promise<void>;
}
