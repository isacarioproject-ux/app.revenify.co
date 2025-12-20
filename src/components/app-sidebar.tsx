import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '@/components/logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User,
  LogOut,
  ChevronUp,
  Settings,
} from 'lucide-react'
import {
  AnimatedHome,
  AnimatedFolderKanban,
  AnimatedRadio,
  AnimatedBarChart3,
  AnimatedUsers,
  AnimatedRoute,
  AnimatedFileText,
  AnimatedLink2,
  AnimatedGlobe,
  AnimatedShield,
  AnimatedSettings,
  AnimatedCreditCard,
  AnimatedBell,
  AnimatedPalette,
  AnimatedUser,
  AnimatedPlug,
} from '@/components/animated-icons'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useI18n } from '@/hooks/use-i18n'
import { useProjects } from '@/hooks/use-projects'
import { UsageWidget } from '@/components/usage-widget'

export function AppSidebar() {
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobile } = useSidebar()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const { selectedProject } = useProjects()

  const menuItems = [
    {
      title: t('nav.dashboard'),
      icon: AnimatedHome,
      href: '/dashboard',
    },
    {
      title: t('nav.projects'),
      icon: AnimatedFolderKanban,
      href: '/projects',
    },
    {
      title: t('nav.sources'),
      icon: AnimatedRadio,
      href: '/sources',
    },
    {
      title: t('nav.analytics'),
      icon: AnimatedBarChart3,
      href: '/analytics',
    },
    {
      title: t('nav.leads'),
      icon: AnimatedUsers,
      href: '/leads',
    },
    {
      title: t('nav.journey'),
      icon: AnimatedRoute,
      href: '/journey',
    },
    {
      title: t('nav.templates'),
      icon: AnimatedFileText,
      href: '/templates',
    },
    {
      title: t('nav.shortLinks'),
      icon: AnimatedLink2,
      href: '/short-links',
    },
    {
      title: t('nav.customDomain'),
      icon: AnimatedGlobe,
      href: '/custom-domain',
    },
    {
      title: t('nav.sso'),
      icon: AnimatedShield,
      href: '/sso',
    },
  ]

  useEffect(() => {
    // Carregar usuário inicial
    const loadUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('Erro ao carregar sessão no sidebar:', error)
          setUser(null)
          return
        }
        setUser(session?.user || null)
      } catch (err) {
        console.warn('Erro de conexão ao carregar usuário:', err)
        setUser(null)
      }
    }
    
    loadUser()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    // Listener customizado para atualizações de perfil
    const handleUserUpdate = () => {
      console.log('🔄 Atualizando dados do usuário no sidebar...')
      loadUser()
    }

    window.addEventListener('user-updated', handleUserUpdate)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('user-updated', handleUserUpdate)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const getUserInitials = () => {
    if (!user?.email) return '??'
    const email = user.email
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Sidebar collapsible="icon" className="border-r border-border/40 backdrop-blur-sm bg-background/95">
      <SidebarHeader>
        <motion.div 
          className="flex items-center gap-2 px-1 py-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Sidebar Aberta: Logo + Toggle */}
          <motion.div 
            className="group-data-[collapsible=icon]:hidden w-full flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            <Logo className="shrink-0 h-6" />
            <div className="flex-1" />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0"
            >
              <SidebarTrigger className="h-7 w-7 transition-colors duration-200 hover:bg-sidebar-accent/50" />
            </motion.div>
          </motion.div>
          
          {/* Sidebar Fechada: Toggle para abrir */}
          <motion.div 
            className="hidden group-data-[collapsible=icon]:flex w-full justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SidebarTrigger className="transition-colors duration-200 hover:bg-sidebar-accent/50" />
            </motion.div>
          </motion.div>
        </motion.div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: index * 0.1, 
                    duration: 0.3, 
                    ease: "easeOut" 
                  }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="group transition-all duration-200 hover:bg-sidebar-accent/50"
                    >
                      <Link to={item.href} className="gap-3 flex items-center">
                        <div
                          className={`transition-colors duration-200 ${
                            isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground'
                          }`}
                        >
                          <Icon isActive={isActive} />
                        </div>
                        <motion.span
                          initial={{ opacity: 0.8 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`transition-colors duration-200 ${
                            isActive ? 'text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'
                          }`}
                        >
                          {item.title}
                        </motion.span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              )
            })}
            
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2">
        {/* Usage Widget - No Footer (esconde quando sidebar colapsado) */}
        <div className="px-2 group-data-[collapsible=icon]:hidden">
          <UsageWidget 
            projectId={selectedProject?.id} 
            userId={user?.id}
            compact 
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3, ease: "easeOut" }}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-200 hover:bg-sidebar-accent/50"
                    >
                      <motion.div
                        whileHover={{ rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Avatar className="h-8 w-8 rounded-lg transition-shadow duration-200 hover:shadow-md">
                          <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                          <AvatarFallback className="rounded-lg">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <motion.span 
                          className="truncate font-semibold transition-colors duration-200"
                          initial={{ opacity: 0.8 }}
                          whileHover={{ opacity: 1 }}
                        >
                          {user?.user_metadata?.name || user?.email?.split('@')[0] || t('common.user')}
                        </motion.span>
                        <motion.span 
                          className="truncate text-xs text-muted-foreground transition-colors duration-200"
                          initial={{ opacity: 0.6 }}
                          whileHover={{ opacity: 0.8 }}
                        >
                          {user?.email}
                        </motion.span>
                      </div>
                      <motion.div
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronUp className="ml-auto size-4 transition-colors duration-200" />
                      </motion.div>
                    </SidebarMenuButton>
                  </motion.div>
                </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "top" : "bottom"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                      <AvatarFallback className="rounded-lg">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.user_metadata?.name || user?.email?.split('@')[0] || t('common.user')}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  {t('settings.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/notifications')}>
                  <Bell className="mr-2 h-4 w-4" />
                  {t('settings.notifications')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/preferences')}>
                  <Palette className="mr-2 h-4 w-4" />
                  {t('settings.preferences')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/billing')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t('settings.billing')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/integrations')}>
                  <Plug className="mr-2 h-4 w-4" />
                  {t('settings.integrations')}
                </DropdownMenuItem>
                {/* Blog - apenas para admin */}
                {user?.email === 'revenify.co@gmail.com' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/blog/create')}>
                      <PenSquare className="mr-2 h-4 w-4" />
                      Blog Admin
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        </motion.div>
      </SidebarFooter>
    </Sidebar>
    </motion.div>
  )
}
