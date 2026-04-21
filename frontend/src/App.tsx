import { Navigate, Route, Routes } from 'react-router-dom'

import { AppChatPage } from './app/chat/app-chat-page'
import { DocsPage } from './docs/docs-page'
import { LoginPage } from './features/auth/login-page'
import { OAuthCallbackPage } from './features/auth/oauth-callback-page'
import { RoleGuard } from './features/auth/role-guard'
import { DashboardPage } from './features/admin/dashboard-page'
import { ConversationsPage } from './features/admin/conversations-page'
import { UnresolvedPage } from './features/admin/unresolved-page'
import { KnowledgeTrainingPage } from './admin/knowledge-training-page'
import { UserLayout } from './components/layouts/UserLayout'
import { AdminLayout } from './components/layouts/AdminLayout'
import { MetricsPage } from './features/admin/metrics-page'
import { LandingPage } from './landing/landing-page'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      {/* User-facing chat app */}
      <Route
        path="/app"
        element={
          <UserLayout>
            <AppChatPage />
          </UserLayout>
        }
      />
      <Route path="/chat" element={<Navigate to="/app" replace />} />

      {/* Admin console */}
      <Route
        path="/admin/*"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="unresolved" element={<UnresolvedPage />} />
                <Route path="conversations" element={<ConversationsPage />} />
                <Route path="knowledge" element={<KnowledgeTrainingPage />} />
                <Route path="metrics" element={<MetricsPage />} />
                <Route path="docs" element={<DocsPage />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </RoleGuard>
        }
      />

      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  )
}

export default App
