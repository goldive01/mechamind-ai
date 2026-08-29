import "server-only";
import { PrismaMemoryRepository } from "@/infrastructure/repositories/PrismaMemoryRepository";
import { MemoryEngine } from "@/services/MemoryEngine";
import { MemoryIngestionService } from "@/services/MemoryIngestionService";
import { MemorySearchService } from "@/services/MemorySearchService";
export const createMemoryRepository = () => new PrismaMemoryRepository();
export const createMemoryIngestionService = () => new MemoryIngestionService(createMemoryRepository());
export const createMemoryEngine = () => { const repository = createMemoryRepository(); return new MemoryEngine(new MemorySearchService(repository)); };
