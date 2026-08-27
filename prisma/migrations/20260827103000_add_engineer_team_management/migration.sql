CREATE TABLE "Engineer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxConcurrentWorkOrders" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Engineer_employeeNumber_key" ON "Engineer"("employeeNumber");
CREATE UNIQUE INDEX "Engineer_email_key" ON "Engineer"("email");

CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

CREATE TABLE "EngineerSkill" (
    "engineerId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiency" INTEGER NOT NULL DEFAULT 1,
    "yearsExperience" REAL NOT NULL DEFAULT 0,
    PRIMARY KEY ("engineerId", "skillId"),
    CONSTRAINT "EngineerSkill_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Engineer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EngineerSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EngineerSkill_skillId_proficiency_idx" ON "EngineerSkill"("skillId", "proficiency");

CREATE TABLE "Certification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engineerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "credentialCode" TEXT,
    "issuedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certification_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Engineer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Certification_engineerId_expiresAt_idx" ON "Certification"("engineerId", "expiresAt");

CREATE TABLE "EngineerAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engineerId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "note" TEXT,
    CONSTRAINT "EngineerAvailability_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Engineer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EngineerAvailability_engineerId_startsAt_endsAt_idx" ON "EngineerAvailability"("engineerId", "startsAt", "endsAt");
CREATE INDEX "EngineerAvailability_status_startsAt_endsAt_idx" ON "EngineerAvailability"("status", "startsAt", "endsAt");

CREATE TABLE "TeamMembership" (
    "teamId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Member',
    PRIMARY KEY ("teamId", "engineerId"),
    CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMembership_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Engineer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "TeamMembership_engineerId_idx" ON "TeamMembership"("engineerId");

ALTER TABLE "WorkOrder" ADD COLUMN "assignedEngineerId" TEXT REFERENCES "Engineer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD COLUMN "teamId" TEXT REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "WorkOrder_assignedEngineerId_status_idx" ON "WorkOrder"("assignedEngineerId", "status");
CREATE INDEX "WorkOrder_teamId_status_idx" ON "WorkOrder"("teamId", "status");
