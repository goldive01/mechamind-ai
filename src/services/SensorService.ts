import type { DeviceInputDto, SensorReadingDto } from "@/dto/sensor.dto";
import type { SensorRepository } from "@/repositories/SensorRepository";
import type { AlertMonitor } from "@/services/AlertEvaluationService";
import { createLogger } from "@/infrastructure/logging/Logger";
import type { MemoryIngestor } from "@/services/MemoryIngestionService";

const logger = createLogger("SensorService");

export class SensorDeviceNotFoundError extends Error {}

export class SensorService {
  constructor(private readonly sensors: SensorRepository, private readonly alerts?: AlertMonitor, private readonly memories?: MemoryIngestor) {}
  async record(input: SensorReadingDto) {
    const reading = await this.sensors.storeReading(input);
    if (!reading) throw new SensorDeviceNotFoundError("Sensor device not found.");
    try { const values = { temperature: input.temperature, humidity: input.humidity, vibration: input.vibration, voltage: input.voltage, current: input.current }; await this.memories?.ingest({ organisationId: "legacy", sourceType: "Sensor", sourceId: reading.id, eventType: "SensorAnomaly", title: "Sensor anomaly observation", summary: Object.entries(values).filter(([, value]) => value != null).map(([key, value]) => `${key} ${value}`).join(", ") || "Sensor reading recorded", sensorId: input.deviceId ?? input.macAddress ?? null, confidence: 0.9, occurredAt: reading.recordedAt, details: values, tags: [{ name: "sensor", value: input.deviceId ?? input.macAddress ?? "unknown" }] }); } catch (error) { logger.error("Engineering memory ingestion failed", error); }
    try { await this.alerts?.evaluateSensor(input.deviceId, input.macAddress, reading.id); } catch (error) { logger.error("Automatic alert evaluation failed", error); }
    return reading;
  }
  createDevice(input: DeviceInputDto) { return this.sensors.createDevice(input); }
  async updateDevice(deviceId: string, input: DeviceInputDto) {
    if (!deviceId.trim()) throw new Error("Device id is required.");
    await this.sensors.updateDevice(deviceId, input);
  }
}
