CREATE TABLE "EngineeringMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detailsJson" TEXT NOT NULL DEFAULT '{}',
    "equipmentId" TEXT,
    "assetId" TEXT,
    "fault" TEXT,
    "engineerId" TEXT,
    "partId" TEXT,
    "sensorId" TEXT,
    "alertId" TEXT,
    "timelineType" TEXT,
    "confidence" REAL NOT NULL DEFAULT 0.7,
    "successful" BOOLEAN,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "occurredAt" DATETIME NOT NULL,
    "lastObservedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EngineeringMemory_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "MemoryEvent" (
    "id" TEXT NOT NULL PRIMARY KEY, "memoryId" TEXT NOT NULL, "eventType" TEXT NOT NULL, "sourceType" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "payloadJson" TEXT NOT NULL DEFAULT '{}', "occurredAt" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemoryEvent_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "EngineeringMemory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "MemoryRelationship" (
    "id" TEXT NOT NULL PRIMARY KEY, "fromMemoryId" TEXT NOT NULL, "toMemoryId" TEXT NOT NULL, "relationship" TEXT NOT NULL, "strength" REAL NOT NULL DEFAULT 1, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemoryRelationship_fromMemoryId_fkey" FOREIGN KEY ("fromMemoryId") REFERENCES "EngineeringMemory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MemoryRelationship_toMemoryId_fkey" FOREIGN KEY ("toMemoryId") REFERENCES "EngineeringMemory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "MemoryTag" (
    "id" TEXT NOT NULL PRIMARY KEY, "memoryId" TEXT NOT NULL, "name" TEXT NOT NULL, "value" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemoryTag_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "EngineeringMemory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EngineeringMemory_organisationId_externalKey_key" ON "EngineeringMemory"("organisationId", "externalKey");
CREATE INDEX "EngineeringMemory_organisationId_assetId_occurredAt_idx" ON "EngineeringMemory"("organisationId", "assetId", "occurredAt");
CREATE INDEX "EngineeringMemory_organisationId_sourceType_occurredAt_idx" ON "EngineeringMemory"("organisationId", "sourceType", "occurredAt");
CREATE INDEX "EngineeringMemory_organisationId_engineerId_partId_sensorId_idx" ON "EngineeringMemory"("organisationId", "engineerId", "partId", "sensorId");
CREATE INDEX "MemoryEvent_memoryId_occurredAt_idx" ON "MemoryEvent"("memoryId", "occurredAt");
CREATE INDEX "MemoryEvent_sourceType_sourceId_idx" ON "MemoryEvent"("sourceType", "sourceId");
CREATE UNIQUE INDEX "MemoryRelationship_fromMemoryId_toMemoryId_relationship_key" ON "MemoryRelationship"("fromMemoryId", "toMemoryId", "relationship");
CREATE INDEX "MemoryRelationship_toMemoryId_relationship_idx" ON "MemoryRelationship"("toMemoryId", "relationship");
CREATE UNIQUE INDEX "MemoryTag_memoryId_name_value_key" ON "MemoryTag"("memoryId", "name", "value");
CREATE INDEX "MemoryTag_name_value_idx" ON "MemoryTag"("name", "value");
