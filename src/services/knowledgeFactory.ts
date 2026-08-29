import "server-only";
import { PrismaKnowledgeRepository } from "@/infrastructure/repositories/PrismaKnowledgeRepository";
import { KnowledgeBuilder } from "@/services/KnowledgeBuilder";
import { KnowledgeEngine } from "@/services/KnowledgeEngine";
import { KnowledgeGraph } from "@/services/KnowledgeGraph";
import { KnowledgeSearch } from "@/services/KnowledgeSearch";

export const createKnowledgeRepository = () => new PrismaKnowledgeRepository();
export const createKnowledgeBuilder = () => new KnowledgeBuilder(new KnowledgeGraph(createKnowledgeRepository()));
export const createKnowledgeEngine = () => new KnowledgeEngine(new KnowledgeSearch(createKnowledgeRepository()));
