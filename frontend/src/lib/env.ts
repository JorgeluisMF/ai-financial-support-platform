/**
 * Public env only (VITE_*). Never put secrets here — they are bundled into the client.
 */
const DEFAULT_API_BASE = 'http://127.0.0.1:8000'

function isSafeApiUrl(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:'
}

/**
 * Base URL for the backend API (no trailing slash).
 * Rejects dangerous protocols (e.g. javascript:) in production builds.
 */
export function getApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
  const fallback = DEFAULT_API_BASE
  if (!raw) return fallback

  try {
    const parsed = new URL(raw)
    if (!isSafeApiUrl(parsed)) {
      if (import.meta.env.DEV) {
        console.warn('[env] VITE_API_BASE_URL must use http or https; using default.')
      }
      return fallback
    }
    const base = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '')
    return base || parsed.origin
  } catch {
    if (import.meta.env.DEV) {
      console.warn('[env] Invalid VITE_API_BASE_URL; using default.')
    }
    return fallback
  }
}
