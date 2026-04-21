/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AxiosHeaders, isAxiosError } from 'axios'

import { apiClient, makeRequestId } from '../../lib/api/client'
import type { CurrentUser, LoginResponse, RegisterRequest, UserRole } from '../../lib/api/types'

type AuthContextValue = {
  user: CurrentUser | null
  accessToken: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<CurrentUser>
  register: (payload: RegisterRequest) => Promise<CurrentUser>
  completeOAuthLogin: (accessToken: string, refreshToken: string) => Promise<CurrentUser>
  logout: () => Promise<void>
  refresh: () => Promise<boolean>
}

const REFRESH_TOKEN_KEY = 'saas_refresh_token'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      setAccessToken(null)
      setUser(null)
      return false
    }
    try {
      const { data } = await apiClient.post<LoginResponse>(
        '/auth/refresh',
        { refresh_token: refreshToken },
        { headers: { 'x-request-id': makeRequestId() } },
      )
      setAccessToken(data.access_token)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)

      const me = await apiClient.get<CurrentUser>('/auth/me', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          'x-request-id': makeRequestId(),
        },
      })
      setUser(me.data)
      return true
    } catch {
      setAccessToken(null)
      setUser(null)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      return false
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await apiClient.post<LoginResponse>(
      '/auth/login',
      { username, password },
      { headers: { 'x-request-id': makeRequestId() } },
    )
    setAccessToken(data.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)

    const me = await apiClient.get<CurrentUser>('/auth/me', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        'x-request-id': makeRequestId(),
      },
    })
    setUser(me.data)
    return me.data
  }, [])

  const register = useCallback(async (payload: RegisterRequest) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', payload, {
      headers: { 'x-request-id': makeRequestId() },
    })
    setAccessToken(data.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)

    const me = await apiClient.get<CurrentUser>('/auth/me', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        'x-request-id': makeRequestId(),
      },
    })
    setUser(me.data)
    return me.data
  }, [])

  const completeOAuthLogin = useCallback(async (token: string, refreshToken: string) => {
    setAccessToken(token)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    const me = await apiClient.get<CurrentUser>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-request-id': makeRequestId(),
      },
    })
    setUser(me.data)
    return me.data
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (refreshToken) {
      try {
        await apiClient.post(
          '/auth/logout',
          { refresh_token: refreshToken },
          { headers: { 'x-request-id': makeRequestId() } },
        )
      } catch {
        // Ignore backend logout failures for UX continuity.
      }
    }
    setAccessToken(null)
    setUser(null)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }, [])

  useEffect(() => {
    const reqInterceptor = apiClient.interceptors.request.use((config) => {
      const headers = AxiosHeaders.from(config.headers)
      config.headers = headers
      headers.set('x-request-id', headers.get('x-request-id') ?? makeRequestId())
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`)
      }
      return config
    })

    const resInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (!isAxiosError(error) || error.response?.status !== 401) {
          throw error
        }
        const original = error.config
        const requestUrl = original?.url ?? ''
        const isAuthRefreshRequest = requestUrl.includes('/auth/refresh')
        const isAuthLoginRequest = requestUrl.includes('/auth/login')
        if (isAuthRefreshRequest || isAuthLoginRequest) {
          throw error
        }
        if (!original || (original as { _retried?: boolean })._retried) {
          throw error
        }
        ;(original as { _retried?: boolean })._retried = true
        const ok = await refresh()
        if (!ok) throw error
        return apiClient(original)
      },
    )

    return () => {
      apiClient.interceptors.request.eject(reqInterceptor)
      apiClient.interceptors.response.eject(resInterceptor)
    }
  }, [accessToken, refresh])

  useEffect(() => {
    const path = window.location.pathname
    const hash = window.location.hash
    const search = new URLSearchParams(window.location.search)
    const isOAuthReturn =
      path === '/auth/callback' &&
      (hash.includes('access_token=') || Boolean(search.get('error')))

    if (isOAuthReturn) {
      // Avoid calling /auth/refresh in parallel with an old session: it can overwrite the new hash refresh_token.
      setIsLoading(false)
      return
    }

    let active = true
    void refresh().finally(() => {
      if (active) setIsLoading(false)
    })
    return () => {
      active = false
    }
  }, [refresh])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      login,
      register,
      completeOAuthLogin,
      logout,
      refresh,
    }),
    [user, accessToken, isLoading, login, register, completeOAuthLogin, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function hasRole(role: UserRole | undefined, allowed: UserRole[]): boolean {
  if (!role) return false
  return allowed.includes(role)
}
