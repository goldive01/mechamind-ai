-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "primaryImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssetSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL DEFAULT 0
);

-- Backfill one asset per existing equipment.
INSERT INTO "Asset" ("id", "assetId", "equipmentId", "status", "primaryImage", "createdAt", "updatedAt")
SELECT
    'asset-' || "id",
    printf('MM-%06d', ROW_NUMBER() OVER (ORDER BY "createdAt", "id")),
    "id",
    'Active',
    "image",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Equipment";

INSERT INTO "AssetSequence" ("id", "value")
SELECT 'asset', COUNT(*) FROM "Asset";

-- Redefine Inspection with its required Asset relation.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "overallCondition" TEXT NOT NULL,
    "notes" TEXT,
    "inspectionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspection_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inspection_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Inspection" ("id", "equipmentId", "assetId", "overallCondition", "notes", "inspectionDate", "createdAt", "updatedAt")
SELECT i."id", i."equipmentId", a."id", i."overallCondition", i."notes", i."inspectionDate", i."createdAt", i."updatedAt"
FROM "Inspection" i
JOIN "Asset" a ON a."equipmentId" = i."equipmentId";
DROP TABLE "Inspection";
ALTER TABLE "new_Inspection" RENAME TO "Inspection";

-- Redefine AIReport with its required Asset relation.
CREATE TABLE "new_AIReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIReport_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIReport_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AIReport" ("id", "inspectionId", "assetId", "diagnosis", "recommendations", "riskLevel", "createdAt")
SELECT r."id", r."inspectionId", i."assetId", r."diagnosis", r."recommendations", r."riskLevel", r."createdAt"
FROM "AIReport" r
JOIN "Inspection" i ON i."id" = r."inspectionId";
DROP TABLE "AIReport";
ALTER TABLE "new_AIReport" RENAME TO "AIReport";

CREATE UNIQUE INDEX "Asset_assetId_key" ON "Asset"("assetId");
CREATE UNIQUE INDEX "Asset_equipmentId_key" ON "Asset"("equipmentId");
CREATE UNIQUE INDEX "AIReport_inspectionId_key" ON "AIReport"("inspectionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
