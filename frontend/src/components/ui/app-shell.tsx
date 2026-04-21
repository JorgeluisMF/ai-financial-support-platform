import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../../features/auth/auth-context'

export function AppShell() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  async function onLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/chat" className="text-lg font-semibold">
            AI Support SaaS
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="rounded bg-slate-800 px-2 py-1 text-slate-200">
              {user?.username} ({user?.role})
            </span>
            <button className="text-rose-300 hover:text-rose-200" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 px-6 pb-3 text-sm">
          <NavLink to="/chat" className="rounded px-3 py-1 hover:bg-slate-800">
            Chat
          </NavLink>
          <NavLink to="/admin/dashboard" className="rounded px-3 py-1 hover:bg-slate-800">
            Dashboard
          </NavLink>
          <NavLink to="/admin/unresolved" className="rounded px-3 py-1 hover:bg-slate-800">
            Unresolved
          </NavLink>
          <NavLink to="/admin/conversations" className="rounded px-3 py-1 hover:bg-slate-800">
            Conversations
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
