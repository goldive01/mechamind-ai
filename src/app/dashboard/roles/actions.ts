"use server";
import { revalidatePath } from "next/cache";
import { requireDashboardPermission } from "@/lib/auth-session";
import { createAccessControlServices } from "@/services/accessControlFactory";
const refresh = () => revalidatePath("/dashboard/roles");
export async function createRole(formData: FormData) { await requireDashboardPermission("system:admin"); await createAccessControlServices().roles.create({ name: formData.get("name"), description: formData.get("description") || null }); refresh(); }
export async function grantPermission(formData: FormData) { await requireDashboardPermission("system:admin"); await createAccessControlServices().roles.grantPermission({ roleId: formData.get("roleId"), permissionId: formData.get("permissionId") }); refresh(); }
export async function revokePermission(formData: FormData) { await requireDashboardPermission("system:admin"); await createAccessControlServices().roles.revokePermission({ roleId: formData.get("roleId"), permissionId: formData.get("permissionId") }); refresh(); }
