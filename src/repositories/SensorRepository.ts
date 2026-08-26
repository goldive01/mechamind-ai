import type { DeviceInputDto, SensorReadingDto } from "@/dto/sensor.dto";
import type { SensorReading } from "@/domain/entities/Sensor";

export interface SensorRepository {
  storeReading(input: SensorReadingDto): Promise<SensorReading | null>;
  createDevice(input: DeviceInputDto): Promise<{ id: string }>;
  updateDevice(deviceId: string, input: DeviceInputDto): Promise<void>;
}

