import { create } from 'zustand'
import type { ChatRequest, ChatResponse, ChatSource } from '../lib/api/types'
import { sendMessage } from '../services/api'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
  sources?: ChatSource[]
  latencyMs?: number
  warnings?: string[]
}

export type ChatConversation = {
  id: string
  sessionId: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

type ChatState = {
  userId: string
  conversations: ChatConversation[]
  activeConversationId: string | null
  isSending: boolean
  error: string | null
}

type ChatActions = {
  setUserId: (userId: string) => void
  send: (text: string) => Promise<void>
  newConversation: () => string
  deleteConversation: (id: string) => void
  selectConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  resetAll: () => void
  clearLocalResponseCache: (sourceRef?: string) => void
}

const createSessionId = () =>
  `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const createConversation = (title = 'New conversation'): ChatConversation => {
  const now = new Date().toISOString()
  const id = `conv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return {
    id,
    sessionId: createSessionId(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  }
}

type PersistedChatState = {
  conversations: ChatConversation[]
  activeConversationId: string | null
}

const CHAT_STORAGE_PREFIX = 'chat-store:user:'

const storageKeyForUser = (userId: string) => `${CHAT_STORAGE_PREFIX}${userId || 'frontend-user'}`

const getDefaultChatState = (): PersistedChatState => ({
  conversations: [createConversation('First conversation')],
  activeConversationId: null,
})

const loadPersistedChatState = (userId: string): PersistedChatState => {
  if (typeof window === 'undefined') return getDefaultChatState()
  try {
    const raw = window.localStorage.getItem(storageKeyForUser(userId))
    if (!raw) return getDefaultChatState()
    const parsed = JSON.parse(raw) as Partial<PersistedChatState>
    const conversations = Array.isArray(parsed.conversations) ? parsed.conversations : []
    const nextConversations = conversations.length ? conversations : [createConversation('First conversation')]
    const activeConversationId = parsed.activeConversationId ?? null
    return { conversations: nextConversations, activeConversationId }
  } catch {
    return getDefaultChatState()
  }
}

const persistChatState = (
  userId: string,
  state: Pick<ChatState, 'conversations' | 'activeConversationId'>,
) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    storageKeyForUser(userId),
    JSON.stringify({
      conversations: state.conversations,
      activeConversationId: state.activeConversationId,
    } satisfies PersistedChatState),
  )
}

const buildPayload = (conversation: ChatConversation, userId: string, text: string): ChatRequest => ({
  session_id: conversation.sessionId,
  user_id: userId || 'frontend-user',
  message: text,
  channel: 'web',
  locale: 'en-US',
  metadata: {},
})

type ChatStore = ChatState & ChatActions

const initialFrontendState = loadPersistedChatState('frontend-user')

export const useChatStore = create<ChatStore>()((set, get) => ({
  userId: 'frontend-user',
  conversations: initialFrontendState.conversations,
  activeConversationId: initialFrontendState.activeConversationId,
  isSending: false,
  error: null,

  setUserId: (nextUserId: string) => {
    const normalized = (nextUserId || 'frontend-user').trim() || 'frontend-user'
    const current = get()
    if (current.userId === normalized) return
    const persisted = loadPersistedChatState(normalized)
    set({
      userId: normalized,
      conversations: persisted.conversations,
      activeConversationId: persisted.activeConversationId,
      isSending: false,
      error: null,
    })
  },

  newConversation: () => {
    const conv = createConversation()
    set((current) => {
      const nextState = {
        conversations: [conv, ...current.conversations],
        activeConversationId: conv.id,
        error: null,
      }
      persistChatState(current.userId, nextState)
      return nextState
    })
    return conv.id
  },

  deleteConversation: (id: string) =>
    set((current) => {
      const remaining = current.conversations.filter((conv) => conv.id !== id)
      const nextConversations = remaining.length > 0 ? remaining : [createConversation()]
      const activeStillExists = nextConversations.some(
        (conv) => conv.id === current.activeConversationId,
      )
      const nextActiveId = activeStillExists
        ? current.activeConversationId
        : nextConversations[0]?.id ?? null
      const nextState = {
        conversations: nextConversations,
        activeConversationId: nextActiveId,
        error: null,
      }
      persistChatState(current.userId, nextState)
      return nextState
    }),

  selectConversation: (id: string) =>
    set((current) => {
      const nextState = {
        activeConversationId: id,
        error: null,
      }
      persistChatState(current.userId, {
        conversations: current.conversations,
        activeConversationId: nextState.activeConversationId,
      })
      return nextState
    }),

  renameConversation: (id: string, title: string) =>
    set((state) => {
      const nextConversations = state.conversations.map((conv) =>
        conv.id === id ? { ...conv, title: title.trim() || conv.title } : conv,
      )
      persistChatState(state.userId, {
        conversations: nextConversations,
        activeConversationId: state.activeConversationId,
      })
      return { conversations: nextConversations }
    }),

  resetAll: () =>
    set((current) => {
      const nextState = {
        conversations: [createConversation('New conversation')],
        activeConversationId: null,
        isSending: false,
        error: null,
      }
      persistChatState(current.userId, {
        conversations: nextState.conversations,
        activeConversationId: nextState.activeConversationId,
      })
      return nextState
    }),

  clearLocalResponseCache: (sourceRef?: string) =>
    set((current) => {
      const normalizedRef = sourceRef?.trim()
      const nextConversations = current.conversations.map((conv) => ({
        ...conv,
        messages: conv.messages.filter((message) => {
          if (message.role !== 'assistant') return true
          const matchedSource =
            normalizedRef &&
            (message.sources?.some((source) => source.source_ref === normalizedRef) ?? false)
          const isCacheHit = message.warnings?.includes('cache_hit') ?? false
          if (matchedSource) return false
          if (!normalizedRef && isCacheHit) return false
          return true
        }),
      }))
      persistChatState(current.userId, {
        conversations: nextConversations,
        activeConversationId: current.activeConversationId,
      })
      return { conversations: nextConversations }
    }),

  send: async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const state = get()
    if (state.isSending) return

    const activeConversation =
      state.conversations.find((c) => c.id === state.activeConversationId) ??
      state.conversations[0]

    if (!activeConversation) {
      return
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      text: trimmed,
      createdAt: new Date().toISOString(),
    }

    set((current) => {
      const nextConversations = current.conversations.map((conv) =>
        conv.id === activeConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              title: conv.messages.length === 0 && trimmed.length > 0 ? trimmed.slice(0, 50) : conv.title,
              updatedAt: new Date().toISOString(),
            }
          : conv,
      )
      persistChatState(current.userId, {
        conversations: nextConversations,
        activeConversationId: current.activeConversationId,
      })
      return {
        conversations: nextConversations,
        isSending: true,
        error: null,
      }
    })

    try {
      const payload = buildPayload(activeConversation, state.userId, trimmed)
      const response: ChatResponse = await sendMessage(payload)

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        text: response.answer,
        createdAt: response.timestamp,
        sources: response.sources,
        latencyMs: response.latency_ms,
        warnings: response.warnings,
      }

      set((current) => {
        const nextConversations = current.conversations.map((conv) =>
          conv.id === activeConversation.id
            ? {
                ...conv,
                messages: [...conv.messages, assistantMessage],
                updatedAt: new Date().toISOString(),
              }
            : conv,
        )
        persistChatState(current.userId, {
          conversations: nextConversations,
          activeConversationId: current.activeConversationId,
        })
        return {
          conversations: nextConversations,
          isSending: false,
        }
      })
    } catch {
      set({
        isSending: false,
        error: 'Unable to send message. Please try again.',
      })
    }
  },
}))

