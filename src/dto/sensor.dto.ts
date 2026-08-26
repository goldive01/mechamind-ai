import { z } from "zod";

const metric = (min: number, max: number, label: string) => z.number().finite(`${label} must be finite.`).min(min, `${label} is below the supported range.`).max(max, `${label} is above the supported range.`).optional();

export const sensorReadingDtoSchema = z.object({
  deviceId: z.string().trim().min(1).optional(), macAddress: z.string().trim().min(1).optional(),
  temperature: metric(-100, 250, "Temperature"), humidity: metric(0, 100, "Humidity"), vibration: metric(0, 1_000, "Vibration"),
  voltage: metric(0, 100_000, "Voltage"), current: metric(0, 10_000, "Current"), recordedAt: z.iso.datetime({ offset: true }).optional(),
}).strict().superRefine((value, context) => {
  if (!value.deviceId && !value.macAddress) context.addIssue({ code: "custom", message: "Provide deviceId or macAddress.", path: ["deviceId"] });
  if ([value.temperature, value.humidity, value.vibration, value.voltage, value.current].every((v) => v === undefined)) context.addIssue({ code: "custom", message: "Provide at least one sensor value.", path: ["temperature"] });
});

export type SensorReadingDto = z.infer<typeof sensorReadingDtoSchema>;

export const deviceInputSchema = z.object({ assetId: z.string().trim().min(1), deviceName: z.string().trim().min(1), sensorType: z.string().trim().min(1), macAddress: z.string().trim().min(1), firmwareVersion: z.string().trim().min(1) });
export type DeviceInputDto = z.infer<typeof deviceInputSchema>;
export const deviceInputFromForm = (formData: FormData): DeviceInputDto => deviceInputSchema.parse({ assetId: formData.get("assetId"), deviceName: formData.get("deviceName"), sensorType: formData.get("sensorType"), macAddress: formData.get("macAddress"), firmwareVersion: formData.get("firmwareVersion") });

