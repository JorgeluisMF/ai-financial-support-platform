export function KnowledgePageHeader() {
  return (
    <header className="rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-indigo-950/35 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
        Entrenar asistente
      </p>
      <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Update knowledge</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
        Upload documents, URLs, or manual text to improve assistant coverage. Every source is
        tracked and can be removed when it is no longer valid.
      </p>
    </header>
  )
}
