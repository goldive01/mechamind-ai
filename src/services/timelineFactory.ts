import "server-only";
import { PrismaTimelineRepository } from "@/infrastructure/repositories/PrismaTimelineRepository";
import { OpenAITimelineSummarizer, TimelineService } from "@/services/TimelineService";

export function createTimelineService() { return new TimelineService(new PrismaTimelineRepository(), undefined, new OpenAITimelineSummarizer()); }
