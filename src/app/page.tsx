import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionTitle } from "@/components/SectionTitle";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { appName, features, howItWorks, tagline, technologies } from "@/lib/constants";

export default function Home() {
  return (
    <div id="top" className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_32%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] dark:text-slate-100">
      <Navbar />

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-700 dark:text-cyan-300">
              {tagline}
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Build smarter maintenance operations with an AI engineer at your side.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
              {appName} gives teams a polished command center for equipment, inspections, and next-step recommendations without the clutter.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/dashboard" size="lg">Launch the dashboard</Button>
              <Button href="#features" variant="secondary" size="lg">Explore features</Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="rounded-full border border-slate-300 px-3 py-1 dark:border-slate-700">Responsive</span>
              <span className="rounded-full border border-slate-300 px-3 py-1 dark:border-slate-700">Accessible</span>
              <span className="rounded-full border border-slate-300 px-3 py-1 dark:border-slate-700">Prisma-ready</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400">Launch pad</p>
              <h2 className="mt-3 text-2xl font-semibold">Everything you need to go from field notes to action.</h2>
              <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">Keep maintenance workflows visible from a single dashboard.</li>
                <li className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">Surface follow-ups with a crisp, modern interface.</li>
                <li className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">Scale from a single site to a multi-team operation.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionTitle
            eyebrow="Features"
            title="Purpose-built for modern field operations"
            description="The product foundation is designed to feel calm, capable, and ready for future expansion."
            centered
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} title={feature.title} description={feature.description} />
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionTitle
              eyebrow="How it works"
              title="From signal to action"
              description="The experience is designed to keep every step simple and transparent."
            />
            <div className="space-y-4">
              {howItWorks.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="technologies" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionTitle
            eyebrow="Technologies"
            title="A clean stack with room to grow"
            description="The foundation is already aligned with a robust production setup."
            centered
          />
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {technologies.map((technology) => (
              <span key={technology} className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                {technology}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-10 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300">Ready to build</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Turn your next idea into a polished product experience.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Start with the core foundation and move quickly into features, automation, and deeper AI workflows.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button href="/dashboard">Open dashboard</Button>
              <Button href="#top" variant="secondary">Back to top</Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
