PRAGMA foreign_keys=OFF;

CREATE TABLE "Organisation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Organisation_slug_key" ON "Organisation"("slug");
CREATE INDEX "Organisation_active_name_idx" ON "Organisation"("active", "name");
INSERT INTO "Organisation" ("id", "slug", "name", "description", "active", "createdAt", "updatedAt") VALUES ('legacy', 'mechamind', 'MechaMind Operations', 'Default organisation for existing operational data.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE "Site" ("id" TEXT NOT NULL PRIMARY KEY, "organisationId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "address" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Site_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX "Site_organisationId_code_key" ON "Site"("organisationId", "code");
CREATE INDEX "Site_organisationId_active_name_idx" ON "Site"("organisationId", "active", "name");
CREATE TABLE "Building" ("id" TEXT NOT NULL PRIMARY KEY, "siteId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Building_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX "Building_siteId_code_key" ON "Building"("siteId", "code");
CREATE INDEX "Building_siteId_active_name_idx" ON "Building"("siteId", "active", "name");
CREATE TABLE "Area" ("id" TEXT NOT NULL PRIMARY KEY, "buildingId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Area_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX "Area_buildingId_code_key" ON "Area"("buildingId", "code");
CREATE INDEX "Area_buildingId_active_name_idx" ON "Area"("buildingId", "active", "name");
CREATE TABLE "Membership" ("id" TEXT NOT NULL PRIMARY KEY, "organisationId" TEXT NOT NULL, "userId" TEXT NOT NULL, "roleId" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Membership_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Membership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE UNIQUE INDEX "Membership_organisationId_userId_key" ON "Membership"("organisationId", "userId");
CREATE INDEX "Membership_userId_active_idx" ON "Membership"("userId", "active");
CREATE INDEX "Membership_organisationId_roleId_active_idx" ON "Membership"("organisationId", "roleId", "active");

ALTER TABLE "Equipment" ADD COLUMN "organisationId" TEXT NOT NULL DEFAULT 'legacy' REFERENCES "Organisation"("id") ON DELETE CASCADE;
ALTER TABLE "Equipment" ADD COLUMN "siteId" TEXT REFERENCES "Site"("id") ON DELETE SET NULL;
ALTER TABLE "Equipment" ADD COLUMN "buildingId" TEXT REFERENCES "Building"("id") ON DELETE SET NULL;
ALTER TABLE "Equipment" ADD COLUMN "areaId" TEXT REFERENCES "Area"("id") ON DELETE SET NULL;
ALTER TABLE "Asset" ADD COLUMN "organisationId" TEXT NOT NULL DEFAULT 'legacy' REFERENCES "Organisation"("id") ON DELETE CASCADE;
ALTER TABLE "CopilotConversation" ADD COLUMN "organisationId" TEXT NOT NULL DEFAULT 'legacy' REFERENCES "Organisation"("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX "Equipment_organisationId_serialNumber_key" ON "Equipment"("organisationId", "serialNumber");
CREATE INDEX "Equipment_organisationId_siteId_buildingId_areaId_idx" ON "Equipment"("organisationId", "siteId", "buildingId", "areaId");
CREATE UNIQUE INDEX "Asset_organisationId_assetId_key" ON "Asset"("organisationId", "assetId");
CREATE INDEX "Asset_organisationId_status_idx" ON "Asset"("organisationId", "status");
CREATE INDEX "CopilotConversation_organisationId_updatedAt_idx" ON "CopilotConversation"("organisationId", "updatedAt");
INSERT INTO "Membership" ("id", "organisationId", "userId", "roleId", "active", "createdAt", "updatedAt") SELECT 'legacy-' || "id", 'legacy', "id", "roleId", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "User";

PRAGMA foreign_keys=ON;
