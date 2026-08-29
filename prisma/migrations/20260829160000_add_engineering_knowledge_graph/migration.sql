CREATE TABLE "KnowledgeCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeCategory_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "KnowledgeNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "categoryId" TEXT,
    "nodeType" TEXT NOT NULL,
    "externalKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "confidence" REAL NOT NULL DEFAULT 0.7,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeNode_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeNode_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KnowledgeCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "KnowledgeEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.7,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "sourceMemoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeEdge_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeEdge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "KnowledgeNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeEdge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "KnowledgeNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeEdge_sourceMemoryId_fkey" FOREIGN KEY ("sourceMemoryId") REFERENCES "EngineeringMemory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "KnowledgeFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "predicate" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.7,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "sourceMemoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeFact_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeFact_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "KnowledgeNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeFact_sourceMemoryId_fkey" FOREIGN KEY ("sourceMemoryId") REFERENCES "EngineeringMemory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "KnowledgeCategory_organisationId_key_key" ON "KnowledgeCategory"("organisationId", "key");
CREATE INDEX "KnowledgeCategory_organisationId_name_idx" ON "KnowledgeCategory"("organisationId", "name");
CREATE UNIQUE INDEX "KnowledgeNode_organisationId_nodeType_externalKey_key" ON "KnowledgeNode"("organisationId", "nodeType", "externalKey");
CREATE INDEX "KnowledgeNode_organisationId_nodeType_label_idx" ON "KnowledgeNode"("organisationId", "nodeType", "label");
CREATE INDEX "KnowledgeNode_categoryId_idx" ON "KnowledgeNode"("categoryId");
CREATE UNIQUE INDEX "KnowledgeEdge_organisationId_fromNodeId_toNodeId_relationship_key" ON "KnowledgeEdge"("organisationId", "fromNodeId", "toNodeId", "relationship");
CREATE INDEX "KnowledgeEdge_organisationId_relationship_idx" ON "KnowledgeEdge"("organisationId", "relationship");
CREATE INDEX "KnowledgeEdge_toNodeId_idx" ON "KnowledgeEdge"("toNodeId");
CREATE INDEX "KnowledgeEdge_sourceMemoryId_idx" ON "KnowledgeEdge"("sourceMemoryId");
CREATE UNIQUE INDEX "KnowledgeFact_organisationId_nodeId_predicate_value_key" ON "KnowledgeFact"("organisationId", "nodeId", "predicate", "value");
CREATE INDEX "KnowledgeFact_organisationId_predicate_value_idx" ON "KnowledgeFact"("organisationId", "predicate", "value");
CREATE INDEX "KnowledgeFact_sourceMemoryId_idx" ON "KnowledgeFact"("sourceMemoryId");
