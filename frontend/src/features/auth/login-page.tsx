import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

import { useAuth } from './auth-context'
import { GoogleLoginButton } from './google-login-button'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function postLoginPath(role: string) {
    return role === 'admin' ? '/admin/dashboard' : '/app'
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const user = await login(username, password)
      navigate(postLoginPath(user.role), { replace: true })
    } catch {
      setError('Invalid credentials or backend unavailable.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="grid w-full max-w-md gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        >
          <h1 className="mb-1 text-2xl font-semibold text-white">Access</h1>
          <p className="mb-6 text-sm text-slate-400">Choose how you want to sign in.</p>

          <div className="mb-4 space-y-3">
            <GoogleLoginButton
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              iconClassName="h-[20px] w-[20px] shrink-0"
            />
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-900 px-3 text-xs font-medium text-slate-500">or with your account</span>
            </div>
          </div>

          <p className="mb-3 mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Username and password</p>
          <form onSubmit={onSubmit}>
            <label className="mb-3 block text-sm text-slate-300">
              Username or email
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="mb-3 block text-sm text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              />
            </label>
            {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </motion.div>
      </div>

    </div>
  )
}
