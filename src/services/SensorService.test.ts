import { describe, expect, it, vi } from "vitest";
import type { SensorRepository } from "@/repositories/SensorRepository";
import { SensorDeviceNotFoundError, SensorService } from "@/services/SensorService";

const repository = (stored: Awaited<ReturnType<SensorRepository["storeReading"]>>): SensorRepository => ({ storeReading: vi.fn().mockResolvedValue(stored), createDevice: vi.fn(), updateDevice: vi.fn() });

describe("SensorService", () => {
  it("returns a reading stored by the repository", async () => {
    const reading = { id: "r1", sensorDeviceId: "d1", temperature: 42, humidity: null, vibration: null, voltage: null, current: null, recordedAt: new Date() };
    const sensors = repository(reading);
    await expect(new SensorService(sensors).record({ deviceId: "d1", temperature: 42 })).resolves.toBe(reading);
  });

  it("raises a domain-specific error for an unknown device", async () => {
    await expect(new SensorService(repository(null)).record({ macAddress: "missing", vibration: 1 })).rejects.toBeInstanceOf(SensorDeviceNotFoundError);
  });

  it("triggers autonomous alert evaluation after storing a reading", async () => {
    const reading = { id: "r2", sensorDeviceId: "d1", temperature: 90, humidity: null, vibration: null, voltage: null, current: null, recordedAt: new Date() };
    const monitor = { evaluateSensor: vi.fn().mockResolvedValue([]), evaluateAsset: vi.fn() };
    await new SensorService(repository(reading), monitor).record({ deviceId: "d1", temperature: 90 });
    expect(monitor.evaluateSensor).toHaveBeenCalledWith("d1", undefined, "r2");
  });
});
