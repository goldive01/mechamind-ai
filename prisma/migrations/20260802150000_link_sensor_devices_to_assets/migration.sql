PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_SensorDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "sensorType" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "firmwareVersion" TEXT NOT NULL,
    "lastSeen" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SensorDevice_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SensorDevice_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_SensorDevice" ("id", "equipmentId", "assetId", "deviceName", "sensorType", "macAddress", "firmwareVersion", "lastSeen")
SELECT d."id", d."equipmentId", a."id", d."deviceName", d."sensorType", d."macAddress", d."firmwareVersion", d."lastSeen"
FROM "SensorDevice" d
JOIN "Asset" a ON a."equipmentId" = d."equipmentId";

DROP TABLE "SensorDevice";
ALTER TABLE "new_SensorDevice" RENAME TO "SensorDevice";
CREATE UNIQUE INDEX "SensorDevice_macAddress_key" ON "SensorDevice"("macAddress");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
