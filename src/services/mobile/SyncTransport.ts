import type { SyncOperation } from "@/domain/entities/FieldMobile";
import type { SyncTransportResultDto } from "@/dto/field-mobile.dto";

export interface SyncTransport { synchronize(operation: SyncOperation): Promise<SyncTransportResultDto>; }
export class LocalAcknowledgeSyncTransport implements SyncTransport { async synchronize(): Promise<SyncTransportResultDto> { return { status: "Applied" }; } }
