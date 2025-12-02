import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/dashboard-layout'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { ProjectManager } from '@/components/projects/project-manager'
import { useWorkspace } from '@/contexts/workspace-context'
import { useRealtimeProjects } from '@/hooks/use-realtime-projects'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FolderKanban, 
  Plus, 
  CheckSquare, 
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'completed' | 'archived'
  workspace_id: string
  user_id: string
  created_at: string
  updated_at: string
}

type PageMode = 'list' | 'create' | 'manager'

export default function ProjectManagerPage() {
  const { currentWorkspace } = useWorkspace()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [pageMode, setPageMode] = useState<PageMode>('list')
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>()
  const [selectedProjectName, setSelectedProjectName] = useState<string>('')

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

  // Carregar projetos - EXATAMENTE como no projects-card.tsx
  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from('projects').select('*')

      if (currentWorkspace?.id) {
        query = query.eq('workspace_id', currentWorkspace.id)
      } else {
        query = query.is('workspace_id', null)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar projetos:', error)
      toast.error('Erro ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  // Realtime
  useRealtimeProjects(currentWorkspace?.id || null, {
    enabled: true,
    showNotifications: false,
    onUpdate: loadProjects,
  })

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <DashboardLayout>
      {/* EXATAMENTE como o dialog expandido - muda o conteúdo baseado no modo */}
      <div className="h-full w-full flex flex-col overflow-hidden">
        {/* Header - só mostra no modo lista */}
        {pageMode === 'list' && (
          <div className="flex items-center justify-between gap-2 px-[5px] py-0.5 border-b border-border">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FolderKanban className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-semibold truncate">Projetos</h2>
            </div>

            <div className="flex items-center gap-0.5">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7"
                onClick={() => setPageMode('create')}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Conteúdo - muda baseado no pageMode */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {pageMode === 'create' ? (
            <CreateProjectDialog
              open={true}
              onOpenChange={() => setPageMode('list')}
              onProjectCreated={(projectId, projectName) => {
                if (projectId && projectName) {
                  setSelectedProjectId(projectId)
                  setSelectedProjectName(projectName)
                  setPageMode('manager')
                }
                loadProjects()
              }}
              embedded
            />
          ) : pageMode === 'manager' ? (
            <ProjectManager
              projectId={selectedProjectId!}
              projectName={selectedProjectName}
              onBack={() => {
                setPageMode('list')
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
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center h-full text-center py-16 px-6"
                >
                  <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium mb-2">Nenhum projeto ainda</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-[280px]">
                    Projetos organizam tarefas, documentos e progresso em um só lugar
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => setPageMode('create')}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Projeto
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-16 pb-4 pt-2">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedProjectId(project.id)
                        setSelectedProjectName(project.name)
                        setPageMode('manager')
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-1 h-full rounded-full",
                          statusColors[project.status]
                        )} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1">{project.name}</h4>
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
                              0 tarefas
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              0 docs
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
      </div>
    </DashboardLayout>
  )
}
