import type { ReactNode } from 'react'

export function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main>{children}</main>
    </div>
  )
}

