"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardPermission } from "@/lib/auth-session";
import { createAccessControlServices } from "@/services/accessControlFactory";

export async function createUser(formData: FormData) {
  await requireDashboardPermission("system:admin");
  await createAccessControlServices().authentication.register({
    fullName: formData.get("fullName"), email: formData.get("email"), password: formData.get("password"),
    roleId: formData.get("roleId") || null, active: true,
  });
  revalidatePath("/dashboard/users");
}

export async function assignUserRole(formData: FormData) {
  await requireDashboardPermission("system:admin");
  await createAccessControlServices().roles.assignUser({ userId: formData.get("userId"), roleId: formData.get("roleId") || null });
  revalidatePath("/dashboard/users");
}
