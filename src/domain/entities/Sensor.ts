export interface SensorReading {
  id: string;
  sensorDeviceId: string;
  temperature: number | null;
  humidity: number | null;
  vibration: number | null;
  voltage: number | null;
  current: number | null;
  recordedAt: Date;
}

export interface SensorDeviceRef {
  id: string;
  equipmentId: string;
  assetId: string;
}

