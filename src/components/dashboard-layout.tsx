import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { GlobalSearch } from '@/components/global-search'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { TrialBanner } from '@/components/trial-banner'
import { Search } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { useI18n } from '@/hooks/use-i18n'
import { SidebarSkeleton, HeaderSkeleton } from '@/components/loading-skeleton'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { t } = useI18n()

  // Global search shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    // Verificar sessão em background - NÃO bloqueia
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.warn('Erro de conexão ao verificar sessão:', error)
          // Não redireciona em caso de erro de rede
          setLoading(false)
          return
        }
        if (!session) {
          navigate('/auth')
        } else {
          setUser(session.user)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.warn('Erro de rede ao verificar sessão:', err)
        // Mantém na página atual em caso de erro
        setLoading(false)
      })

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth')
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  // Renderiza imediatamente - sem bloqueio
  return (
    <SidebarProvider defaultOpen={true}>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <div className="flex h-screen w-full">
        {loading ? <SidebarSkeleton /> : <AppSidebar />}
        <main className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out">
          {loading ? (
            <HeaderSkeleton />
          ) : (
            <header className="sticky top-0 z-50 flex h-10 items-center gap-3 border-b border-border/40 bg-sidebar px-3">
              {/* Toggle sidebar - visível apenas em mobile */}
              <SidebarTrigger className="-ml-1 md:hidden" />
              <div className="flex flex-1 items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchOpen(true)}
                  className="relative h-7 w-auto justify-start text-xs text-muted-foreground md:w-48 lg:w-56"
                >
                  <Search className="mr-2 h-3.5 w-3.5" />
                  <span className="hidden md:inline-flex">Buscar...</span>
                  <kbd className="pointer-events-none absolute right-1 top-1 hidden h-3.5 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-[9px] font-medium opacity-100 md:flex">
                    <span>⌘K</span>
                  </kbd>
                </Button>
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </header>
          )}
          <div className="relative flex-1 overflow-y-auto">
            <div className="p-4 pb-0">
              <TrialBanner />
            </div>
            {children}
          </div>
        </main>
      </div>
      {/* AI Chat Widget */}
      <AIChatWidget />
    </SidebarProvider>
  )
}
