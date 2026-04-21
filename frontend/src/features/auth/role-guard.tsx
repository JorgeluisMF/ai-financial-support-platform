import { Navigate, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'

import { hasRole, useAuth } from './auth-context'
import type { UserRole } from '../../lib/api/types'

export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[]
  children: ReactElement
}) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="p-8 text-slate-300">Loading session...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!hasRole(user.role, allowedRoles)) {
    return <Navigate to="/app" replace />
  }

  return children
}
