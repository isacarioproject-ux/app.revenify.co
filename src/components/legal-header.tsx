import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Globe } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useI18n } from '@/hooks/use-i18n'

export function LegalHeader() {
  const { t, locale, changeLocale } = useI18n()
  const location = useLocation()

  const handleLanguageToggle = () => {
    const nextLocale = locale === 'pt-BR' ? 'en' : locale === 'en' ? 'es' : 'pt-BR'
    changeLocale(nextLocale)
  }

  const isPrivacyPage = location.pathname === '/privacy-policy'
  const isTermsPage = location.pathname === '/terms-of-service'

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Back Button */}
          <div className="flex items-center gap-3 md:flex-1 md:justify-start">
            <Link
              to="/auth"
              className="flex items-center justify-center rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={t('auth.backToLogin')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center justify-center gap-6 text-sm font-medium md:flex-1">
            <Link
              to="/privacy-policy"
              className={
                isPrivacyPage
                  ? 'text-primary border-b-2 border-primary pb-1'
                  : 'text-muted-foreground hover:text-foreground transition-colors pb-1'
              }
            >
              {t('legal.nav.privacy')}
            </Link>
            <Link
              to="/terms-of-service"
              className={
                isTermsPage
                  ? 'text-primary border-b-2 border-primary pb-1'
                  : 'text-muted-foreground hover:text-foreground transition-colors pb-1'
              }
            >
              {t('legal.nav.terms')}
            </Link>
          </nav>

          {/* Language Toggle & Theme */}
          <div className="flex items-center gap-2 self-end md:self-auto md:flex-1 md:justify-end">
            <button
              type="button"
              onClick={handleLanguageToggle}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={t('common.select')}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="uppercase font-medium">
                {locale === 'pt-BR' ? 'PT' : locale === 'en' ? 'EN' : 'ES'}
              </span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
