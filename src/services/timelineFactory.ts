import "server-only";
import { PrismaTimelineRepository } from "@/infrastructure/repositories/PrismaTimelineRepository";
import { OpenAITimelineSummarizer, TimelineService } from "@/services/TimelineService";
import { createMemoryIngestionService } from "@/services/memoryFactory";

export function createTimelineService(organisationId: string) { return new TimelineService(new PrismaTimelineRepository(organisationId), undefined, new OpenAITimelineSummarizer(), createMemoryIngestionService()); }
