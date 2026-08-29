import { Sidebar } from "@/components/Sidebar";
import { logout } from "@/app/login/actions";
import { requireDashboardSession } from "@/lib/auth-session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireDashboardSession();
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8"><div className="mb-4 flex items-center justify-end gap-3 text-sm text-slate-600"><span>{session.user.fullName} · {session.user.role?.name ?? "No role"}</span><form action={logout}><button className="rounded-lg border border-slate-300 px-3 py-1.5">Sign out</button></form></div>{children}</div>
    </div>
  );
}
