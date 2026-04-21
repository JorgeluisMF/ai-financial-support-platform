import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/auth-context'
import { useChatStore } from '../../store/chat-store'

import { ChatContainer } from './components/chat-container'

export function ChatPage() {
  const navigate = useNavigate()
  const { user, login, register, logout } = useAuth()
  const {
    conversations,
    activeConversationId,
    isSending,
    error,
    setUserId,
    send,
    newConversation,
    deleteConversation,
    selectConversation,
  } = useChatStore()
  const [input, setInput] = useState('')
  const [isAuthActionBusy, setIsAuthActionBusy] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authError, setAuthError] = useState<string | null>(null)

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? conversations[0]
  const messages = activeConversation?.messages ?? []

  useEffect(() => {
    setUserId(user?.username ?? 'frontend-user')
  }, [setUserId, user?.username])

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending])

  async function handleSend() {
    const prompt = input.trim()
    if (!prompt) return
    if (!user) {
      setAuthMode('login')
      setIsAuthDialogOpen(true)
      setAuthError('You must sign in to send messages.')
      return
    }
    setInput('')
    await send(prompt)
  }

  async function handleAuthAction() {
    if (!user) {
      setAuthMode('login')
      setAuthError(null)
      setIsAuthDialogOpen(true)
      return
    }
    setIsAuthActionBusy(true)
    try {
      await logout()
      setInput('')
      setAuthError(null)
      setIsAuthDialogOpen(false)
      navigate('/app', { replace: true })
    } finally {
      setIsAuthActionBusy(false)
    }
  }

  function handleSettings() {
    if (!user) {
      setAuthMode('login')
      setAuthError(null)
      setIsAuthDialogOpen(true)
      return
    }
    navigate('/admin/dashboard')
  }

  async function handleModalLogin(email: string, password: string) {
    setAuthError(null)
    try {
      await login(email, password)
      setIsAuthDialogOpen(false)
    } catch {
      setAuthError('Invalid credentials or backend unavailable.')
      throw new Error('login-failed')
    }
  }

  async function handleModalRegister(payload: {
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
  }) {
    setAuthError(null)
    if (!payload.acceptedTerms) {
      setAuthError('You must accept the terms and conditions.')
      throw new Error('terms-not-accepted')
    }
    if (payload.password !== payload.confirmPassword) {
      setAuthError('Passwords do not match.')
      throw new Error('password-mismatch')
    }
    try {
      await register({
        username: payload.username.trim().toLowerCase(),
        email: payload.email.trim().toLowerCase(),
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        identification: payload.identification.trim(),
        password: payload.password,
      })
      setIsAuthDialogOpen(false)
    } catch {
      setAuthError('Registration could not be completed. Check your data and try again.')
      throw new Error('register-failed')
    }
  }

  function handleAuthModeChange(mode: 'login' | 'register') {
    setAuthMode(mode)
    setAuthError(null)
  }

  function handleProtectedNewConversation() {
    if (!user) {
      setAuthMode('login')
      setAuthError('You must sign in or create an account to start a conversation.')
      setIsAuthDialogOpen(true)
      return
    }
    const conversationId = newConversation()
    selectConversation(conversationId)
  }

  return (
    <ChatContainer
      conversations={conversations}
      activeConversationId={activeConversationId}
      messages={messages}
      isSending={isSending}
      error={error}
      input={input}
      onInputChange={setInput}
      canSend={canSend}
      onSend={handleSend}
      onNewConversation={handleProtectedNewConversation}
      onDeleteConversation={deleteConversation}
      onSelectConversation={selectConversation}
      currentUser={user?.username ?? null}
      currentUserRole={user?.role}
      onAuthAction={handleAuthAction}
      isAuthActionBusy={isAuthActionBusy}
      onSettings={handleSettings}
      isAuthDialogOpen={isAuthDialogOpen}
      onCloseAuthDialog={() => setIsAuthDialogOpen(false)}
      authMode={authMode}
      onAuthModeChange={handleAuthModeChange}
      authError={authError}
      onLoginSubmit={handleModalLogin}
      onRegisterSubmit={handleModalRegister}
    />
  )
}

export default ChatPage
