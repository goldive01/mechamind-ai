import { appName } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 py-10 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 text-sm text-slate-600 md:flex-row md:items-center md:justify-between lg:px-8 dark:text-slate-400">
        <p>© 2026 {appName}. Built for modern maintenance teams.</p>
        <div className="flex gap-4">
          <a href="#features" className="transition hover:text-cyan-600 dark:hover:text-cyan-400">
            Features
          </a>
          <a href="#technologies" className="transition hover:text-cyan-600 dark:hover:text-cyan-400">
            Technologies
          </a>
        </div>
      </div>
    </footer>
  );
}
