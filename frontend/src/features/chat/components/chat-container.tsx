import type { ChatConversation, ChatMessage } from '../../../store/chat-store'
import type { UserRole } from '../../../lib/api/types'

import { ChatAuthDialog } from './chat-auth-dialog'
import { ChatHeader } from './chat-header'
import { ChatInput } from './chat-input'
import { ChatMessageList } from './chat-message-list'
import { ChatSidebar } from './chat-sidebar'

export type ChatContainerProps = {
  conversations: ChatConversation[]
  activeConversationId: string | null
  messages: ChatMessage[]
  isSending: boolean
  error: string | null
  input: string
  onInputChange: (value: string) => void
  canSend: boolean
  onSend: () => Promise<void> | void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onSelectConversation: (id: string) => void
  currentUser: string | null
  currentUserRole?: UserRole
  onAuthAction: () => Promise<void> | void
  isAuthActionBusy: boolean
  onSettings: () => void
  isAuthDialogOpen: boolean
  onCloseAuthDialog: () => void
  authMode: 'login' | 'register'
  onAuthModeChange: (mode: 'login' | 'register') => void
  authError: string | null
  onLoginSubmit: (email: string, password: string) => Promise<void>
  onRegisterSubmit: (payload: {
    username: string
    email: string
    firstName: string
    lastName: string
    phone: string
    address: string
    identification: string
    password: string
    confirmPassword: string
    acceptedTerms: boolean
  }) => Promise<void>
}

export function ChatContainer(props: ChatContainerProps) {
  const {
    conversations,
    activeConversationId,
    messages,
    isSending,
    error,
    input,
    onInputChange,
    canSend,
    onSend,
    onNewConversation,
    onDeleteConversation,
    onSelectConversation,
    currentUser,
    currentUserRole,
    onAuthAction,
    isAuthActionBusy,
    onSettings,
    isAuthDialogOpen,
    onCloseAuthDialog,
    authMode,
    onAuthModeChange,
    authError,
    onLoginSubmit,
    onRegisterSubmit,
  } = props

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewConversation={onNewConversation}
        onDeleteConversation={onDeleteConversation}
        onSelectConversation={onSelectConversation}
      />

      <main className="flex flex-1 px-2 py-4 sm:px-4 sm:py-6">
        <div className="flex h-full w-full flex-col gap-4">
          <ChatHeader
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            onAuthAction={onAuthAction}
            isAuthActionBusy={isAuthActionBusy}
            onSettings={onSettings}
          />

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <ChatMessageList messages={messages} isSending={isSending} />
            <ChatInput
              value={input}
              onChange={onInputChange}
              onSend={onSend}
              isSending={isSending}
              disabled={!canSend}
            />
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}
        </div>
      </main>

      <ChatAuthDialog
        open={isAuthDialogOpen}
        mode={authMode}
        error={authError}
        onClose={onCloseAuthDialog}
        onModeChange={onAuthModeChange}
        onLoginSubmit={onLoginSubmit}
        onRegisterSubmit={onRegisterSubmit}
      />
    </div>
  )
}
