import { describe, expect, it, vi } from 'vitest'

import { addTextKnowledge, getConversations } from './api'
import { apiClient } from '../lib/api/client'

vi.mock('../lib/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
  makeRequestId: () => 'req-id',
}))

describe('services/api knowledge and admin contracts', () => {
  it('sends add-text payload to backend', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} })
    await addTextKnowledge({ title: 'Doc', content: 'A'.repeat(25) })
    expect(apiClient.post).toHaveBeenCalledWith('/knowledge/add-text', {
      title: 'Doc',
      content: 'A'.repeat(25),
    })
  })

  it('loads admin conversations list', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { items: [{ id: '1', session_id: 's1' }] },
    })
    const data = await getConversations(10)
    expect(apiClient.get).toHaveBeenCalledWith('/admin/conversations?limit=10')
    expect(data.items[0].session_id).toBe('s1')
  })
})
