import type { DigitalSignature, SyncOperation, SyncQueueSummary, WorkOrderEvidence } from "@/domain/entities/FieldMobile";
import type { DigitalSignatureInputDto, EvidenceInputDto } from "@/dto/field-mobile.dto";

export interface FieldEvidenceRepository { addEvidence(input: EvidenceInputDto): Promise<WorkOrderEvidence>; listEvidence(workOrderId: string): Promise<WorkOrderEvidence[]>; }
export interface DigitalSignatureRepository { create(input: DigitalSignatureInputDto): Promise<DigitalSignature>; findByWorkOrder(workOrderId: string): Promise<DigitalSignature[]>; }
export interface OfflineRepository { put(operation: SyncOperation): Promise<void>; get(id: string): Promise<SyncOperation | null>; list(): Promise<SyncOperation[]>; remove(id: string): Promise<void>; }
export interface SyncQueueRepository extends OfflineRepository { listDue(now: Date, limit: number): Promise<SyncOperation[]>; summary(): Promise<SyncQueueSummary>; }
