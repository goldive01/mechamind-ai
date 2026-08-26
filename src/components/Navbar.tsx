import Link from "next/link";
import { appName, tagline } from "@/lib/constants";
import { Button } from "@/components/Button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-lg font-semibold text-cyan-600 dark:text-cyan-300">
            M
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{appName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{tagline}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          <Link href="#features" className="transition hover:text-cyan-600 dark:hover:text-cyan-400">
            Features
          </Link>
          <Link href="#how-it-works" className="transition hover:text-cyan-600 dark:hover:text-cyan-400">
            How it works
          </Link>
          <Link href="#technologies" className="transition hover:text-cyan-600 dark:hover:text-cyan-400">
            Technologies
          </Link>
        </nav>

        <Button href="/dashboard" size="sm">
          Open dashboard
        </Button>
      </div>
    </header>
  );
}
