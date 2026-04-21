import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AdminMetrics, UnresolvedItem } from '../lib/api/types'
import { getMetrics, getUnresolved, resolveQuestion } from '../services/api'

type AdminState = {
  metrics: AdminMetrics | null
  metricsLoading: boolean
  metricsError: string | null

  unresolved: UnresolvedItem[]
  unresolvedLoading: boolean
  unresolvedError: string | null
  unresolvedTotal: number
  unresolvedPage: number
  unresolvedPageSize: number
  unresolvedHasMore: boolean
}

type AdminActions = {
  fetchMetrics: () => Promise<void>
  fetchUnresolved: (params?: { page?: number; pageSize?: number }) => Promise<void>
  resolveUnresolved: (params: { id: string; content: string }) => Promise<void>
}

type AdminStore = AdminState & AdminActions

export const useAdminStore = create<AdminStore>()(
  devtools((set, get) => ({
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

    fetchMetrics: async () => {
      set({ metricsLoading: true, metricsError: null })
      try {
        const data = await getMetrics()
        set({ metrics: data, metricsLoading: false })
      } catch {
        set({
          metricsLoading: false,
          metricsError: 'Could not load metrics.',
        })
      }
    },

    fetchUnresolved: async (params) => {
      const { unresolvedPage, unresolvedPageSize } = get()
      const page = params?.page ?? unresolvedPage
      const pageSize = params?.pageSize ?? unresolvedPageSize
      set({ unresolvedLoading: true, unresolvedError: null })
      try {
        const data = await getUnresolved(page, pageSize)
        set({
          unresolved: data.items,
          unresolvedTotal: data.total,
          unresolvedPage: data.page,
          unresolvedPageSize: data.page_size,
          unresolvedHasMore: data.has_more,
          unresolvedLoading: false,
        })
      } catch {
        set({
          unresolvedLoading: false,
          unresolvedError: 'Could not load unresolved questions backlog.',
        })
      }
    },

    resolveUnresolved: async ({ id, content }) => {
      await resolveQuestion({ unresolvedId: id, content })
      const { fetchUnresolved, fetchMetrics, unresolvedPage } = get()
      await Promise.all([fetchUnresolved({ page: unresolvedPage }), fetchMetrics()])
    },
  })),
)

