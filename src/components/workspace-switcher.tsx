import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/use-i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  ChevronsUpDown,
  Plus,
  Building2,
  User,
  Settings,
  MoreHorizontal,
  LogOut,
} from 'lucide-react'
import { useWorkspace } from '@/contexts/workspace-context'
import { WorkspaceSettingsDialog } from '@/components/workspace/workspace-settings-dialog'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function WorkspaceSwitcher() {
  const { t } = useI18n()
  const {
    currentWorkspace,
    workspaces,
    switchWorkspace,
    createWorkspace,
  } = useWorkspace()

  const [open, setOpen] = useState(false)
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSettingsTab, setShowSettingsTab] = useState<string | undefined>(undefined)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    // Carregar usuário atual
    const loadUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('Erro ao carregar sessão:', error)
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

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fechar menu do usuário quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showUserMenu])

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return

    setCreating(true)
    try {
      const workspace = await createWorkspace(newWorkspaceName, newWorkspaceDescription)
      
      if (workspace) {
        setNewWorkspaceName('')
        setNewWorkspaceDescription('')
        setShowNewWorkspaceDialog(false)
        await switchWorkspace(workspace.id)
      }
    } finally {
      setCreating(false)
    }
  }

  const handleSwitchWorkspace = async (workspaceId: string | null) => {
    await switchWorkspace(workspaceId)
    setOpen(false)
  }

  // Workspace atual ou "Pessoal"
  const currentLabel = currentWorkspace?.name || t('workspace.personal')
  const currentInitials = currentWorkspace
    ? currentWorkspace.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'P'

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ backgroundColor: 'hsl(var(--accent) / 0.5)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 h-7 px-1.5 rounded-md hover:bg-accent/50 cursor-pointer transition-colors w-full max-w-full"
          >
            {/* Avatar quadrado estilo Notion */}
            <div className="h-5 w-5 shrink-0 rounded bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">
                {currentInitials}
              </span>
            </div>
            {/* Nome truncado */}
            <span className="text-xs font-medium text-foreground/90 truncate min-w-0 flex-1">
              {currentLabel}
            </span>
            {/* Chevron no final */}
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.15 }}
              className="shrink-0 ml-auto"
            >
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />
            </motion.div>
          </motion.button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          className="w-[300px] !z-[1000] p-3 bg-background/95 backdrop-blur-xl border-border/40 shadow-xl rounded-lg" 
          align="start"
          sideOffset={4}
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header estilo Notion */}
            <div className="pb-3 mb-3 border-b border-border/20">
              <h3 className="font-semibold text-base text-foreground mb-1">
                {currentLabel}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {currentWorkspace ? t('workspace.freePlan') : t('workspace.personalSpace')}
              </p>
              
              {/* Botões de ação estilo Notion */}
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false)
                    setShowSettings(true)
                  }}
                  className="flex-1 h-6 text-xs px-1.5"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {t('nav.settings')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false)
                    setShowSettingsTab('members')
                    setShowSettings(true)
                  }}
                  className="flex-1 h-6 text-xs px-1.5"
                  disabled={!currentWorkspace}
                >
                  <User className="h-3 w-3 mr-1" />
                  {t('workspace.inviteMembers')}
                </Button>
              </div>
            </div>

            {/* Email do usuário com ações */}
            <div className="pb-2 mb-2 relative">
              <div 
                className="flex items-center justify-between px-1 py-1 hover:bg-accent/40 rounded-sm cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowUserMenu(!showUserMenu)
                }}
              >
                <p className="text-xs text-muted-foreground truncate flex-1">
                  {user?.email || t('common.loading')}
                </p>
                <MoreHorizontal className="h-3 w-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Menu de ações do usuário */}
              {showUserMenu && currentWorkspace && (
                <div 
                  className="absolute top-full left-0 right-0 mt-1 z-[1002] bg-background/95 backdrop-blur-xl border border-border/40 shadow-xl rounded-lg p-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    onClick={() => {
                      handleSwitchWorkspace(null)
                      setOpen(false)
                      setShowUserMenu(false)
                    }}
                    className="cursor-pointer px-2 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-sm flex items-center"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    {t('workspace.leaveWorkspace')}
                  </div>
                </div>
              )}
            </div>

            {/* Pessoal (sem workspace) */}
            <DropdownMenuItem
              onClick={() => handleSwitchWorkspace(null)}
              className="cursor-pointer mx-1 px-2 py-1.5 focus:bg-accent/60 hover:bg-accent/40 transition-all duration-200"
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <User className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-foreground flex-1">
                  {t('workspace.personal')}
                </span>
                {!currentWorkspace && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
            </DropdownMenuItem>

            {/* Lista de workspaces */}
            {workspaces.map((workspace) => {
              const initials = workspace.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()

              return (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleSwitchWorkspace(workspace.id)}
                  className="cursor-pointer mx-1 px-2 py-2 focus:bg-accent/60 hover:bg-accent/40 transition-all duration-200"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {initials}
                      </span>
                    </div>
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-sm font-medium truncate text-foreground">
                          {t('workspace.spaceOf')} {workspace.name}
                        </span>
                        {workspace.user_role === 'owner' && (
                          <Badge variant="secondary" className="h-3.5 px-1 text-[8px] font-medium bg-primary/10 text-primary border-none">
                            {t('workspace.owner')}
                          </Badge>
                        )}
                      </div>
                      {currentWorkspace?.id === workspace.id && (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              )
            })}

            {/* Texto azul estilo Notion */}
            <div className="mt-2 pt-2">
              <div
                onClick={() => {
                  setOpen(false)
                  setShowNewWorkspaceDialog(true)
                }}
                className="flex items-center gap-1 text-primary hover:text-primary/80 cursor-pointer text-sm px-1 py-1"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('workspace.newWorkspace')}
              </div>
            </div>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog Settings */}
      <WorkspaceSettingsDialog
        open={showSettings}
        onOpenChange={(open) => {
          setShowSettings(open)
          if (!open) setShowSettingsTab(undefined)
        }}
        defaultTab={showSettingsTab as 'general' | 'members' | undefined}
      />

      {/* Dialog Criar Workspace */}
      <Dialog open={showNewWorkspaceDialog} onOpenChange={setShowNewWorkspaceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('workspace.createNew')}
            </DialogTitle>
            <DialogDescription>
              {t('workspace.createDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">
                {t('workspace.name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="workspace-name"
                placeholder={t('workspace.namePlaceholder')}
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {t('workspace.nameHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-description">
                {t('workspace.description')}
              </Label>
              <Textarea
                id="workspace-description"
                placeholder={t('workspace.descriptionPlaceholder')}
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                className="resize-none"
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewWorkspaceDialog(false)
                setNewWorkspaceName('')
                setNewWorkspaceDescription('')
              }}
              disabled={creating}
            >
              {t('workspace.cancel')}
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={!newWorkspaceName.trim() || creating}
            >
              {creating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  {t('workspace.creating')}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('workspace.create')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}
