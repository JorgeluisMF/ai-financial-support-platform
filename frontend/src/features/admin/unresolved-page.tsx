import { useMemo, useState, type FormEvent } from 'react'
import { useAdminStore } from '../../store/admin-store'

export function UnresolvedPage() {
  const {
    unresolved,
    unresolvedLoading,
    unresolvedError,
    unresolvedTotal,
    unresolvedPage,
    unresolvedPageSize,
    unresolvedHasMore,
    fetchUnresolved,
    resolveUnresolved,
  } = useAdminStore()
  const [selectedId, setSelectedId] = useState<string>('')
  const [content, setContent] = useState('')

  if (!unresolved.length && !unresolvedLoading && !unresolvedError) {
    void fetchUnresolved()
  }

  const unresolvedItems = useMemo(() => unresolved, [unresolved])
  const leftColumnItems = useMemo(() => unresolvedItems.slice(0, 5), [unresolvedItems])
  const rightColumnItems = useMemo(() => unresolvedItems.slice(5, 10), [unresolvedItems])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selectedId || !content.trim()) return
    void resolveUnresolved({ id: selectedId, content })
    setContent('')
    setSelectedId('')
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Learning backlog
          </p>
          <h2 className="text-2xl font-semibold">Unresolved questions</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            void fetchUnresolved({ page: unresolvedPage })
          }}
          className="text-xs text-slate-400 underline-offset-2 hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="glass-card p-4">
        {unresolvedLoading ? (
          <p className="text-slate-400">Loading backlog...</p>
        ) : unresolvedError ? (
          <p className="text-sm text-rose-400">
            Could not load unresolved questions. Verify you are using an `admin` account.
          </p>
        ) : unresolvedItems.length === 0 ? (
          <p className="text-slate-400">No open questions.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Showing {(unresolvedPage - 1) * unresolvedPageSize + 1}-
              {Math.min(unresolvedPage * unresolvedPageSize, unresolvedTotal)} of {unresolvedTotal}
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-3">
                {leftColumnItems.map((item) => (
                  <label
                    key={item.id}
                    className="block cursor-pointer rounded-lg border border-slate-800/80 bg-slate-950/70 p-3 text-sm hover:border-indigo-500/70"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        className="mt-1"
                        checked={selectedId === item.id}
                        onChange={() => setSelectedId(item.id)}
                      />
                      <div>
                        <p className="font-medium text-slate-100">{item.question_text}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Reason: {item.reason} · score {item.top_retrieval_score ?? 'n/a'} ·{' '}
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="space-y-3">
                {rightColumnItems.map((item) => (
                  <label
                    key={item.id}
                    className="block cursor-pointer rounded-lg border border-slate-800/80 bg-slate-950/70 p-3 text-sm hover:border-indigo-500/70"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        className="mt-1"
                        checked={selectedId === item.id}
                        onChange={() => setSelectedId(item.id)}
                      />
                      <div>
                        <p className="font-medium text-slate-100">{item.question_text}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Reason: {item.reason} · score {item.top_retrieval_score ?? 'n/a'} ·{' '}
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-3">
              <button
                type="button"
                disabled={unresolvedPage <= 1}
                onClick={() => {
                  void fetchUnresolved({ page: unresolvedPage - 1 })
                }}
                className="rounded-md border border-slate-700 px-3 py-1 text-xs disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">Page {unresolvedPage}</span>
              <button
                type="button"
                disabled={!unresolvedHasMore}
                onClick={() => {
                  void fetchUnresolved({ page: unresolvedPage + 1 })
                }}
                className="rounded-md border border-slate-700 px-3 py-1 text-xs disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="glass-card p-4">
        <h3 className="mb-2 text-lg font-medium">Resolve selected question</h3>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
          placeholder="Write knowledge content to close the loop..."
        />
        <button
          type="submit"
          disabled={!selectedId || !content.trim()}
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          Resolve &amp; train
        </button>
      </form>
    </div>
  )
}
