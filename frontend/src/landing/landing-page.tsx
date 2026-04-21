import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const trustLogos = [
  'Banco Central',
  'FinanzasNova',
  'CapitalUnion',
  'Andes Trust',
  'Atlas Bank',
  'CrediNorte',
]

const valuePillars = [
  {
    title: 'Consistent answers',
    description: 'Every team uses the same institutional knowledge base and reduces service variation.',
  },
  {
    title: 'Faster operations',
    description: 'Your team responds in seconds and frees time for higher-impact work.',
  },
  {
    title: 'Control and traceability',
    description: 'Every improvement is recorded for internal audit and compliance.',
  },
]

const useCases = [
  {
    title: 'Customer support',
    description:
      'Provide clear answers about products, requirements, and processes through a modern conversational experience.',
  },
  {
    title: 'Channels and branches',
    description:
      'Support advisors and branch staff with up-to-date information for better service in every interaction.',
  },
  {
    title: 'Support desk',
    description:
      'Detect unresolved questions and turn them into actionable knowledge without complex workflows.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute right-0 top-44 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-8 md:py-12">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
              Financial SaaS for banking
            </p>
            <p className="mt-1 text-sm text-slate-300">Enterprise-ready platform</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800/70"
            >
              Sign in
            </Link>
            <Link
              to="/app"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
            >
              Try demo
            </Link>
          </div>
        </header>

        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/55 p-6 shadow-2xl backdrop-blur md:grid-cols-[1.35fr_1fr] md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
              Your intelligent financial assistant
            </span>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
              A ChatGPT-style experience for your institution, with enterprise control.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-slate-300 md:text-lg">
              Unify knowledge, improve service quality, and accelerate internal operations with a
              modern, secure, and easy-to-manage conversational platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/app"
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Try demo
              </Link>
              <Link
                to="/admin/dashboard"
                className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800/70"
              >
                Open admin panel
              </Link>
              <Link
                to="/admin/docs"
                className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800/70"
              >
                View operational guide
              </Link>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-slate-700/70 bg-slate-950/65 p-5"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">Impact indicators</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-2xl font-semibold text-emerald-300">-43%</p>
                <p className="text-xs text-slate-400">Average internal response time</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-2xl font-semibold text-indigo-300">+31%</p>
                <p className="text-xs text-slate-400">First-contact resolution</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-2xl font-semibold text-cyan-300">24/7</p>
                <p className="text-xs text-slate-400">Availability for teams and customers</p>
              </div>
            </div>
          </motion.aside>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Trusted by financial teams
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {trustLogos.map((logo, index) => (
              <motion.div
                key={logo}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-center text-xs text-slate-300"
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {valuePillars.map((pillar) => (
            <motion.article
              key={pillar.title}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition"
            >
              <h2 className="text-lg font-semibold">{pillar.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{pillar.description}</p>
            </motion.article>
          ))}
        </section>

        <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/45 p-6 md:grid-cols-3">
          {useCases.map((item, idx) => (
            <article key={item.title}>
              <p className="text-sm font-semibold text-indigo-300">
                {idx + 1}. {item.title}
              </p>
              <p className="mt-2 text-sm text-slate-300">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-indigo-500/35 bg-gradient-to-r from-indigo-900/35 to-cyan-900/25 p-7 text-center">
          <h3 className="text-2xl font-semibold md:text-3xl">
            Bring your financial assistant to enterprise level
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-200">
            Deliver a professional conversational experience for customers and teams, with simple
            operations for business and strong governance for administrators.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Start now
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-slate-500/60 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800/60"
            >
              Access my account
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
