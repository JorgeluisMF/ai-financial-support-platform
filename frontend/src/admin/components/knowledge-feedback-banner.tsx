type KnowledgeFeedbackBannerProps = {
  error: string | null
  success: string | null
}

export function KnowledgeFeedbackBanner({ error, success }: KnowledgeFeedbackBannerProps) {
  if (!error && !success) return null

  return (
    <section className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4">
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </p>
      )}
    </section>
  )
}
