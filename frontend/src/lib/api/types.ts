export type UserRole = 'admin' | 'agent'

export type LoginResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export type RegisterRequest = {
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  address: string
  identification: string
  password: string
}

export type CurrentUser = {
  user_id: string
  username: string
  email: string
  role: UserRole
  provider: string
}

export type ChatRequest = {
  session_id: string
  user_id: string
  message: string
  channel: string
  locale: string
  metadata: Record<string, unknown>
}

export type ChatSource = {
  chunk_id: string
  source_ref: string
  score: number
}

export type ChatResponse = {
  conversation_id: string
  answer: string
  sources: ChatSource[]
  model_info: string
  latency_ms: number
  warnings: string[]
  timestamp: string
}

export type AdminMetrics = {
  total_questions: number
  unresolved_open: number
  avg_latency_ms: number
  error_rate: number
  unresolved_rate: number
}

export type UnresolvedItem = {
  id: string
  chat_log_id: string
  session_id: string
  question_text: string
  answer_text: string
  reason: string
  top_retrieval_score: number | null
  retrieved_chunk_count: number
  status: string
  created_at: string
}

export type UnresolvedList = {
  items: UnresolvedItem[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export type ConversationItem = {
  id: string
  session_id: string
  question_text: string
  answer_text: string
  latency_ms: number
  status: string
  created_at: string
}

export type ConversationList = {
  items: ConversationItem[]
}

export type KnowledgeSourceType = 'document' | 'url' | 'text'

export type KnowledgeItem = {
  id: string
  document_id: string
  title: string
  source_type: KnowledgeSourceType
  source_ref: string
  chunks: number
  created_at: string
}

export type KnowledgeListResponse = {
  items: KnowledgeItem[]
  total: number
}
