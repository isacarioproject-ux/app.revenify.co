import { useState, useEffect, useCallback, useRef } from 'react'
import { getProjects, createProject, updateProject, deleteProject } from '@/lib/supabase/queries'
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

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const hasLoadedOnce = useRef(false)
  const selectedProjectRef = useRef<Project | null>(null)

  // Keep ref in sync with state to avoid stale closures
  selectedProjectRef.current = selectedProject

  const fetchProjects = useCallback(async () => {
    try {
      // Só mostrar loading no primeiro carregamento
      if (!hasLoadedOnce.current) {
        setLoading(true)
      }
      const data = await getProjects()
      setProjects(data || [])

      // Selecionar primeiro projeto se não houver selecionado
      if (data && data.length > 0 && !selectedProjectRef.current) {
        setSelectedProject(data[0])
      }
      hasLoadedOnce.current = true
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }, [])

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
        setSelectedProject(projects.find(p => p.id !== projectId) || null)
      }
      toast.success('Projeto removido!')
    } catch (err) {
      toast.error('Erro ao remover projeto')
      throw err
    }
  }

  return {
    projects,
    loading,
    error,
    selectedProject,
    setSelectedProject,
    addProject,
    editProject,
    removeProject,
    refetch: fetchProjects,
  }
}
