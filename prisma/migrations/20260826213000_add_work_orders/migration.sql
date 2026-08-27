CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "assignedTo" TEXT,
    "scheduledStart" DATETIME,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "WorkOrder_status_priority_scheduledStart_idx" ON "WorkOrder"("status", "priority", "scheduledStart");
CREATE INDEX "WorkOrder_assetId_updatedAt_idx" ON "WorkOrder"("assetId", "updatedAt");
CREATE INDEX "WorkOrder_assignedTo_status_idx" ON "WorkOrder"("assignedTo", "status");
