"use server";

import { revalidatePath } from "next/cache";
import { availabilityInputSchema, certificationInputSchema, createEngineerSchema, skillInputSchema } from "@/dto/engineer.dto";
import { createEngineerService } from "@/services/engineerFactory";

const date = (value: FormDataEntryValue | null) => typeof value === "string" && value ? new Date(value).toISOString() : undefined;
const refresh = () => { revalidatePath("/dashboard/engineers"); revalidatePath("/dashboard/teams"); };
export async function createEngineer(formData: FormData) { await createEngineerService().createEngineer(createEngineerSchema.parse({ employeeNumber: formData.get("employeeNumber"), name: formData.get("name"), email: formData.get("email"), maxConcurrentWorkOrders: Number(formData.get("maxConcurrentWorkOrders") || 5), active: true })); refresh(); }
export async function addEngineerSkill(formData: FormData) { await createEngineerService().addSkill(skillInputSchema.parse({ engineerId: formData.get("engineerId"), name: formData.get("name"), category: formData.get("category"), proficiency: Number(formData.get("proficiency")), yearsExperience: Number(formData.get("yearsExperience")) })); refresh(); }
export async function addEngineerCertification(formData: FormData) { await createEngineerService().addCertification(certificationInputSchema.parse({ engineerId: formData.get("engineerId"), name: formData.get("name"), issuer: formData.get("issuer"), credentialCode: formData.get("credentialCode") || null, issuedAt: date(formData.get("issuedAt")), expiresAt: date(formData.get("expiresAt")) })); refresh(); }
export async function addEngineerAvailability(formData: FormData) { await createEngineerService().addAvailability(availabilityInputSchema.parse({ engineerId: formData.get("engineerId"), startsAt: date(formData.get("startsAt")), endsAt: date(formData.get("endsAt")), status: formData.get("status"), note: formData.get("note") || null })); refresh(); }
