import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { X, FolderKanban, Sparkles, ChevronRight, Circle, Loader2, CheckCircle2, Clock, Lock, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useWorkspace } from '@/contexts/workspace-context'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/use-i18n'
import { StatusDialog } from './status-dialog'
import { ShareMembersSelector } from './share-members-selector'
import { cn } from '@/lib/utils'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated?: (projectId?: string, projectName?: string) => void
  embedded?: boolean // Se true, não renderiza o Dialog wrapper
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
  embedded = false,
}: CreateProjectDialogProps) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const { t } = useI18n()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'pending' | 'active' | 'completed' | 'archived'>('pending')
  const [isPrivate, setIsPrivate] = useState(false)
  const [sharedMembers, setSharedMembers] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)

  const workspaceId = currentWorkspace?.id || null

  // Helper para obter iniciais de nomes (Mock - trocar por dados reais)
  const getMemberInitials = (memberId: string): string => {
    const memberNames: Record<string, string> = {
      '1': 'EU',
      '2': 'JS',
      '3': 'MS',
      '4': 'PC',
      '5': 'AO',
      '6': 'CF',
      '7': 'JA',
      '8': 'RL',
    }
    return memberNames[memberId] || 'M'
  }

  const STATUS_LABELS = {
    pending: 'PENDENTE',
    active: 'EM PROGRESSO',
    completed: 'CONCLUÍDO',
    archived: 'ARQUIVADO',
  } as const

  const STATUS_ICONS = {
    pending: Clock,
    active: Loader2,
    completed: CheckCircle2,
    archived: Circle,
  } as const

  const STATUS_COLORS = {
    pending: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20',
    active: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
    completed: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
    archived: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20',
  } as const

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error(t('projects.enterName'))
      return
    }

    if (!user) {
      toast.error(t('projects.needLogin'))
      return
    }

    setCreating(true)
    try {
      const projectData = {
        name,
        description: description || null,
        status,
        workspace_id: workspaceId || null,
        user_id: user?.id,
      }

      console.log('📦 Criando projeto com dados:', projectData)

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro do Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
        throw new Error(error.message || 'Erro ao criar projeto')
      }

      console.log('✅ Projeto criado:', data)

      toast.success(t('projects.created'))
      
      // Callback para atualizar lista (passa projectId e name)
      onProjectCreated?.(data.id, name)
      
      // Resetar form
      setName('')
      setDescription('')
      setStatus('pending')
      setIsPrivate(false)
      setSharedMembers([])
      
      // Fechar dialog (se não embedded)
      if (!embedded) {
        onOpenChange(false)
      }
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error)
      toast.error(error.message || t('projects.errorCreate'))
    } finally {
      setCreating(false)
    }
  }

  const content = (
    <>
      {/* Header */}
      <div className="px-[5px] py-0.5 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
              <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-semibold truncate">Criar Pasta</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                Use pastas para organizar suas listas, documentos e muito mais.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
      </div>

        {/* Content */}
        <div className="px-3 sm:px-4 pb-2 sm:pb-4 space-y-2 sm:space-y-3 overflow-y-auto flex-1">
          {/* Nome */}
          <div className="space-y-1 sm:space-y-1.5">
            <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Projeto, cliente, equipe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
              autoFocus
              className="h-8 sm:h-9 text-sm placeholder:text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1 sm:space-y-1.5">
            <Label htmlFor="description" className="text-xs sm:text-sm font-medium">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva sua pasta (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={creating}
              rows={1}
              className="resize-none text-xs sm:text-sm placeholder:text-xs h-8 sm:h-auto sm:min-h-[64px]"
            />
          </div>

          {/* Tags/Breadcrumb (estático por enquanto) */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground overflow-x-auto">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 whitespace-nowrap shrink-0">
              <FolderKanban className="h-2.5 w-2.5" />
              <span>Espaço da equipe</span>
            </div>
            <span className="shrink-0">/</span>
            <span className="truncate">Nova pasta</span>
          </div>

          {/* Configurações */}
          <div className="space-y-1 sm:space-y-1.5 pt-1.5 sm:pt-2">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">Configurações</h3>

            {/* Status */}
            <button
              type="button"
              onClick={() => setIsStatusDialogOpen(true)}
              disabled={creating}
              className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-accent/30 transition-all w-full text-left group"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {(() => {
                  const Icon = STATUS_ICONS[status]
                  const colorClass = STATUS_COLORS[status]
                  
                  return (
                    <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shrink-0", colorClass)}>
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                  )
                })()}
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">Status</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {STATUS_LABELS[status]}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
            </button>

            {/* Tornar privado */}
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">Tornar privado</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    Somente você e membros convidados têm acesso
                  </p>
                </div>
              </div>
              <Switch 
                checked={isPrivate} 
                onCheckedChange={(checked) => {
                  setIsPrivate(checked)
                  if (!checked) {
                    setSharedMembers([])
                  }
                }} 
                disabled={creating}
                className="shrink-0"
              />
            </div>

            {/* Compartilhar apenas com - Só aparece quando isPrivate = true */}
            {isPrivate && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <ShareMembersSelector
                  selectedMembers={sharedMembers}
                  onMembersChange={setSharedMembers}
                  trigger={
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-accent/30 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">Compartilhar apenas com</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {sharedMembers.length === 0 
                              ? 'Selecione membros do workspace'
                              : sharedMembers.length === 1
                              ? '1 membro selecionado'
                              : `${sharedMembers.length} membros selecionados`}
                          </p>
                        </div>
                      </div>

                      {/* Avatars Stack */}
                      {sharedMembers.length > 0 && (
                        <div className="flex -space-x-2 shrink-0 ml-2">
                          {sharedMembers.slice(0, 3).map((memberId, index) => (
                            <Avatar
                              key={memberId}
                              className="h-6 w-6 sm:h-7 sm:w-7 border-2 border-background ring-1 ring-border transition-transform group-hover:scale-110"
                              style={{ zIndex: 3 - index }}
                            >
                              <AvatarFallback className="text-[9px] sm:text-[10px] bg-primary/10 text-primary font-semibold">
                                {getMemberInitials(memberId)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {sharedMembers.length > 3 && (
                            <div 
                              className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center ring-1 ring-border transition-transform group-hover:scale-110"
                              style={{ zIndex: 0 }}
                            >
                              <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground">
                                +{sharedMembers.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  }
                />
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end pt-1.5 sm:pt-3 sticky bottom-0 bg-background pb-1.5 sm:pb-0 border-t border-border/50 sm:border-0 -mx-3 sm:mx-0 px-3 sm:px-0">
            <Button 
              size="sm" 
              className="h-7 sm:h-9 gap-1.5 sm:gap-2 min-w-[85px] sm:min-w-[100px] text-xs sm:text-sm px-3 sm:px-4" 
              onClick={handleCreate} 
              disabled={creating || !name.trim()}
            >
              {creating && <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />}
              {creating ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </div>

      {/* Status Dialog */}
      <StatusDialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
        currentStatus={status}
        onStatusChange={setStatus}
      />
    </>
  )

  // Se embedded, retorna apenas o conteúdo
  if (embedded) {
    return content
  }

  // Senão, retorna com Dialog wrapper
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="!w-screen sm:max-w-[480px] md:!rounded-lg !rounded-none p-0 gap-0 [&>button]:hidden max-h-[100dvh] flex flex-col">
        <DialogTitle className="sr-only">Criar Pasta</DialogTitle>
        <DialogDescription className="sr-only">
          Use pastas para organizar suas listas, documentos e muito mais
        </DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  )
}
