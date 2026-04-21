import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAdminStore } from './admin-store'
import { getMetrics, getUnresolved, resolveQuestion } from '../services/api'

vi.mock('../services/api', () => ({
  getMetrics: vi.fn(),
  getUnresolved: vi.fn(),
  resolveQuestion: vi.fn(),
}))

describe('admin-store', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useAdminStore.setState({
      metrics: null,
      metricsLoading: false,
      metricsError: null,
      unresolved: [],
      unresolvedLoading: false,
      unresolvedError: null,
      unresolvedTotal: 0,
      unresolvedPage: 1,
      unresolvedPageSize: 10,
      unresolvedHasMore: false,
    })
  })

  it('loads metrics into the store', async () => {
    vi.mocked(getMetrics).mockResolvedValue({
      total_questions: 12,
      unresolved_open: 3,
      avg_latency_ms: 120,
      error_rate: 0.1,
      unresolved_rate: 0.2,
    })

    await useAdminStore.getState().fetchMetrics()
    const state = useAdminStore.getState()

    expect(state.metrics?.total_questions).toBe(12)
    expect(state.metricsError).toBeNull()
  })

  it('loads unresolved backlog page data', async () => {
    vi.mocked(getUnresolved).mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      page_size: 20,
      has_more: false,
    })

    await useAdminStore.getState().fetchUnresolved({ page: 2, pageSize: 20 })
    const state = useAdminStore.getState()

    expect(state.unresolvedPage).toBe(2)
    expect(state.unresolvedPageSize).toBe(20)
  })

  it('resolves one unresolved question and refreshes data', async () => {
    vi.mocked(resolveQuestion).mockResolvedValue(undefined)
    vi.mocked(getUnresolved).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      has_more: false,
    })
    vi.mocked(getMetrics).mockResolvedValue({
      total_questions: 15,
      unresolved_open: 2,
      avg_latency_ms: 95,
      error_rate: 0.05,
      unresolved_rate: 0.13,
    })

    await useAdminStore.getState().resolveUnresolved({ id: 'abc', content: 'resolved content' })

    expect(resolveQuestion).toHaveBeenCalledWith({ unresolvedId: 'abc', content: 'resolved content' })
    expect(getUnresolved).toHaveBeenCalled()
    expect(getMetrics).toHaveBeenCalled()
  })
})
