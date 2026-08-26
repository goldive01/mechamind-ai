import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.deleteMany();
  await prisma.sensorReading.deleteMany();
  await prisma.sensorDevice.deleteMany();
  await prisma.aIReport.deleteMany();
  await prisma.inspectionImage.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetSequence.deleteMany();
  await prisma.equipment.deleteMany();

  const equipment = await Promise.all(
    Array.from({ length: 5 }).map((_, index) =>
      prisma.equipment.create({
        data: {
          name: `Equipment ${index + 1}`,
          manufacturer: ["Atlas", "Linea", "Northwind", "Vega", "Helix"][index],
          model: `Model-${index + 1}`,
          serialNumber: `SER-${1000 + index}`,
          category: ["Hydraulic", "Electrical", "Mechanical", "Robotic", "Pneumatic"][index],
          description: `High-performance equipment unit ${index + 1}`,
          location: ["Plant A", "Plant B", "Warehouse", "Dock 2", "Lab"][index],
          image: `/images/equipment-${index + 1}.png`,
        },
      }),
    ),
  );

  const assets = await Promise.all(
    equipment.map((equipmentItem, index) =>
      prisma.asset.create({
        data: {
          assetId: `MM-${String(index + 1).padStart(6, "0")}`,
          equipmentId: equipmentItem.id,
          primaryImage: equipmentItem.image,
        },
      }),
    ),
  );

  await prisma.assetSequence.create({ data: { id: "asset", value: assets.length } });

  await Promise.all(
    Array.from({ length: 15 }).map((_, index) => {
      const equipmentItem = equipment[index % equipment.length];
      const asset = assets[index % assets.length];
      return prisma.inspection.create({
        data: {
          equipmentId: equipmentItem.id,
          assetId: asset.id,
          overallCondition: ["Excellent", "Good", "Fair", "Needs Attention"][index % 4],
          notes: `Inspection note ${index + 1}`,
          inspectionDate: new Date(Date.now() - index * 86400000),
          images: {
            create: [{ imagePath: `/images/inspection-${index + 1}-a.png` }],
          },
          aiReport: {
            create: {
              assetId: asset.id,
              diagnosis: `Diagnosis ${index + 1}`,
              recommendations: `Recommendation ${index + 1}`,
              riskLevel: ["Low", "Medium", "High"][index % 3],
            },
          },
        },
      });
    }),
  );

  await prisma.maintenanceRecord.createMany({
    data: Array.from({ length: 10 }).map((_, index) => ({
      equipmentId: equipment[index % equipment.length].id,
      maintenanceType: ["Inspection", "Lubrication", "Calibration", "Repair"][index % 4],
      performedBy: `Technician ${index + 1}`,
      notes: `Maintenance note ${index + 1}`,
      maintenanceDate: new Date(Date.now() - index * 172800000),
    })),
  });

  const sensorDevices = await Promise.all(
    Array.from({ length: 5 }).map((_, index) =>
      prisma.sensorDevice.create({
        data: {
          equipmentId: equipment[index].id,
          assetId: assets[index].id,
          deviceName: `Sensor ${index + 1}`,
          sensorType: ["Temperature", "Vibration", "Pressure", "Humidity"][index % 4],
          macAddress: `00:1A:2B:${String(index + 1).padStart(2, "0")}:C${index + 1}`,
          firmwareVersion: `1.${index + 1}.0`,
          lastSeen: new Date(Date.now() - index * 3600000),
        },
      }),
    ),
  );

  await prisma.sensorReading.createMany({
    data: Array.from({ length: 100 }).map((_, index) => {
      const sensorDevice = sensorDevices[index % sensorDevices.length];
      return {
        sensorDeviceId: sensorDevice.id,
        temperature: 20 + (index % 10) * 0.5,
        humidity: 40 + (index % 8) * 1.25,
        vibration: 0.8 + (index % 6) * 0.1,
        voltage: 220 + (index % 5) * 0.2,
        current: 1.5 + (index % 7) * 0.3,
        recordedAt: new Date(Date.now() - index * 60000),
      };
    }),
  });

  await prisma.user.createMany({
    data: [
      { fullName: "Alex Morgan", email: "alex@example.com" },
      { fullName: "Riley Chen", email: "riley@example.com" },
      { fullName: "Sam Ortiz", email: "sam@example.com" },
    ],
  });

  console.log("Seed data created successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
