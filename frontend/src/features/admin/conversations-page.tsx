import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { getConversations } from '../../services/api'

export function ConversationsPage() {
  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const data = await getConversations()
      return data.items
    },
    retry: false,
  })

  if (query.isLoading) return <p className="text-slate-400">Loading conversations...</p>

  if (query.isError) {
    if (isAxiosError(query.error) && query.error.response?.status === 404) {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-300">
          Endpoint `/admin/conversations` is not available in backend yet. The UI is ready.
        </div>
      )
    }
    return <p className="text-rose-400">Could not load conversations.</p>
  }

  const items = query.data ?? []
  return (
    <div className="grid gap-4">
      <h2 className="text-2xl font-semibold">Conversations</h2>
      {items.length === 0 ? (
        <p className="text-slate-400">No data.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="font-medium">{item.question_text}</p>
              <p className="mt-2 text-slate-300">{item.answer_text}</p>
              <p className="mt-2 text-xs text-slate-400">
                session={item.session_id} status={item.status} latency={item.latency_ms}ms
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
