"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const currentPath = usePathname();
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-950/80 lg:block">
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400">
            Operations Hub
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            A calm control center for maintenance teams.
          </p>
        </div>

        <nav className="space-y-2">
          {dashboardNavItems.map((item) => {
            const href = `/dashboard${item.href}`;
            const active = currentPath === href || (item.href !== "/" && currentPath.startsWith(href));

            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-cyan-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                )}
              >
                <span>{item.label}</span>
                <span className="text-xs opacity-70">↗</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
