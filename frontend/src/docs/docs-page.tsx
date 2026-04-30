import { NavLink } from 'react-router-dom'

const quickActions = [
  {
    title: 'Train assistant',
    description: 'Upload documents, links, and text to keep the knowledge base up to date.',
    to: '/admin/knowledge',
  },
  {
    title: 'Review open questions',
    description: 'Resolve unanswered cases to close the continuous improvement loop.',
    to: '/admin/unresolved',
  },
  {
    title: 'Monitor metrics',
    description: 'Validate latency, error rate, and unresolved rate before publishing changes.',
    to: '/admin/metrics',
  },
]

const docsSections = [
  {
    step: 'Step 1',
    title: 'Prepare quality content',
    description: 'All training should start from official, current, and verifiable information.',
    items: [
      'Prioritize regulatory documents and compliance-approved procedures.',
      'Use clear and consistent titles to simplify knowledge maintenance.',
      'Avoid content with sensitive or unauthorized information.',
    ],
  },
  {
    step: 'Step 2',
    title: 'Train and validate',
    description: 'Upload knowledge and validate behavior before considering it published.',
    items: [
      'Combine sources: file, URL, and text to cover common and edge cases.',
      'Run real chat questions to validate clarity and precision.',
      'If there are ambiguities, adjust content and retest in the same cycle.',
    ],
  },
  {
    step: 'Step 3',
    title: 'Operate with continuous improvement',
    description: 'The admin panel works best when used as a routine.',
    items: [
      'Review the unresolved queue at least once each business day.',
      'Monitor metrics weekly to detect regressions early.',
      'Document major changes so the team keeps shared context.',
    ],
  },
]

export function DocsPage() {
  return (
    <div className="space-y-6 text-slate-100">
      <header className="overflow-hidden rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-indigo-950/40 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
          Administration guide
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Assistant operations in 3 steps</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          This guide helps you train, validate, and operate the assistant safely, with a clear
          routine to maintain response quality and consistency.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        {quickActions.map((action) => (
          <NavLink
            key={action.title}
            to={action.to}
            className="group rounded-2xl border border-slate-700/70 bg-slate-900/65 p-4 transition hover:-translate-y-0.5 hover:border-indigo-500/60 hover:bg-slate-900/90"
          >
            <p className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300">
              {action.title}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{action.description}</p>
            <p className="mt-3 text-xs font-medium text-indigo-300">Go to module</p>
          </NavLink>
        ))}
      </section>

      <section className="space-y-4">
        {docsSections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
                {section.step}
              </span>
              <h2 className="text-lg font-semibold text-slate-100">{section.title}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{section.description}</p>
            <ul className="mt-4 space-y-2.5">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/45 px-3 py-2 text-sm text-slate-300"
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  )
}
