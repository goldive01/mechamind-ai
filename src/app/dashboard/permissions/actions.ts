"use server";
import { revalidatePath } from "next/cache";
import { requireDashboardPermission } from "@/lib/auth-session";
import { createAccessControlServices } from "@/services/accessControlFactory";
export async function createPermission(formData: FormData) { await requireDashboardPermission("system:admin"); await createAccessControlServices().permissions.create({ code: formData.get("code"), name: formData.get("name"), description: formData.get("description") || null }); revalidatePath("/dashboard/permissions"); revalidatePath("/dashboard/roles"); }
