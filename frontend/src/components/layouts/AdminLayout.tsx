import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '../../features/auth/auth-context'

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  return (
    <div className="relative flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-950/95 px-4 py-4">
        <div className="mb-6 px-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Control</p>
          <p className="text-sm font-semibold text-slate-100">AI Ops Console</p>
          <p className="mt-1 text-xs text-slate-500">
            {user?.username} · {user?.role}
          </p>
        </div>
        <nav className="flex-1 space-y-1 text-sm">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex items-center rounded-xl px-3 py-2 ${
                isActive ? 'bg-slate-800 text-slate-50' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/unresolved"
            className={({ isActive }) =>
              `flex items-center rounded-xl px-3 py-2 ${
                isActive ? 'bg-slate-800 text-slate-50' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            Unresolved
          </NavLink>
          <NavLink
            to="/admin/conversations"
            className={({ isActive }) =>
              `flex items-center rounded-xl px-3 py-2 ${
                isActive ? 'bg-slate-800 text-slate-50' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            Conversations
          </NavLink>
          <NavLink
            to="/admin/knowledge"
            className={({ isActive }) =>
              `flex items-center rounded-xl px-3 py-2 ${
                isActive ? 'bg-slate-800 text-slate-50' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            Train assistant
          </NavLink>
          <NavLink
            to="/admin/metrics"
            className={({ isActive }) =>
              `flex items-center rounded-xl px-3 py-2 ${
                isActive ? 'bg-slate-800 text-slate-50' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            Metrics
          </NavLink>
          <NavLink
            to="/admin/docs"
            className={({ isActive }) =>
              `flex items-center rounded-xl px-3 py-2 ${
                isActive ? 'bg-slate-800 text-slate-50' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            Admin guide
          </NavLink>
        </nav>
        <p className="mt-4 px-2 text-[0.65rem] text-slate-500">
          All actions are logged for internal audit.
        </p>
      </aside>
      <main className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="mx-auto max-w-6xl space-y-6">{children}</div>
      </main>
      <NavLink
        to="/app"
        aria-label="Back to chat"
        className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-[0_10px_25px_rgba(79,70,229,0.45)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l-4 3v-3H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
          />
        </svg>
      </NavLink>
    </div>
  )
}

