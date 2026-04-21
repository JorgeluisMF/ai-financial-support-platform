import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import type { ChatMessage } from '../../../store/chat-store'

import { ChatMessageBubble } from './chat-message-bubble'

type ChatMessageListProps = {
  messages: ChatMessage[]
  isSending: boolean
}

export function ChatMessageList({ messages, isSending }: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [messages.length, isSending])

  const hasMessages = messages.length > 0

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4">
      <div className="flex w-full flex-col gap-3 pb-24 pt-6 sm:pb-28">
        {!hasMessages && (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-center text-sm text-slate-400">
            <p className="text-base font-medium text-slate-200">
              Ask me anything about your bank.
            </p>
            <p className="max-w-md text-xs sm:text-sm">
              Examples: {'“How have my expenses evolved this month?”'} or{' '}
              {'“What was my largest spending category last quarter?”'}
            </p>
          </div>
        )}

        {hasMessages &&
          messages.map((message) => <ChatMessageBubble key={message.id} message={message} />)}

        <AnimatePresence>
          {isSending && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="w-full"
            >
              <div className="flex w-full gap-3">
                <div className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[0.7rem] font-semibold text-slate-200 ring-1 ring-slate-800/70">
                  AF
                </div>
                <div className="min-w-0 flex-1 rounded-2xl bg-slate-900/40 px-4 py-3 text-xs text-slate-300 ring-1 ring-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    The assistant is thinking...
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
