import type { Alert, AlertFinding, AlertHistoryEntry } from "@/domain/entities/Alert";
import type { AlertListQueryDto } from "@/dto/alert.dto";
import type { CreateAlertDto, UpdateAlertDto } from "@/dto/alert.dto";
import type { AssetHealthData } from "@/repositories/AssetOperationsRepository";

export interface PersistAlertFinding extends AlertFinding { description: string; recommendation: string }
export interface AlertRepository {
  create(input: CreateAlertDto): Promise<Alert>;
  list(filters: AlertListQueryDto): Promise<Alert[]>;
  findById(id: string): Promise<Alert | null>;
  findActive(): Promise<Alert[]>;
  findByAsset(assetId: string): Promise<Alert[]>;
  update(id: string, input: UpdateAlertDto): Promise<Alert>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<Alert[]>;
  findByFingerprint(fingerprint: string): Promise<Alert | null>;
  getHistory(alertId: string): Promise<AlertHistoryEntry[]>;
  getEvaluationData(assetId: string): Promise<AssetHealthData | null>;
  findAssetIdForSensor(deviceId?: string, macAddress?: string): Promise<string | null>;
  upsertFinding(finding: PersistAlertFinding): Promise<{ alert: Alert; changed: boolean }>;
  resolveMissing(assetId: string, activeFingerprints: string[], actor: string): Promise<Alert[]>;
  acknowledge(id: string, actor: string, note?: string): Promise<Alert>;
  resolve(id: string, actor: string, note?: string): Promise<Alert>;
}
