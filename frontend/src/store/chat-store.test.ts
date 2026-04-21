import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useChatStore } from './chat-store'
import { sendMessage } from '../services/api'

vi.mock('../services/api', () => ({
  sendMessage: vi.fn(),
}))

describe('chat-store', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useChatStore.getState().resetAll()
  })

  it('adds assistant message with unresolved warning from backend', async () => {
    vi.mocked(sendMessage).mockResolvedValue({
      conversation_id: 'c1',
      answer: 'No final answer',
      sources: [],
      model_info: 'test-model',
      latency_ms: 50,
      warnings: ['unresolved'],
      timestamp: new Date().toISOString(),
    })

    await useChatStore.getState().send('Need policy detail')
    const conversation = useChatStore.getState().conversations[0]
    const assistantMessage = conversation.messages.find((msg) => msg.role === 'assistant')

    expect(assistantMessage?.warnings).toContain('unresolved')
  })
})
