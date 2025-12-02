import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FolderKanban,
  Plus,
  GripVertical,
  Maximize2,
  Minimize2,
  MoreVertical,
  Trash2,
  Users,
  FileText,
  CheckSquare,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/contexts/workspace-context'
import { useRealtimeProjects } from '@/hooks/use-realtime-projects'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'
import { ProjectDialogManager } from './project-dialog-manager'
import { CreateProjectDialog } from './create-project-dialog'
import { ProjectManager } from './project-manager'

interface ProjectsCardProps {
  workspaceId?: string
  dragHandleProps?: any
}

interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'completed' | 'archived'
  workspace_id: string
  user_id: string
  created_at: string
  updated_at: string
  taskCount?: number
  financeCount?: number
}

export function ProjectsCard({ workspaceId, dragHandleProps }: ProjectsCardProps) {
  const { currentWorkspace } = useWorkspace()
  const { t } = useI18n()
  const finalWorkspaceId = workspaceId || currentWorkspace?.id

  const cardName = t('sidebar.projects')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>()
  const [selectedProjectName, setSelectedProjectName] = useState<string>('')
  const [expandedMode, setExpandedMode] = useState<'list' | 'manager' | 'create'>('list')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Função para carregar projetos com contadores
  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('projects')
        .select('*');

      // Se finalWorkspaceId for null (modo Pessoal), buscar projetos sem workspace
      if (finalWorkspaceId === null || finalWorkspaceId === undefined) {
        query = query.is('workspace_id', null);
      } else {
        query = query.eq('workspace_id', finalWorkspaceId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error
      
      // Buscar contadores para cada projeto
      const projectsWithCounts = await Promise.all(
        (data || []).map(async (project) => {
          // Contar documentos de projeto (tarefas)
          const { count: taskCount } = await supabase
            .from('project_documents')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id)
          
          // Contar documentos financeiros vinculados aos documentos do projeto
          const { count: financeCount } = await supabase
            .from('finance_documents')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id)
          
          return {
            ...project,
            taskCount: taskCount || 0,
            financeCount: financeCount || 0,
          }
        })
      )
      
      console.log('🔢 Projetos com contadores:', projectsWithCounts)
      setProjects(projectsWithCounts)
    } catch (error: any) {
      console.error('❌ Erro ao carregar projetos:', error)
      toast.error(t('projects.errorLoad'))
    } finally {
      setLoading(false)
    }
  }, [finalWorkspaceId])


  // Realtime para atualizar lista quando houver mudanças
  useRealtimeProjects(finalWorkspaceId || null, {
    enabled: true, // Sempre habilitado, inclusive no modo Pessoal
    showNotifications: false, // Não mostrar toast (já mostra no onboarding)
    onUpdate: loadProjects,
  })

  // Carregar projetos (sempre carrega, inclusive no modo Pessoal onde finalWorkspaceId = null)
  useEffect(() => {
    loadProjects()
  }, [loadProjects])


  const statusColors = {
    active: 'bg-green-500',
    completed: 'bg-blue-500',
    archived: 'bg-gray-500',
  }

  const statusLabels = {
    active: 'Ativo',
    completed: 'Concluído',
    archived: 'Arquivado',
  }

  return (
    <>
        <Card className="h-full flex flex-col group">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between gap-2 px-0.5 py-0.5">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {/* Drag Handle - sempre visível no mobile, hover no desktop */}
              <div 
                {...dragHandleProps} 
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/70 rounded transition-colors flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 relative z-10 touch-none"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </div>

              {/* Nome Fixo */}
              <h3 className="font-semibold text-sm truncate">
                {cardName}
              </h3>

              {/* Badge Ao Vivo - Workspace */}
              {currentWorkspace && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] h-5 px-1.5 gap-1 bg-green-500/10 text-green-600 border-green-500/20 hidden sm:flex"
                  >
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-green-500"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    {t('realtime.live')}
                  </Badge>
                </motion.div>
              )}
            </div>

            {/* Botões de Ação - Sempre visíveis */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Expandir */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-accent/60"
                  onClick={() => setIsExpanded(true)}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>

              {/* Adicionar */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-accent/60"
                  onClick={() => {
                    setSelectedProjectId(undefined)
                    setSelectedProjectName('')
                    setIsCreateDialogOpen(true)
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </motion.div>

            </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto flex flex-col">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center h-full text-center py-16 px-6"
              >
                <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium mb-2">{t('projects.noProjects')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('projects.noProjectsDesc')}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 5).map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                    onClick={() => {
                      setSelectedProjectId(project.id)
                      setSelectedProjectName(project.name)
                      setIsCreateDialogOpen(true)
                    }}
                  >
                    {/* Menu 3 pontinhos - Posição absoluta no canto superior direito */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
                              try {
                                const { error } = await supabase
                                  .from('projects')
                                  .delete()
                                  .eq('id', project.id)
                                
                                if (error) throw error
                                toast.success(t('projects.deleted'))
                                loadProjects()
                              } catch (error: any) {
                                console.error('Erro ao excluir projeto:', error)
                                toast.error(t('projects.errorDelete'))
                              }
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          {t('projects.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-1 h-full rounded-full",
                        statusColors[project.status]
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{project.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {statusLabels[project.status]}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            {project.taskCount || 0} {project.taskCount === 1 ? 'tarefa' : 'tarefas'}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {project.financeCount || 0} docs
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {projects.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsExpanded(true)}
                  >
                    Ver todos ({projects.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Dialog Expandido */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent 
          showClose={false}
          className={`!w-screen !max-w-5xl md:!rounded-lg !rounded-none !p-0 [&>*]:!m-0 !gap-0 !space-y-0 [&>button]:hidden overflow-hidden flex flex-col ${
            isFullscreen ? '!h-screen !max-w-full !rounded-none' : '!h-[85vh] md:!w-[90vw]'
          }`}
        >
          {/* Header - apenas no modo lista */}
          {expandedMode === 'list' && (
            <div className="flex items-center justify-between gap-2 px-[5px] py-0.5 border-b border-border">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FolderKanban className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-semibold truncate">{cardName}</h2>
              </div>

              <div className="flex items-center gap-0.5">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={() => {
                    setSelectedProjectId(undefined)
                    setSelectedProjectName('')
                    setIsCreateDialogOpen(true)
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>

                
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={() => {
                    setIsExpanded(false)
                    setExpandedMode('list')
                    setSelectedProjectId(undefined)
                    setSelectedProjectName('')
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Conteúdo */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {expandedMode === 'create' ? (
              <CreateProjectDialog
                open={true}
                onOpenChange={() => setExpandedMode('list')}
                onProjectCreated={(projectId, projectName) => {
                  if (projectId && projectName) {
                    setSelectedProjectId(projectId)
                    setSelectedProjectName(projectName)
                    setExpandedMode('manager')
                  }
                  loadProjects()
                }}
                embedded
              />
            ) : expandedMode === 'manager' ? (
              <ProjectManager
                projectId={selectedProjectId!}
                projectName={selectedProjectName}
                onBack={() => {
                  setExpandedMode('list')
                  setSelectedProjectId(undefined)
                  setSelectedProjectName('')
                }}
              />
            ) : (
            <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="space-y-2 px-2 py-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                  <FolderKanban className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum projeto ainda</h3>
                <p className="text-muted-foreground max-w-md">
                  Projetos organizam tarefas, documentos e progresso em um só lugar
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-4 pt-2">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedProjectId(project.id)
                      setSelectedProjectName(project.name)
                      setExpandedMode('manager')
                    }}
                  >
                    {/* Menu 3 pontinhos - Posição absoluta no canto superior direito */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
                              try {
                                const { error } = await supabase
                                  .from('projects')
                                  .delete()
                                  .eq('id', project.id)
                                
                                if (error) throw error
                                toast.success(t('projects.deleted'))
                                loadProjects()
                              } catch (error: any) {
                                console.error('Erro ao excluir projeto:', error)
                                toast.error(t('projects.errorDelete'))
                              }
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          {t('projects.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-1 h-full rounded-full",
                        statusColors[project.status]
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{project.name}</h4>
                        </div>
                        <Badge variant="secondary" className="text-xs mb-2">
                          {statusLabels[project.status]}
                        </Badge>
                        {project.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            {project.taskCount || 0} {project.taskCount === 1 ? 'tarefa' : 'tarefas'}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {project.financeCount || 0} docs
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
            )}
          </div>

          <DialogDescription className="sr-only">
            Visualização expandida de projetos
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Dialog Gestor de Projetos */}
      <ProjectDialogManager
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            // Resetar seleção ao fechar
            setSelectedProjectId(undefined)
            setSelectedProjectName('')
          }
        }}
        onProjectCreated={loadProjects}
        initialProjectId={selectedProjectId}
        initialProjectName={selectedProjectName}
      />
    </>
  )
}
