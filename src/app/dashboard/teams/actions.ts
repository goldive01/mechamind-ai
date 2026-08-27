"use server";

import { revalidatePath } from "next/cache";
import { createTeamSchema, teamMembershipInputSchema } from "@/dto/engineer.dto";
import { createEngineerService } from "@/services/engineerFactory";

const refresh = () => { revalidatePath("/dashboard/engineers"); revalidatePath("/dashboard/teams"); };
export async function createTeam(formData: FormData) { await createEngineerService().createTeam(createTeamSchema.parse({ name: formData.get("name"), description: formData.get("description") || null, active: true })); refresh(); }
export async function addTeamMember(formData: FormData) { await createEngineerService().addTeamMember(teamMembershipInputSchema.parse({ teamId: formData.get("teamId"), engineerId: formData.get("engineerId"), role: formData.get("role") || "Member" })); refresh(); }
