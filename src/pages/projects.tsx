import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useWorkspace } from '@/contexts/workspace-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, FolderKanban, Search, MoreVertical, Trash2, CheckSquare, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Project {
  id: string
  name: string
  description: string | null
  workspace_id: string | null
  user_id: string
  status: string
  created_at: string
  updated_at: string
  taskCount?: number
  financeCount?: number
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Determinar workspace ID (null para modo Pessoal)
  const workspaceId = currentWorkspace?.id || null

  // Carregar projetos
  const loadProjects = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      // Filtrar por workspace
      if (workspaceId === null) {
        query = query.is('workspace_id', null);  // Modo Pessoal
      } else {
        query = query.eq('workspace_id', workspaceId);  // Workspace específico
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
          
          // Contar documentos financeiros
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
      
      console.log('🔢 Projetos (página) com contadores:', projectsWithCounts)
      setProjects(projectsWithCounts)
    } catch (error: any) {
      console.error('❌ Erro ao carregar projetos (página):', error)
      toast.error('Erro ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [user, workspaceId])

  // Criar novo projeto
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Digite um nome para o projeto')
      return
    }

    if (!user) return

    setCreating(true)
    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName.trim(),
          description: newProjectDescription.trim() || null,
          workspace_id: workspaceId,  // null para Pessoal, UUID para workspace
          user_id: user.id,
          status: 'active'
        })

      if (error) throw error

      toast.success('Projeto criado com sucesso!')
      setNewProjectName('')
      setNewProjectDescription('')
      setShowCreateDialog(false)
      loadProjects()
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error)
      toast.error('Erro ao criar projeto')
    } finally {
      setCreating(false)
    }
  }

  // Filtrar projetos pela busca
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 px-4 md:px-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="text-sm text-muted-foreground">
            {workspaceId ? `Workspace: ${currentWorkspace?.name}` : 'Modo Pessoal'}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Novo Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Projeto</label>
              <Input
                placeholder="Ex: Lançamento Produto 2025"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descreva o objetivo e escopo do projeto..."
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                disabled={creating}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateProject} disabled={creating}>
                {creating ? 'Criando...' : 'Criar Projeto'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setNewProjectName('')
                  setNewProjectDescription('')
                }}
                disabled={creating}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando projetos...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto criado ainda'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Projeto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group relative hover:shadow-lg transition-shadow">
              {/* Menu 3 pontinhos */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={async () => {
                      if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
                        try {
                          const { error } = await supabase
                            .from('projects')
                            .delete()
                            .eq('id', project.id)
                          
                          if (error) throw error
                          toast.success('Projeto excluído com sucesso')
                          loadProjects()
                        } catch (error: any) {
                          console.error('Erro ao excluir projeto:', error)
                          toast.error('Erro ao excluir projeto')
                        }
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Excluir projeto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {project.description}
                  </p>
                )}
                
                {/* Contadores */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {project.taskCount || 0} {project.taskCount === 1 ? 'tarefa' : 'tarefas'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {project.financeCount || 0} docs
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
