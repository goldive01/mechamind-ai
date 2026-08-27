import { digitalSignatureInputSchema, evidenceInputSchema, geoPositionSchema, scanResultSchema, voiceNoteSchema, type DigitalSignatureInputDto, type GeoPositionDto, type ScanResultDto, type VoiceNoteDto } from "@/dto/field-mobile.dto";
import type { DigitalSignatureRepository, FieldEvidenceRepository } from "@/repositories/FieldMobileRepository";
import type { WorkOrderRepository } from "@/repositories/WorkOrderRepository";

export interface MobileImageStorage { save(file: File): Promise<string>; }
export class MobileFieldService {
  constructor(private readonly workOrders: WorkOrderRepository, private readonly signatures: DigitalSignatureRepository, private readonly evidence: FieldEvidenceRepository, private readonly images?: MobileImageStorage) {}
  async dashboard(assignee?: string) { const orders = await this.workOrders.list(assignee ? { assignedTo: assignee } : {}); return orders.filter((order) => order.status !== "Completed" && order.status !== "Cancelled"); }
  async detail(id: string) { const workOrder = await this.workOrders.findById(id); if (!workOrder) return null; const [signatures, evidence] = await Promise.all([this.signatures.findByWorkOrder(id), this.evidence.listEvidence(id)]); return { workOrder, signatures, evidence }; }
  async sign(input: DigitalSignatureInputDto) { const value = digitalSignatureInputSchema.parse(input); await this.requireWorkOrder(value.workOrderId); return this.signatures.create(value); }
  async capturePhoto(workOrderId: string, file: File, note?: string) { await this.requireWorkOrder(workOrderId); if (!this.images) throw new Error("Image storage is not configured."); const uri = await this.images.save(file); return this.evidence.addEvidence(evidenceInputSchema.parse({ workOrderId, type: "Photo", uri, note: note || null })); }
  async captureLocation(workOrderId: string, position: GeoPositionDto) { await this.requireWorkOrder(workOrderId); const value = geoPositionSchema.parse(position); return this.evidence.addEvidence({ workOrderId, type: "Location", latitude: value.latitude, longitude: value.longitude, note: value.accuracy === null ? null : `Accuracy ${Math.round(value.accuracy)} m` }); }
  validateScan(input: ScanResultDto) { return scanResultSchema.parse(input); }
  queueVoiceNote(input: VoiceNoteDto) { return voiceNoteSchema.parse(input); }
  private async requireWorkOrder(id: string) { if (!await this.workOrders.findById(id)) throw new Error(`Work order ${id} was not found.`); }
}
