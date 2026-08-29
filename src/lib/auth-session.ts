import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiError } from "@/infrastructure/http/api-response";
import { createAuthServices } from "@/services/authFactory";
import { createOrganisationServices } from "@/services/organisationFactory";

export const SESSION_COOKIE = "mechamind_session";
export const ORGANISATION_COOKIE = "mechamind_organisation";
export async function currentSession() { return createAuthServices().authentication.authenticate((await cookies()).get(SESSION_COOKIE)?.value); }
export async function requireDashboardSession() { const session = await currentSession(); if (!session) redirect("/login"); return session; }
export async function requireDashboardPermission(permission = "dashboard:write") { const session = await requireDashboardSession(); await createAuthServices().authorization.require(session, permission, "Dashboard"); return session.user; }
export async function requireOrganisationScope() { const session = await requireDashboardSession(); const requested = (await cookies()).get(ORGANISATION_COOKIE)?.value; const organisations = await createOrganisationServices().organisations.listForUser(session.user.id); const organisation = requested ? organisations.find(item => item.id === requested) : organisations[0]; if (!organisation) redirect("/dashboard/organisations"); return { organisationId: organisation.id, organisation, user: session.user }; }
export async function authorizeApi(permission: string) { const services = createAuthServices(); const session = await currentSession(); if (!session) return { response: apiError("Authentication required.", 401) } as const; try { await services.authorization.require(session, permission, "API"); await services.audit.record({ userId: session.user.id, action: "API_ACCESS", resource: "API", metadata: { permission } }); return { session } as const; } catch { return { response: apiError("Permission denied.", 403) } as const; } }
