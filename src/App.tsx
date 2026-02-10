import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { SubscriptionProvider } from '@/contexts/subscription-context'
import { ProjectsProvider } from '@/contexts/projects-context'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { DashboardShell } from '@/components/dashboard-shell'

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
                <ErrorBoundary>
                  <Routes>
                    {/* Auth (public) */}
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />

                    {/* Onboarding (public) */}
                    <Route path="/onboarding" element={<OnboardingPage />} />

                    {/* Legal Pages (public) */}
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms-of-service" element={<TermsOfServicePage />} />

                    {/* 
                      Dashboard Layout Route — persistent sidebar & header.
                      DashboardShell renders once, child pages swap via <Outlet>.
                    */}
                    <Route element={<DashboardShell />}>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/projects" element={<ProjectsPage />} />
                      <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
                      <Route path="/sources" element={<SourcesPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/leads" element={<LeadsPage />} />
                      <Route path="/journey" element={<CustomerJourneyPage />} />
                      <Route path="/templates" element={<TemplatesPage />} />
                      <Route path="/short-links" element={<ShortLinksPage />} />
                      <Route path="/pricing" element={<PricingPage />} />

                      {/* Settings */}
                      <Route path="/settings/profile" element={<ProfilePage />} />
                      <Route path="/settings/notifications" element={<NotificationsPage />} />
                      <Route path="/settings/preferences" element={<PreferencesPage />} />
                      <Route path="/settings/billing" element={<BillingPage />} />
                      <Route path="/settings/integrations" element={<IntegrationsPage />} />
                      <Route path="/settings/custom-domain" element={<CustomDomainPage />} />
                      <Route path="/custom-domain" element={<CustomDomainPage />} />
                      <Route path="/settings/sso" element={<SSOPage />} />
                      <Route path="/sso" element={<SSOPage />} />

                      {/* Blog */}
                      <Route path="/blog/create" element={<BlogCreatePage />} />

                      {/* Default */}
                      <Route path="/" element={<DashboardPage />} />
                    </Route>
                  </Routes>
                </ErrorBoundary>
              </Suspense>
            </ProjectsProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
