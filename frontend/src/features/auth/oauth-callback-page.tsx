import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from './auth-context'

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { completeOAuthLogin, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const oauthRunRef = useRef(false)
  const query = new URLSearchParams(window.location.search)
  const oauthErr = query.get('error')
  const reason = query.get('reason')
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const hashParams = new URLSearchParams(hash)
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')

  const callbackError = (() => {
    if (oauthErr) {
      const byCode: Record<string, string> = {
        oauth_state_expired:
          'The Google login link expired (too old or opened from a stale tab). Start again from “Continue with Google”.',
        oauth_state:
          'Google sign-in state could not be validated. Close old login tabs and try again from the beginning.',
        oauth_denied: 'Google sign-in was canceled.',
        oauth_code: 'Google did not return a valid code. Please try again.',
        oauth_failed: 'Could not complete Google sign-in.',
      }
      const preset = byCode[oauthErr]
      return reason
        ? `${preset ?? 'Sign-in was not completed.'} Detail: ${reason}`
        : preset ?? 'Could not complete sign-in. Please try again.'
    }
    if (!accessToken || !refreshToken) {
      return 'Incomplete or expired link.'
    }
    return null
  })()

  useEffect(() => {
    const hasOAuthTokens = Boolean(accessToken)

    if (isLoading && !hasOAuthTokens) return
    if (callbackError) {
      return
    }
    if (!accessToken || !refreshToken) {
      return
    }

    if (oauthRunRef.current) return
    oauthRunRef.current = true

    void (async () => {
      try {
        const loggedIn = await completeOAuthLogin(accessToken, refreshToken)
        window.history.replaceState({}, document.title, window.location.pathname)
        navigate(loggedIn.role === 'admin' ? '/admin/dashboard' : '/app', { replace: true })
      } catch {
        oauthRunRef.current = false
        setError('Could not validate session.')
      }
    })()
  }, [accessToken, callbackError, completeOAuthLogin, isLoading, navigate, refreshToken])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
      {error ?? callbackError ? (
        <>
          <p className="text-sm text-rose-400">{error ?? callbackError}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            Back to sign in
          </button>
        </>
      ) : (
        <p className="text-sm text-slate-400">Completing sign-in...</p>
      )}
    </div>
  )
}
