import { useEffect, useRef, useState } from 'react'

import type { UserRole } from '../../../lib/api/types'

type ChatHeaderProps = {
  currentUser: string | null
  currentUserRole?: UserRole
  onAuthAction: () => Promise<void> | void
  isAuthActionBusy: boolean
  onSettings: () => void
}

export function ChatHeader({
  currentUser,
  currentUserRole,
  onAuthAction,
  isAuthActionBusy,
  onSettings,
}: ChatHeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const userLabel = currentUser ?? 'Invitado'
  const userInitial = userLabel.charAt(0).toUpperCase()

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false)
      }
    }
    if (!isProfileMenuOpen) return
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isProfileMenuOpen])

  return (
    <div className="border-b border-slate-800/80 px-1 pb-3 sm:px-2">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Financial assistant
          </p>
          <h1 className="text-lg font-semibold text-slate-100 sm:text-xl">
            Habla con tu analista virtual
          </h1>
        </div>
        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/95 px-3 text-xs text-slate-100 shadow-sm transition hover:border-indigo-500/40 hover:bg-slate-800"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[0.72rem] font-semibold text-slate-50">
              {userInitial}
            </span>
            <span className="max-w-[9rem] truncate text-sm font-medium">{userLabel}</span>
            <span className="text-slate-400">{isProfileMenuOpen ? '▴' : '▾'}</span>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-700/80 bg-slate-900/95 p-1.5 shadow-soft-xl backdrop-blur">
              <div className="mb-1 border-b border-slate-800/80 px-2 pb-2">
                <p className="text-[0.68rem] uppercase tracking-wide text-slate-500">Cuenta</p>
                <p className="truncate text-xs font-medium text-slate-200">{userLabel}</p>
                <p className="mt-1 text-[0.68rem] text-slate-400">
                  Manage your profile or sign out securely.
                </p>
              </div>
              {currentUserRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    onSettings()
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-slate-800"
                >
                  Settings
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false)
                  void onAuthAction()
                }}
                disabled={isAuthActionBusy}
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAuthActionBusy ? 'Processing...' : currentUser ? 'Sign out' : 'Login'}
              </button>
            </div>
          )}
        </div>
      </header>
    </div>
  )
}
