export interface GeoPosition { latitude: number; longitude: number; accuracy: number | null; capturedAt: Date }
export interface DigitalSignature { id: string; workOrderId: string; signerName: string; signatureData: string; latitude: number | null; longitude: number | null; signedAt: Date }
export interface WorkOrderEvidence { id: string; workOrderId: string; type: "Photo" | "Voice Note" | "Location"; uri: string | null; note: string | null; latitude: number | null; longitude: number | null; capturedAt: Date }
export type SyncOperationStatus = "Pending" | "Syncing" | "Failed" | "Synced";
export type SyncEntity = "WorkOrder" | "Inspection" | "Photo" | "VoiceNote" | "GPS" | "DigitalSignature" | "Asset";
export interface SyncOperation { id: string; entity: SyncEntity; entityId: string; action: "Create" | "Update"; payload: unknown; baseVersion: string | null; status: SyncOperationStatus; attempts: number; nextAttemptAt: Date; createdAt: Date; updatedAt: Date; syncedAt: Date | null; lastError: string | null; conflict: unknown | null }
export interface SyncQueueSummary { pending: number; syncing: number; failed: number; synced: number; nextAttemptAt: Date | null }
