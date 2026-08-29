import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { requireDashboardPermission } from "@/lib/auth-session";
import { createAccessControlServices } from "@/services/accessControlFactory";
import { createPermission } from "./actions";
export const dynamic = "force-dynamic";
const field = "rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700";
export default async function PermissionsPage() { await requireDashboardPermission("system:admin"); const permissions = await createAccessControlServices().permissions.list(); return <div className="space-y-6"><PageHeader title="Permissions" description="Define the capabilities available to roles and Copilot."/><Card title="Add permission"><form action={createPermission} className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr_auto]"><input name="code" required pattern="[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*" placeholder="resource:action" className={field}/><input name="name" required placeholder="Display name" className={field}/><input name="description" placeholder="Description" className={field}/><button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">Create permission</button></form></Card><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{permissions.map(permission => <Card key={permission.id} title={permission.name} description={permission.code}><p className="text-sm text-slate-500">{permission.description ?? "No description"}</p></Card>)}</div></div>; }
