import "server-only";
import { PrismaSyncQueueRepository } from "@/infrastructure/repositories/PrismaSyncQueueRepository";
import { AlwaysOnlineProbe, ConnectivityService } from "@/services/mobile/ConnectivityService";
import { SyncEngine } from "@/services/mobile/SyncEngine";
import { SyncQueue } from "@/services/mobile/SyncQueue";
import { LocalAcknowledgeSyncTransport } from "@/services/mobile/SyncTransport";

export const createSyncRepository = () => new PrismaSyncQueueRepository();
export const createPersistentSyncQueue = () => new SyncQueue(createSyncRepository());
export const createSyncEngine = () => { const repository = createSyncRepository(); return new SyncEngine(repository, new ConnectivityService(new AlwaysOnlineProbe()), new LocalAcknowledgeSyncTransport()); };
