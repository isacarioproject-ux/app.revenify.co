import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Home, 
  FolderKanban, 
  FileText, 
  Users, 
  BarChart3,
  Mail,
  Settings,
  ArrowRight,
  TrendingUp,
  User,
  Bell,
  Palette,
  CreditCard,
  LayoutDashboard,
  Wallet,
  CheckSquare,
  Clock,
  Plug,
  FileSpreadsheet,
  Calculator
} from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface SearchResult {
  id: string
  title: string
  description?: string
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
  const { t } = useI18n()
  const navigate = useNavigate()
  
  const pages: SearchResult[] = [
    // Páginas principais
    { id: '1', title: t('nav.dashboard'), type: 'page', path: '/dashboard', icon: LayoutDashboard, shortcut: 'D' },
    { id: '2', title: 'Meu Trabalho', description: 'Tarefas e lembretes', type: 'page', path: '/meu-trabalho', icon: CheckSquare, shortcut: 'T' },
    { id: '3', title: 'Minha Finança', description: 'Gestão financeira', type: 'page', path: '/minha-financa', icon: Wallet, shortcut: 'F' },
    { id: '4', title: 'Meu Gerenciador', description: 'Gerenciador de orçamento', type: 'page', path: '/meu-gerenciador', icon: Calculator, shortcut: 'G' },
    { id: '5', title: 'Gestor de Projetos', description: 'Gerenciar projetos', type: 'page', path: '/gestor-projetos', icon: FolderKanban, shortcut: 'P' },
    { id: '6', title: 'Analytics', description: 'Métricas Google', type: 'page', path: '/analytics/google', icon: BarChart3, shortcut: 'A' },
    
    // Settings
    { id: '10', title: t('settings.profile'), type: 'page', path: '/settings/profile', icon: User },
    { id: '11', title: t('settings.notifications'), type: 'page', path: '/settings/notifications', icon: Bell },
    { id: '12', title: t('settings.preferences'), type: 'page', path: '/settings/preferences', icon: Palette },
    { id: '13', title: t('settings.billing'), description: 'Planos e faturamento', type: 'page', path: '/settings/billing', icon: CreditCard },
    { id: '14', title: 'Integrações', description: 'Google e APIs', type: 'page', path: '/settings/integrations', icon: Plug },
  ]
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!query) {
      setResults(pages.slice(0, 5))
      return
    }

    const filtered = pages.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
    )
    setResults(filtered)
    setSelectedIndex(0)
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
          <DialogTitle>{t('search.title')}</DialogTitle>
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
                        <div className="font-medium">{result.title}</div>
                        {result.description && (
                          <div className="text-xs text-muted-foreground">
                            {result.description}
                          </div>
                        )}
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
            <span>Use ↑↓ para navegar</span>
            <span>↵ para selecionar</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
