import type { DeviceInputDto, SensorReadingDto } from "@/dto/sensor.dto";
import type { SensorRepository } from "@/repositories/SensorRepository";
import type { AlertMonitor } from "@/services/AlertEvaluationService";
import { createLogger } from "@/infrastructure/logging/Logger";

const logger = createLogger("SensorService");

export class SensorDeviceNotFoundError extends Error {}

export class SensorService {
  constructor(private readonly sensors: SensorRepository, private readonly alerts?: AlertMonitor) {}
  async record(input: SensorReadingDto) {
    const reading = await this.sensors.storeReading(input);
    if (!reading) throw new SensorDeviceNotFoundError("Sensor device not found.");
    try { await this.alerts?.evaluateSensor(input.deviceId, input.macAddress, reading.id); } catch (error) { logger.error("Automatic alert evaluation failed", error); }
    return reading;
  }
  createDevice(input: DeviceInputDto) { return this.sensors.createDevice(input); }
  async updateDevice(deviceId: string, input: DeviceInputDto) {
    if (!deviceId.trim()) throw new Error("Device id is required.");
    await this.sensors.updateDevice(deviceId, input);
  }
}
