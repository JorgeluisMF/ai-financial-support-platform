type KnowledgeActionCardProps = {
  title: string
  description: string
  buttonLabel: string
  onOpen: () => void
}

export function KnowledgeActionCard({
  title,
  description,
  buttonLabel,
  onOpen,
}: KnowledgeActionCardProps) {
  return (
    <article className="rounded-2xl border border-slate-700/70 bg-slate-900/65 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.3)]">
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/35 transition hover:bg-indigo-400"
      >
        {buttonLabel}
      </button>
    </article>
  )
}
