import type { KnowledgeItem } from '../../lib/api/types'

type KnowledgeSourcesSectionProps = {
  items: KnowledgeItem[]
  isLoadingItems: boolean
  onReload: () => void
  onDelete: (item: KnowledgeItem) => void
}

export function KnowledgeSourcesSection({
  items,
  isLoadingItems,
  onReload,
  onDelete,
}: KnowledgeSourcesSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-700/70 bg-slate-900/65 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.3)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Loaded content</h3>
          <p className="mt-1 text-xs text-slate-400">
            Manage active sources used by the assistant to answer.
          </p>
        </div>
        <button
          type="button"
          onClick={onReload}
          className="rounded-lg border border-slate-600/80 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800/70"
        >
          Reload
        </button>
      </div>
      {isLoadingItems ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-800/60" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 text-sm text-slate-400">
          No sources uploaded yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5"
            >
              <div>
                <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Type: {item.source_type} · Chunks: {item.chunks} ·{' '}
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="rounded-lg border border-rose-500/60 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10"
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
