import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { SubscriptionProvider } from '@/contexts/subscription-context'
import { ProjectsProvider } from '@/contexts/projects-context'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/protected-route'

// Import direto do onboarding (SEM lazy) para não mostrar preload
import OnboardingPage from '@/pages/onboarding-v2'

// Lazy load pages for code splitting
const AuthPage = lazy(() => import('@/pages/auth'))
const AuthCallbackPage = lazy(() => import('@/pages/auth/callback'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const ProfilePage = lazy(() => import('@/pages/settings/profile'))
const NotificationsPage = lazy(() => import('@/pages/settings/notifications'))
const PreferencesPage = lazy(() => import('@/pages/settings/preferences'))
const BillingPage = lazy(() => import('@/pages/settings/billing'))
const IntegrationsPage = lazy(() => import('@/pages/settings/integrations'))
const CustomDomainPage = lazy(() => import('@/pages/settings/custom-domain'))
const SSOPage = lazy(() => import('@/pages/settings/sso'))
const ProjectsPage = lazy(() => import('@/pages/projects'))
const SourcesPage = lazy(() => import('@/pages/sources'))
const AnalyticsPage = lazy(() => import('@/pages/analytics'))
const ProjectDetailsPage = lazy(() => import('@/pages/project-details'))
const LeadsPage = lazy(() => import('@/pages/leads'))
const CustomerJourneyPage = lazy(() => import('@/pages/customer-journey-v2'))
const TemplatesPage = lazy(() => import('@/pages/templates'))
const ShortLinksPage = lazy(() => import('@/pages/short-links'))
const PricingPage = lazy(() => import('@/pages/pricing'))
const PrivacyPolicyPage = lazy(() => import('@/pages/privacy-policy'))
const TermsOfServicePage = lazy(() => import('@/pages/terms-of-service'))
const BlogCreatePage = lazy(() => import('@/pages/blog-create'))

// Loader minimalista para lazy loading de páginas
const PageLoader = () => null

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
      <Toaster richColors position="top-right" expand={false} />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <ProjectsProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Auth */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                
                {/* Onboarding */}
                <Route path="/onboarding" element={<OnboardingPage />} />
                
                {/* Legal Pages */}
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                
                {/* Protected Routes - Dashboard */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
                <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetailsPage /></ProtectedRoute>} />
                <Route path="/sources" element={<ProtectedRoute><SourcesPage /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
                <Route path="/journey" element={<ProtectedRoute><CustomerJourneyPage /></ProtectedRoute>} />
                <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
                <Route path="/short-links" element={<ProtectedRoute><ShortLinksPage /></ProtectedRoute>} />
                <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
                
                {/* Settings Routes */}
                <Route path="/settings/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/settings/preferences" element={<ProtectedRoute><PreferencesPage /></ProtectedRoute>} />
                <Route path="/settings/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                <Route path="/settings/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
                <Route path="/settings/custom-domain" element={<ProtectedRoute><CustomDomainPage /></ProtectedRoute>} />
                <Route path="/custom-domain" element={<ProtectedRoute><CustomDomainPage /></ProtectedRoute>} />
                <Route path="/settings/sso" element={<ProtectedRoute><SSOPage /></ProtectedRoute>} />
                <Route path="/sso" element={<ProtectedRoute><SSOPage /></ProtectedRoute>} />

                {/* Blog Routes */}
                <Route path="/blog/create" element={<ProtectedRoute><BlogCreatePage /></ProtectedRoute>} />

                {/* Default redirect */}
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              </Routes>
            </Suspense>
            </ProjectsProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
