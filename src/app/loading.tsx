export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
      <div className="space-y-4">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <p className="text-lg font-medium">Preparing your workspace…</p>
      </div>
    </div>
  );
}
