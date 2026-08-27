import "server-only";
import type { DigitalSignature, WorkOrderEvidence } from "@/domain/entities/FieldMobile";
import type { DigitalSignatureInputDto, EvidenceInputDto } from "@/dto/field-mobile.dto";
import { prisma } from "@/lib/prisma";
import type { DigitalSignatureRepository, FieldEvidenceRepository } from "@/repositories/FieldMobileRepository";

export class PrismaDigitalSignatureRepository implements DigitalSignatureRepository {
  async create(input: DigitalSignatureInputDto): Promise<DigitalSignature> { return prisma.digitalSignature.create({ data: { workOrderId: input.workOrderId, signerName: input.signerName, signatureData: input.signatureData, latitude: input.latitude ?? null, longitude: input.longitude ?? null } }); }
  findByWorkOrder(workOrderId: string) { return prisma.digitalSignature.findMany({ where: { workOrderId }, orderBy: { signedAt: "desc" } }); }
}
export class PrismaFieldEvidenceRepository implements FieldEvidenceRepository {
  async addEvidence(input: EvidenceInputDto): Promise<WorkOrderEvidence> { return prisma.workOrderEvidence.create({ data: { workOrderId: input.workOrderId, type: input.type, uri: input.uri ?? null, note: input.note ?? null, latitude: input.latitude ?? null, longitude: input.longitude ?? null } }) as Promise<WorkOrderEvidence>; }
  async listEvidence(workOrderId: string) { return prisma.workOrderEvidence.findMany({ where: { workOrderId }, orderBy: { capturedAt: "desc" } }) as Promise<WorkOrderEvidence[]>; }
}
