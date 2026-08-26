-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetDbId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Engineering',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "source" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "recommendation" TEXT NOT NULL,
    "triggerType" TEXT,
    "triggerId" TEXT,
    "observedValue" REAL,
    "thresholdValue" REAL,
    "acknowledgedAt" DATETIME,
    "acknowledgedBy" TEXT,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alert_assetDbId_fkey" FOREIGN KEY ("assetDbId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("acknowledgedAt", "acknowledgedBy", "assetDbId", "createdAt", "explanation", "fingerprint", "id", "metric", "observedValue", "recommendation", "resolvedAt", "resolvedBy", "severity", "source", "status", "thresholdValue", "title", "updatedAt") SELECT "acknowledgedAt", "acknowledgedBy", "assetDbId", "createdAt", "explanation", "fingerprint", "id", "metric", "observedValue", "recommendation", "resolvedAt", "resolvedBy", "severity", "source", "status", "thresholdValue", "title", "updatedAt" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE UNIQUE INDEX "Alert_fingerprint_key" ON "Alert"("fingerprint");
CREATE INDEX "Alert_status_severity_updatedAt_idx" ON "Alert"("status", "severity", "updatedAt");
CREATE INDEX "Alert_assetDbId_updatedAt_idx" ON "Alert"("assetDbId", "updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
