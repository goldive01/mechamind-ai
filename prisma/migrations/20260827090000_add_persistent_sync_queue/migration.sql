CREATE TABLE "SyncQueueItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "baseVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "conflictJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "syncedAt" DATETIME
);

CREATE INDEX "SyncQueueItem_status_nextAttemptAt_idx" ON "SyncQueueItem"("status", "nextAttemptAt");
CREATE INDEX "SyncQueueItem_entity_entityId_createdAt_idx" ON "SyncQueueItem"("entity", "entityId", "createdAt");
