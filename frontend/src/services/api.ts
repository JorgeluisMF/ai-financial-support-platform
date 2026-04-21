import { apiClient, makeRequestId } from '../lib/api/client'
import type {
  AdminMetrics,
  ChatRequest,
  ChatResponse,
  ConversationList,
  KnowledgeListResponse,
  UnresolvedList,
} from '../lib/api/types'

// Chat
export async function sendMessage(payload: ChatRequest): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>('/chat', {
    ...payload,
    metadata: {
      ...payload.metadata,
      request_id: makeRequestId(),
      channel: payload.channel,
    },
  })
  return data
}

// Admin metrics
export async function getMetrics(): Promise<AdminMetrics> {
  const { data } = await apiClient.get<AdminMetrics>('/admin/metrics')
  return data
}

// Unresolved backlog
export async function getUnresolved(page = 1, pageSize = 10): Promise<UnresolvedList> {
  const { data } = await apiClient.get<UnresolvedList>(
    `/admin/unresolved?page=${page}&page_size=${pageSize}`,
  )
  return data
}

export async function getConversations(limit = 25): Promise<ConversationList> {
  const { data } = await apiClient.get<ConversationList>(`/admin/conversations?limit=${limit}`)
  return data
}

type ResolveQuestionInput = {
  unresolvedId: string
  content: string
}

export async function resolveQuestion(input: ResolveQuestionInput): Promise<void> {
  const { unresolvedId, content } = input
  await apiClient.post('/admin/resolve', {
    unresolved_id: unresolvedId,
    content,
  })
}

type AddTextKnowledgeInput = {
  title: string
  content: string
}

type AddUrlKnowledgeInput = {
  title: string
  url: string
}

export async function addTextKnowledge(input: AddTextKnowledgeInput): Promise<void> {
  await apiClient.post('/knowledge/add-text', input)
}

export async function addUrlKnowledge(input: AddUrlKnowledgeInput): Promise<void> {
  await apiClient.post('/knowledge/add-url', input)
}

export async function uploadKnowledgeFile(file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await apiClient.post('/knowledge/upload-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function getKnowledge(): Promise<KnowledgeListResponse> {
  const { data } = await apiClient.get<KnowledgeListResponse>('/knowledge')
  return data
}

export async function deleteKnowledge(id: string): Promise<void> {
  await apiClient.delete(`/knowledge/${id}`)
}

// Legacy helper kept for compatibility with existing admin screen.
export async function ingestKnowledge(input: {
  document_id: string
  source_ref: string
  content: string
  tags?: Record<string, unknown>
}): Promise<void> {
  await addTextKnowledge({
    title: input.document_id,
    content: input.content,
  })
}

