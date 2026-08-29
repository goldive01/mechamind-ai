import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { requireDashboardPermission } from "@/lib/auth-session";
import { createAccessControlServices } from "@/services/accessControlFactory";
import { assignUserRole, createUser } from "./actions";

export const dynamic = "force-dynamic";
const field = "rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700";
export default async function UsersPage() {
  await requireDashboardPermission("system:admin");
  const services = createAccessControlServices();
  const [users, roles] = await Promise.all([services.authentication.listUsers(), services.roles.list()]);
  return <div className="space-y-6"><PageHeader title="Users" description="Create accounts and assign operational roles." />
    <Card title="Add user"><form action={createUser} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><input name="fullName" required placeholder="Full name" className={field}/><input name="email" type="email" required placeholder="Email" className={field}/><input name="password" type="password" minLength={10} required placeholder="Temporary password" className={field}/><select name="roleId" className={field}><option value="">No role</option>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select><button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">Create user</button></form></Card>
    <div className="grid gap-4 xl:grid-cols-2">{users.map(user => <Card key={user.id} title={user.fullName} description={user.email}><form action={assignUserRole} className="flex items-center gap-3"><input type="hidden" name="userId" value={user.id}/><select name="roleId" defaultValue={user.role?.id ?? ""} className={`${field} flex-1`}><option value="">No role</option>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select><button className="rounded-xl border border-cyan-600 px-3 py-2 text-sm font-medium text-cyan-700">Save role</button></form></Card>)}</div>
  </div>;
}
