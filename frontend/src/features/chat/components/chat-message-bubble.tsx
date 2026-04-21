import { motion } from 'framer-motion'

import type { ChatMessage } from '../../../store/chat-store'

type ChatMessageBubbleProps = {
  message: ChatMessage
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user'
  const unresolvedWarning = message.warnings?.includes('unresolved')
  const hasSources = (message.sources?.length ?? 0) > 0
  const topScore = message.sources?.[0]?.score

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex w-full gap-3">
        <div
          className={`mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-semibold ring-1 ${
            isUser
              ? 'bg-indigo-600 text-slate-50 ring-indigo-500/40'
              : 'bg-slate-900 text-slate-200 ring-slate-800/70'
          }`}
        >
          {isUser ? 'You' : 'AF'}
        </div>

        <div
          className={`min-w-0 flex-1 rounded-2xl px-4 py-3 shadow-sm ring-1 ${
            isUser
              ? 'bg-indigo-600/15 text-slate-100 ring-indigo-500/25'
              : 'bg-slate-900/40 text-slate-100 ring-slate-800/60'
          }`}
        >
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] text-slate-300/80">
            <span className={`font-medium ${isUser ? 'text-slate-100' : 'text-slate-200'}`}>
              {isUser ? 'You' : 'Assistant'}
            </span>
            <span>· {new Date(message.createdAt).toLocaleTimeString()}</span>
            {!isUser && message.latencyMs != null && <span>· {message.latencyMs}ms</span>}
            {!isUser && hasSources && (
              <span className="badge-muted border border-slate-700/70">
                {message.sources!.length} sources
              </span>
            )}
            {!isUser && topScore != null && (
              <span>· confidence {(topScore * 100).toFixed(0)}%</span>
            )}
          </div>

          <p className="whitespace-pre-line leading-relaxed">{message.text}</p>

          {!isUser && hasSources && (
            <details className="mt-3 rounded-xl bg-slate-950/60 p-2 text-[0.7rem] text-slate-300">
              <summary className="cursor-pointer text-slate-400">View sources used</summary>
              <ul className="mt-2 space-y-1">
                {message.sources!.map((source) => (
                  <li key={source.chunk_id}>
                    <span className="font-medium text-slate-200">{source.source_ref}</span>{' '}
                    <span className="text-slate-400">
                      · score {(source.score * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {!isUser && unresolvedWarning && (
            <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/40 p-2 text-[0.7rem] text-amber-200">
              This answer may not be final. It has been flagged for human review.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
