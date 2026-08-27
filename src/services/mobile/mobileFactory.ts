import "server-only";
import { PrismaDigitalSignatureRepository, PrismaFieldEvidenceRepository } from "@/infrastructure/repositories/PrismaFieldMobileRepository";
import { PrismaWorkOrderRepository } from "@/infrastructure/repositories/PrismaWorkOrderRepository";
import { saveImageUpload, validateImageUpload } from "@/lib/uploads";
import { MobileFieldService } from "@/services/mobile/MobileFieldService";

export const createMobileFieldService = () => new MobileFieldService(new PrismaWorkOrderRepository(), new PrismaDigitalSignatureRepository(), new PrismaFieldEvidenceRepository(), { save: async (file) => saveImageUpload(validateImageUpload(file)) });
