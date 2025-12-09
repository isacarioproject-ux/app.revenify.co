import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { getProjects, createProject, updateProject, deleteProject } from '@/lib/supabase/queries'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface Project {
  id: string
  user_id: string
  name: string
  domain: string
  project_key: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProjectsContextType {
  projects: Project[]
  loading: boolean
  error: Error | null
  selectedProject: Project | null
  setSelectedProject: (project: Project | null) => void
  addProject: (project: { name: string; domain: string }) => Promise<Project>
  editProject: (projectId: string, updates: { name?: string; domain?: string; is_active?: boolean }) => Promise<Project>
  removeProject: (projectId: string) => Promise<void>
  refetch: () => Promise<void>
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const hasLoadedOnce = useRef(false)

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }

    try {
      // Só mostrar loading no primeiro carregamento
      if (!hasLoadedOnce.current) {
        setLoading(true)
      }
      const data = await getProjects()
      setProjects(data || [])
      
      // Selecionar primeiro projeto se não houver selecionado
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0])
      }
      hasLoadedOnce.current = true
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const addProject = async (project: { name: string; domain: string }) => {
    try {
      const newProject = await createProject(project)
      setProjects(prev => [newProject, ...prev])
      setSelectedProject(newProject)
      toast.success('Projeto criado com sucesso!')
      return newProject
    } catch (err) {
      toast.error('Erro ao criar projeto')
      throw err
    }
  }

  const editProject = async (projectId: string, updates: { name?: string; domain?: string; is_active?: boolean }) => {
    try {
      const updated = await updateProject(projectId, updates)
      setProjects(prev => prev.map(p => p.id === projectId ? updated : p))
      if (selectedProject?.id === projectId) {
        setSelectedProject(updated)
      }
      toast.success('Projeto atualizado!')
      return updated
    } catch (err) {
      toast.error('Erro ao atualizar projeto')
      throw err
    }
  }

  const removeProject = async (projectId: string) => {
    try {
      await deleteProject(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
      if (selectedProject?.id === projectId) {
        const remaining = projects.filter(p => p.id !== projectId)
        setSelectedProject(remaining[0] || null)
      }
      toast.success('Projeto removido!')
    } catch (err) {
      toast.error('Erro ao remover projeto')
      throw err
    }
  }

  return (
    <ProjectsContext.Provider value={{
      projects,
      loading,
      error,
      selectedProject,
      setSelectedProject,
      addProject,
      editProject,
      removeProject,
      refetch: fetchProjects,
    }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjectsContext() {
  const context = useContext(ProjectsContext)
  if (context === undefined) {
    throw new Error('useProjectsContext must be used within a ProjectsProvider')
  }
  return context
}
