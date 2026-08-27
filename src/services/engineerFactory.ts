import "server-only";
import { PrismaEngineerRepository } from "@/infrastructure/repositories/PrismaEngineerRepository";
import { EngineerService } from "@/services/EngineerService";

export const createEngineerService = () => new EngineerService(new PrismaEngineerRepository());
