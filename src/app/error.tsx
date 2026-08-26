"use client";

export default function Error({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Unexpected issue</p>
      <h1 className="mt-4 text-3xl font-semibold">Something went wrong.</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
        The application hit an unexpected error. Please try again in a moment.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-full bg-cyan-500 px-5 py-3 font-medium text-white transition hover:bg-cyan-400"
      >
        Try again
      </button>
    </div>
  );
}
