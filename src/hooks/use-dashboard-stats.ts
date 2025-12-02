import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalDocuments: number
  recentDocuments: number
  totalStorage: number
  projectsByStatus: {
    planning: number
    in_progress: number
    completed: number
    on_hold: number
  }
  documentsByCategory: {
    category: string
    count: number
  }[]
  recentActivity: {
    type: 'project' | 'document'
    action: 'created' | 'updated' | 'deleted'
    title: string
    timestamp: string
  }[]
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Se erro de conexão ou sessão inválida
      if (sessionError || !session) {
        console.warn('Sessão inválida ou erro de conexão:', sessionError)
        // Retorna com estado vazio e finaliza loading
        setStats({
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalDocuments: 0,
          recentDocuments: 0,
          totalStorage: 0,
          projectsByStatus: {
            planning: 0,
            in_progress: 0,
            completed: 0,
            on_hold: 0,
          },
          documentsByCategory: [],
          recentActivity: [],
        })
        setLoading(false)
        return
      }
      const user = session.user

      // Primeiro buscar os IDs dos meus projetos
      const myProjectsResult = await supabase
        .from('projects')
        .select('id, status, created_at')
        .eq('user_id', user.id)

      if (myProjectsResult.error) {
        console.error('Erro ao buscar projetos:', myProjectsResult.error)
        throw new Error(`Erro ao buscar projetos: ${myProjectsResult.error.message}`)
      }
      const projects = myProjectsResult.data || []
      const projectIds = projects.map(p => p.id)

      // Buscar documentos
      const documentsResult = await supabase
        .from('documents')
        .select('category, file_size, created_at')
        .eq('user_id', user.id)

      if (documentsResult.error) {
        console.error('Erro ao buscar documentos:', documentsResult.error)
        throw new Error(`Erro ao buscar documentos: ${documentsResult.error.message}`)
      }

      const documents = documentsResult.data || []

      // Calcular stats de projetos
      const activeProjects = projects.filter(p => p.status === 'in_progress').length
      const completedProjects = projects.filter(p => p.status === 'completed').length

      // Calcular stats de documentos
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const recentDocuments = documents.filter(d => 
        new Date(d.created_at) >= oneWeekAgo
      ).length

      const totalStorage = documents.reduce((sum, d) => sum + (d.file_size || 0), 0)

      // Projects by status
      const projectsByStatus = {
        planning: projects.filter(p => p.status === 'planning').length,
        in_progress: projects.filter(p => p.status === 'in_progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        on_hold: projects.filter(p => p.status === 'on_hold').length,
      }

      // Documents by category
      const categoryMap = new Map<string, number>()
      documents.forEach(doc => {
        const count = categoryMap.get(doc.category) || 0
        categoryMap.set(doc.category, count + 1)
      })
      const documentsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count,
      }))

      // Recent activity (últimas 10)
      const recentActivity: DashboardStats['recentActivity'] = []

      // Buscar projetos recentes
      const recentProjects = await supabase
        .from('projects')
        .select('name, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5)

      if (recentProjects.data) {
        recentProjects.data.forEach(p => {
          recentActivity.push({
            type: 'project',
            action: new Date(p.created_at).getTime() === new Date(p.updated_at).getTime() 
              ? 'created' 
              : 'updated',
            title: p.name,
            timestamp: p.updated_at,
          })
        })
      }

      // Buscar documentos recentes
      const recentDocs = await supabase
        .from('documents')
        .select('name, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5)

      if (recentDocs.data) {
        recentDocs.data.forEach(d => {
          recentActivity.push({
            type: 'document',
            action: new Date(d.created_at).getTime() === new Date(d.updated_at).getTime() 
              ? 'created' 
              : 'updated',
            title: d.name,
            timestamp: d.updated_at,
          })
        })
      }

      // Ordenar por timestamp e pegar últimas 10
      recentActivity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      const limitedActivity = recentActivity.slice(0, 10)

      setStats({
        totalProjects: projects.length,
        activeProjects,
        completedProjects,
        totalDocuments: documents.length,
        recentDocuments,
        totalStorage,
        projectsByStatus,
        documentsByCategory,
        recentActivity: limitedActivity,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar estatísticas'
      console.error('Erro ao buscar stats:', errorMessage, err)
      setError(err instanceof Error ? err : new Error(errorMessage))
      
      // Fallback com dados vazios em caso de erro
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalDocuments: 0,
        recentDocuments: 0,
        totalStorage: 0,
        projectsByStatus: {
          planning: 0,
          in_progress: 0,
          completed: 0,
          on_hold: 0,
        },
        documentsByCategory: [],
        recentActivity: [],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Realtime subscriptions para atualizar stats
  useEffect(() => {
    let projectsChannel: ReturnType<typeof supabase.channel> | null = null
    let documentsChannel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscriptions = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const user = session.user

      projectsChannel = supabase
        .channel('dashboard-projects')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchStats()
        )
        .subscribe()

      documentsChannel = supabase
        .channel('dashboard-documents')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'documents',
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchStats()
        )
        .subscribe()
    }

    setupSubscriptions()

    return () => {
      if (projectsChannel) supabase.removeChannel(projectsChannel)
      if (documentsChannel) supabase.removeChannel(documentsChannel)
    }
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}
