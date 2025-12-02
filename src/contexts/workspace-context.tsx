import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Workspace, WorkspaceWithRole } from '@/types/workspace'
import { toast } from 'sonner'

interface WorkspaceContextType {
  currentWorkspace: WorkspaceWithRole | null
  workspaces: WorkspaceWithRole[]
  loading: boolean
  switchWorkspace: (workspaceId: string | null) => Promise<void>
  refreshWorkspaces: () => Promise<void>
  createWorkspace: (name: string, description?: string) => Promise<Workspace | null>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null)
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initWorkspaces()
  }, [])

  const initWorkspaces = async () => {
    const workspacesList = await fetchWorkspaces()
    
    // Carregar workspace salvo no localStorage
    const savedId = localStorage.getItem('currentWorkspaceId')
    if (savedId && savedId !== 'null' && workspacesList) {
      // Buscar diretamente na lista retornada (não no state que pode não estar atualizado)
      const savedWorkspace = workspacesList.find(w => w.id === savedId)
      if (savedWorkspace) {
        setCurrentWorkspace(savedWorkspace)
      }
    }
  }

  const fetchWorkspaces = async (): Promise<WorkspaceWithRole[] | null> => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return null
      }

      // Buscar memberships do usuário
      const { data: memberships, error } = await supabase
        .from('workspace_members')
        .select(`
          role,
          workspace_id,
          workspaces (
            id,
            name,
            slug,
            description,
            owner_id,
            avatar_url,
            settings,
            plan,
            max_members,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (error) throw error

      const workspacesList: WorkspaceWithRole[] = memberships
        ?.map((m: any) => ({
          ...m.workspaces,
          user_role: m.role,
        }))
        .filter(Boolean) || []

      setWorkspaces(workspacesList)
      return workspacesList
    } catch (err: any) {
      console.error('Error fetching workspaces:', err)
      toast.error('Erro ao carregar workspaces', {
        description: err.message,
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const switchWorkspace = async (workspaceId: string | null) => {
    if (!workspaceId) {
      // ✨ Atualizar localStorage ANTES do estado para que as queries usem o valor correto
      localStorage.setItem('currentWorkspaceId', 'null')
      setCurrentWorkspace(null)
      return
    }

    const workspace = workspaces.find(w => w.id === workspaceId)
    if (workspace) {
      // ✨ Atualizar localStorage ANTES do estado para que as queries usem o valor correto
      localStorage.setItem('currentWorkspaceId', workspaceId)
      setCurrentWorkspace(workspace)
    }
  }

  const refreshWorkspaces = async () => {
    await fetchWorkspaces()
  }

  const createWorkspace = async (name: string, description?: string): Promise<Workspace | null> => {
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      const { data, error } = await supabase.rpc('create_workspace_with_owner', {
        workspace_name: name,
        workspace_slug: `${slug}-${Date.now()}`,
        workspace_description: description || null,
      })

      if (error) throw error

      await refreshWorkspaces()
      
      toast.success('✓ Workspace criado', {
        description: `${name} foi criado com sucesso`,
      })

      // Buscar workspace completo
      const { data: newWorkspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', data)
        .single()

      return newWorkspace
    } catch (err: any) {
      toast.error('Erro ao criar workspace', {
        description: err.message,
      })
      return null
    }
  }

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        loading,
        switchWorkspace,
        refreshWorkspaces,
        createWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}
