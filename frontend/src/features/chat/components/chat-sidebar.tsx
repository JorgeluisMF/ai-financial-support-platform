import type { ChatConversation } from '../../../store/chat-store'

type ChatSidebarProps = {
  conversations: ChatConversation[]
  activeConversationId: string | null
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onSelectConversation: (id: string) => void
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onNewConversation,
  onDeleteConversation,
  onSelectConversation,
}: ChatSidebarProps) {
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? conversations[0]

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-800/80 bg-slate-950/90 px-3 py-4 sm:flex">
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
            Historial
          </p>
          <p className="text-xs text-slate-300">Conversaciones locales</p>
        </div>
        <button
          type="button"
          onClick={onNewConversation}
          className="inline-flex h-7 items-center justify-center rounded-full bg-slate-800 px-3 text-xs font-medium text-slate-100 hover:bg-slate-700"
        >
          + Nuevo
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto pr-1 text-xs">
        {conversations.map((conv) => {
          const isActive = conv.id === activeConversation?.id
          const lastMessage = conv.messages[conv.messages.length - 1]
          return (
            <div
              key={conv.id}
              className={`group relative w-full rounded-xl pl-3 pr-9 py-2 text-left transition ${
                isActive
                  ? 'bg-slate-800 text-slate-50 shadow-sm'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className="w-full text-left"
              >
                <p className="line-clamp-1 text-[0.78rem] font-medium">{conv.title}</p>
                {lastMessage && (
                  <p className="mt-0.5 line-clamp-2 text-[0.7rem] text-slate-400">
                    {lastMessage.text}
                  </p>
                )}
              </button>
              <button
                type="button"
                aria-label="Delete conversation"
                onClick={() => onDeleteConversation(conv.id)}
                className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-slate-700 hover:text-rose-300 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
      <p className="mt-3 px-1 text-[0.65rem] text-slate-500">
        El historial se guarda solo en este navegador.
      </p>
    </aside>
  )
}
