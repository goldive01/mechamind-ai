import { memorySearchDtoSchema, type MemorySearchDto } from "@/dto/memory.dto";
import type { MemoryRepository } from "@/repositories/MemoryRepository";
export class MemorySearchService { constructor(private readonly repository: MemoryRepository) {} search(input: MemorySearchDto) { return this.repository.search(memorySearchDtoSchema.parse(input)); } }
