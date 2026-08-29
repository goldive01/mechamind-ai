"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deviceInputFromForm } from "@/dto/sensor.dto";
import { PrismaSensorRepository } from "@/infrastructure/repositories/PrismaSensorRepository";
import { SensorService } from "@/services/SensorService";
import { requireDashboardPermission } from "@/lib/auth-session";

const sensorService = new SensorService(new PrismaSensorRepository());

export async function createDevice(formData: FormData) {
  await requireDashboardPermission();
  const device = await sensorService.createDevice(deviceInputFromForm(formData));
  revalidatePath("/dashboard/devices"); revalidatePath("/dashboard/iot");
  redirect(`/dashboard/devices/${device.id}`);
}

export async function updateDevice(deviceId: string, formData: FormData) {
  await requireDashboardPermission();
  await sensorService.updateDevice(deviceId, deviceInputFromForm(formData));
  revalidatePath("/dashboard/devices"); revalidatePath(`/dashboard/devices/${deviceId}`); revalidatePath("/dashboard/iot");
  redirect(`/dashboard/devices/${deviceId}`);
}
