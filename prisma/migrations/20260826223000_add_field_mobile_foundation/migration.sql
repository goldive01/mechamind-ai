CREATE TABLE "DigitalSignature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DigitalSignature_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "WorkOrderEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uri" TEXT,
    "note" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkOrderEvidence_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "DigitalSignature_workOrderId_signedAt_idx" ON "DigitalSignature"("workOrderId", "signedAt");
CREATE INDEX "WorkOrderEvidence_workOrderId_capturedAt_idx" ON "WorkOrderEvidence"("workOrderId", "capturedAt");
