"use server";

import { revalidatePath } from "next/cache";
import { alertActionSchema } from "@/dto/alert.dto";
import { createAlertService } from "@/services/alertFactory";

const parse = (formData: FormData) => alertActionSchema.parse({ alertId: formData.get("alertId"), actor: formData.get("actor") || "Operations Team", note: formData.get("note") || undefined });
export async function acknowledgeAlert(formData: FormData) { const input = parse(formData); await createAlertService().acknowledge(input.alertId, input.actor, input.note); revalidatePath("/dashboard/alerts"); }
export async function resolveAlert(formData: FormData) { const input = parse(formData); await createAlertService().resolve(input.alertId, input.actor, input.note); revalidatePath("/dashboard/alerts"); }

