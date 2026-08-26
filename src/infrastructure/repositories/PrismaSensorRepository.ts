import "server-only";
import type { DeviceInputDto, SensorReadingDto } from "@/dto/sensor.dto";
import { prisma } from "@/lib/prisma";
import type { SensorRepository } from "@/repositories/SensorRepository";

export class PrismaSensorRepository implements SensorRepository {
  async storeReading(input: SensorReadingDto) {
    const device = await prisma.sensorDevice.findFirst({ where: input.deviceId ? { id: input.deviceId } : { macAddress: input.macAddress }, select: { id: true } });
    if (!device) return null;
    return prisma.$transaction(async (tx) => {
      const created = await tx.sensorReading.create({ data: { sensorDeviceId: device.id, temperature: input.temperature, humidity: input.humidity, vibration: input.vibration, voltage: input.voltage, current: input.current, recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date() } });
      await tx.sensorDevice.update({ where: { id: device.id }, data: { lastSeen: created.recordedAt } });
      return created;
    });
  }

  async createDevice(input: DeviceInputDto) {
    const asset = await prisma.asset.findUniqueOrThrow({ where: { id: input.assetId }, select: { id: true, equipmentId: true } });
    return prisma.sensorDevice.create({ data: { assetId: asset.id, equipmentId: asset.equipmentId, deviceName: input.deviceName, sensorType: input.sensorType, macAddress: input.macAddress, firmwareVersion: input.firmwareVersion }, select: { id: true } });
  }

  async updateDevice(deviceId: string, input: DeviceInputDto) {
    const asset = await prisma.asset.findUniqueOrThrow({ where: { id: input.assetId }, select: { id: true, equipmentId: true } });
    await prisma.sensorDevice.update({ where: { id: deviceId }, data: { assetId: asset.id, equipmentId: asset.equipmentId, deviceName: input.deviceName, sensorType: input.sensorType, macAddress: input.macAddress, firmwareVersion: input.firmwareVersion } });
  }
}

