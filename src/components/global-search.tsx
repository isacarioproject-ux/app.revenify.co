import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Search,
  Code2,
  Users,
  BarChart3,
  Link2,
  User,
  Bell,
  Palette,
  CreditCard,
  LayoutDashboard,
  Plug,
  FileText,
  Route,
  Sparkles,
  FolderKanban,
  Shield,
  Globe,
} from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface SearchResult {
  id: string
  titleKey: string
  descriptionKey: string
  type: 'page' | 'project' | 'document' | 'team' | 'card'
  path: string
  icon: any
  shortcut?: string
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate()
  const { t } = useI18n()

  const pages: SearchResult[] = useMemo(() => [
    // Páginas principais
    { id: '1', titleKey: 'search.dashboard', descriptionKey: 'search.dashboardDesc', type: 'page', path: '/dashboard', icon: LayoutDashboard, shortcut: 'D' },
    { id: '2', titleKey: 'search.projects', descriptionKey: 'search.projectsDesc', type: 'page', path: '/projects', icon: FolderKanban, shortcut: 'P' },
    { id: '3', titleKey: 'search.sources', descriptionKey: 'search.sourcesDesc', type: 'page', path: '/sources', icon: Code2, shortcut: 'S' },
    { id: '4', titleKey: 'search.analytics', descriptionKey: 'search.analyticsDesc', type: 'page', path: '/analytics', icon: BarChart3, shortcut: 'A' },
    { id: '5', titleKey: 'search.leads', descriptionKey: 'search.leadsDesc', type: 'page', path: '/leads', icon: Users, shortcut: 'L' },
    { id: '6', titleKey: 'search.shortLinks', descriptionKey: 'search.shortLinksDesc', type: 'page', path: '/short-links', icon: Link2, shortcut: 'K' },
    { id: '7', titleKey: 'search.templates', descriptionKey: 'search.templatesDesc', type: 'page', path: '/templates', icon: FileText, shortcut: 'T' },
    { id: '8', titleKey: 'search.customerJourney', descriptionKey: 'search.customerJourneyDesc', type: 'page', path: '/customer-journey', icon: Route, shortcut: 'J' },

    // Settings
    { id: '10', titleKey: 'search.profile', descriptionKey: 'search.profileDesc', type: 'page', path: '/settings/profile', icon: User },
    { id: '11', titleKey: 'search.notifications', descriptionKey: 'search.notificationsDesc', type: 'page', path: '/settings/notifications', icon: Bell },
    { id: '12', titleKey: 'search.preferences', descriptionKey: 'search.preferencesDesc', type: 'page', path: '/settings/preferences', icon: Palette },
    { id: '13', titleKey: 'search.billing', descriptionKey: 'search.billingDesc', type: 'page', path: '/settings/billing', icon: CreditCard },
    { id: '14', titleKey: 'search.integrations', descriptionKey: 'search.integrationsDesc', type: 'page', path: '/settings/integrations', icon: Plug },
    { id: '15', titleKey: 'search.pricing', descriptionKey: 'search.pricingDesc', type: 'page', path: '/pricing', icon: Sparkles },
    { id: '16', titleKey: 'search.sso', descriptionKey: 'search.ssoDesc', type: 'page', path: '/settings/sso', icon: Shield },
    { id: '17', titleKey: 'search.customDomain', descriptionKey: 'search.customDomainDesc', type: 'page', path: '/settings/custom-domain', icon: Globe },
  ], [])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!query) {
      setResults(pages.slice(0, 6))
      return
    }

    const filtered = pages.filter(
      (item) =>
        t(item.titleKey).toLowerCase().includes(query.toLowerCase()) ||
        t(item.descriptionKey).toLowerCase().includes(query.toLowerCase())
    )
    setResults(filtered)
    setSelectedIndex(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  const handleSelect = (result: SearchResult) => {
    navigate(result.path)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <VisuallyHidden>
          <DialogTitle>Buscar</DialogTitle>
          <DialogDescription>Buscar no aplicativo</DialogDescription>
        </VisuallyHidden>

        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">ESC</span>
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t('search.noResults')}
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence mode="popLayout">
                {results.map((result, index) => {
                  const Icon = result.icon
                  return (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.15, delay: index * 0.03 }}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                        index === selectedIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-70" />
                      <div className="flex-1">
                        <div className="font-medium">{t(result.titleKey)}</div>
                        <div className="text-xs text-muted-foreground">
                          {t(result.descriptionKey)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {result.shortcut && (
                          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-70 hidden sm:flex">
                            <span className="text-xs">{result.shortcut}</span>
                          </kbd>
                        )}
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                          <span className="text-xs">↵</span>
                        </kbd>
                      </div>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>{t('search.navigateHint')}</span>
            <span>{t('search.selectHint')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
