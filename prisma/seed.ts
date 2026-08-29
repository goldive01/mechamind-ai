import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword } from "../src/services/AuthenticationService";

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
  const organisation = await prisma.organisation.upsert({ where: { slug: "mechamind" }, update: { name: "MechaMind Operations", active: true }, create: { id: "legacy", slug: "mechamind", name: "MechaMind Operations", description: "Default operational organisation." } });

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
          organisationId: organisation.id,
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
          organisationId: organisation.id,
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

  const permissionCodes = ["system:admin", "dashboard:read", "dashboard:write", "assets:read", "assets:write", "ai:analyse", "inspections:create", "telemetry:create", "copilot:use", "maintenance:write", "reports:generate"];
  const permissions = await Promise.all(permissionCodes.map((code) => prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code.split(":").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ") } })));
  const adminRole = await prisma.role.upsert({ where: { name: "Administrator" }, update: {}, create: { name: "Administrator", description: "Full MechaMind operations access." } });
  await Promise.all(permissions.map((permission) => prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } }, update: {}, create: { roleId: adminRole.id, permissionId: permission.id } })));
  const engineerRole = await prisma.role.upsert({ where: { name: "Engineer" }, update: {}, create: { name: "Engineer", description: "Operational engineering access." } });
  await Promise.all(permissions.filter((permission) => permission.code !== "system:admin").map((permission) => prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: engineerRole.id, permissionId: permission.id } }, update: {}, create: { roleId: engineerRole.id, permissionId: permission.id } })));
  const seedPasswordHash = hashPassword(process.env.SEED_USER_PASSWORD ?? "MechaMind123!");
  await prisma.user.createMany({
    data: [
      { fullName: "Alex Morgan", email: "alex@example.com", passwordHash: seedPasswordHash, roleId: adminRole.id },
      { fullName: "Riley Chen", email: "riley@example.com", passwordHash: seedPasswordHash, roleId: engineerRole.id },
      { fullName: "Sam Ortiz", email: "sam@example.com", passwordHash: seedPasswordHash, roleId: engineerRole.id },
    ],
  });
  const users = await prisma.user.findMany();
  await prisma.membership.createMany({ data: users.map(user => ({ organisationId: organisation.id, userId: user.id, roleId: user.roleId, active: true })) });

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
