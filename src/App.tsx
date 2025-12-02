import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { SubscriptionProvider } from '@/contexts/subscription-context'
import { WorkspaceProvider } from '@/contexts/workspace-context'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { PendingInvitesNotification } from '@/components/workspace/pending-invites-notification'
import { InitialPreload } from '@/components/loading-skeleton'
import { useReminderServices } from '@/hooks/use-reminder-services'
import { ProtectedRoute } from '@/components/protected-route'
import { initIntegrations } from '@/integrations'
import { useEffect } from 'react'

// Import direto do onboarding (SEM lazy) para não mostrar preload
import OnboardingPage from '@/pages/onboarding'

// Lazy load pages for code splitting
const AuthPage = lazy(() => import('@/pages/auth'))
const AuthCallbackPage = lazy(() => import('@/pages/auth/callback'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const MyWorkPage = lazy(() => import('@/pages/my-work'))
const MyFinancePage = lazy(() => import('@/pages/my-finance'))
const MyBudgetPage = lazy(() => import('@/pages/my-budget'))
const ProjectManagerPage = lazy(() => import('@/pages/project-manager'))
// const MyCompanyPage = lazy(() => import('@/pages/my-company')) // REMOVIDO - Whiteboard
const ProfilePage = lazy(() => import('@/pages/settings/profile'))
const NotificationsPage = lazy(() => import('@/pages/settings/notifications'))
const PreferencesPage = lazy(() => import('@/pages/settings/preferences'))
const BillingPage = lazy(() => import('@/pages/settings/billing'))
const IntegrationsPage = lazy(() => import('@/pages/settings/integrations'))
const PrivacyPolicyPage = lazy(() => import('@/pages/privacy-policy'))
const TermsOfServicePage = lazy(() => import('@/pages/terms-of-service'))
const AcceptInvitePage = lazy(() => import('@/pages/accept-invite'))
const GoogleIntegrationCallback = lazy(() => import('@/pages/integrations/google-callback'))
const ImportGmailPage = lazy(() => import('@/pages/finance/import-gmail'))
const OnboardingAnalyticsPage = lazy(() => import('@/pages/admin/onboarding-analytics'))
const GoogleAnalyticsPage = lazy(() => import('@/pages/analytics/google'))
const TaskViewPage = lazy(() => import('@/pages/task-view'))
const TaskSharePage = lazy(() => import('@/pages/task-share'))

// Loader minimalista para lazy loading de páginas - usando null para transição suave
const PageLoader = () => null

function App() {
  // Inicializar serviços de lembrete
  useReminderServices();

  // Inicializar sistema de integrações modulares
  useEffect(() => {
    initIntegrations();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <Toaster richColors position="top-right" expand={false} />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <WorkspaceProvider>
              <Suspense fallback={<PageLoader />}>
            <Routes>
          {/* Auth */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          {/* Onboarding */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/admin/onboarding-analytics" element={<ProtectedRoute><OnboardingAnalyticsPage /></ProtectedRoute>} />
          
          {/* Legal Pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          
          {/* Workspace Invite - ANTES dos redirects */}
          <Route path="/invite/:token" element={<AcceptInvitePage />} />
          
          {/* Public Task Share - Não precisa de login */}
          <Route path="/share/:token" element={<TaskSharePage />} />
          
          {/* Google Integration Callback */}
          <Route path="/integrations/google/callback" element={<GoogleIntegrationCallback />} />
          
          {/* Gmail Import */}
          <Route path="/finance/import-gmail" element={<ProtectedRoute><ImportGmailPage /></ProtectedRoute>} />
          
          {/* Task Shared View */}
          <Route path="/tasks/:taskId" element={<ProtectedRoute><TaskViewPage /></ProtectedRoute>} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/meu-trabalho" element={<ProtectedRoute><MyWorkPage /></ProtectedRoute>} />
          <Route path="/minha-financa" element={<ProtectedRoute><MyFinancePage /></ProtectedRoute>} />
          <Route path="/meu-gerenciador" element={<ProtectedRoute><MyBudgetPage /></ProtectedRoute>} />
          <Route path="/meus-projetos" element={<ProtectedRoute><ProjectManagerPage /></ProtectedRoute>} />
          {/* <Route path="/minha-empresa" element={<ProtectedRoute><MyCompanyPage /></ProtectedRoute>} /> */}
          
          {/* Settings Routes */}
          <Route path="/settings/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/settings/preferences" element={<ProtectedRoute><PreferencesPage /></ProtectedRoute>} />
          <Route path="/settings/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
          <Route path="/settings/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
          
          {/* Analytics Routes */}
          <Route path="/analytics/google" element={<ProtectedRoute><GoogleAnalyticsPage /></ProtectedRoute>} />
          
          {/* Redirects - AuthContext vai redirecionar para onboarding ou dashboard */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            </Routes>
            </Suspense>
            
            {/* Notificação de convites pendentes */}
            <PendingInvitesNotification />
            </WorkspaceProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
