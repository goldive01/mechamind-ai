import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">404</p>
      <h1 className="mt-4 text-3xl font-semibold">Page not found.</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
        The route you requested is not available yet. Return home and continue building.
      </p>
      <Link href="/" className="mt-6 rounded-full bg-cyan-500 px-5 py-3 font-medium text-white transition hover:bg-cyan-400">
        Go home
      </Link>
    </div>
  );
}
