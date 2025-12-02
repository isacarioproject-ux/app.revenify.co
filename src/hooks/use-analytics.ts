import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type TimePeriod = '7d' | '30d' | '90d' | '1y' | 'all'

interface TimeSeriesData {
  date: string
  projects: number
  documents: number
  members: number
}

interface MonthlyComparison {
  current: {
    projects: number
    documents: number
    members: number
    storage: number
  }
  previous: {
    projects: number
    documents: number
    members: number
    storage: number
  }
  growth: {
    projects: number
    documents: number
    members: number
    storage: number
  }
}

interface ActivityByDay {
  day: string
  count: number
}

interface CategoryBreakdown {
  category: string
  count: number
  percentage: number
}

export interface AnalyticsData {
  timeSeries: TimeSeriesData[]
  monthlyComparison: MonthlyComparison
  activityByDay: ActivityByDay[]
  projectsByStatus: CategoryBreakdown[]
  documentsByCategory: CategoryBreakdown[]
  completionRate: number
  avgProjectDuration: number
  mostActiveDay: string
  totalActivities: number
}

interface UseAnalyticsReturn {
  analytics: AnalyticsData | null
  loading: boolean
  error: Error | null
  period: TimePeriod
  setPeriod: (period: TimePeriod) => void
  exportData: (format: 'csv' | 'json') => void
  refetch: () => Promise<void>
}

// Helper function para calcular duração média de projetos
const calculateAverageProjectDuration = (projects: any[]): number => {
  if (!projects || projects.length === 0) return 0;
  
  const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'done');
  if (completedProjects.length === 0) return 0;
  
  const totalDuration = completedProjects.reduce((sum, project) => {
    const createdAt = new Date(project.created_at);
    const updatedAt = new Date(project.updated_at);
    const durationInDays = Math.floor((updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return sum + durationInDays;
  }, 0);
  
  return Math.round(totalDuration / completedProjects.length);
};

export function useAnalytics(): UseAnalyticsReturn {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [period, setPeriod] = useState<TimePeriod>('30d')

  const getPeriodDates = (period: TimePeriod) => {
    const end = new Date()
    const start = new Date()

    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7)
        break
      case '30d':
        start.setDate(start.getDate() - 30)
        break
      case '90d':
        start.setDate(start.getDate() - 90)
        break
      case '1y':
        start.setFullYear(start.getFullYear() - 1)
        break
      case 'all':
        start.setFullYear(2020, 0, 1) // Jan 1, 2020
        break
    }

    return { start, end }
  }

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { start, end } = getPeriodDates(period)

      // Buscar dados do período
      const [projectsResult, documentsResult, teamMembersResult] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, status, created_at, updated_at')
          .eq('user_id', user.id)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: true }),

        supabase
          .from('documents')
          .select('id, name, category, file_size, created_at')
          .eq('user_id', user.id)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: true }),

        supabase
          .from('workspace_members')
          .select('id, status, joined_at, created_at')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: true }),
      ])

      if (projectsResult.error) throw projectsResult.error
      if (documentsResult.error) throw documentsResult.error

      const projects = projectsResult.data || []
      const documents = documentsResult.data || []
      const members = teamMembersResult.data || []

      // Buscar dados do mês anterior para comparação
      const currentMonthStart = new Date()
      currentMonthStart.setDate(1)
      currentMonthStart.setHours(0, 0, 0, 0)

      const previousMonthStart = new Date(currentMonthStart)
      previousMonthStart.setMonth(previousMonthStart.getMonth() - 1)

      const previousMonthEnd = new Date(currentMonthStart)
      previousMonthEnd.setDate(previousMonthEnd.getDate() - 1)

      const [currentMonthProjects, currentMonthDocs, prevMonthProjects, prevMonthDocs] = await Promise.all([
        supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', currentMonthStart.toISOString()),

        supabase
          .from('documents')
          .select('id, file_size')
          .eq('user_id', user.id)
          .gte('created_at', currentMonthStart.toISOString()),

        supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', previousMonthStart.toISOString())
          .lt('created_at', currentMonthStart.toISOString()),

        supabase
          .from('documents')
          .select('id, file_size')
          .eq('user_id', user.id)
          .gte('created_at', previousMonthStart.toISOString())
          .lt('created_at', currentMonthStart.toISOString()),
      ])

      // Time series data (agrupado por dia)
      const dayMap = new Map<string, { projects: number; documents: number; members: number }>()
      
      projects.forEach(p => {
        const date = new Date(p.created_at).toLocaleDateString('pt-BR')
        const existing = dayMap.get(date) || { projects: 0, documents: 0, members: 0 }
        dayMap.set(date, { ...existing, projects: existing.projects + 1 })
      })

      documents.forEach(d => {
        const date = new Date(d.created_at).toLocaleDateString('pt-BR')
        const existing = dayMap.get(date) || { projects: 0, documents: 0, members: 0 }
        dayMap.set(date, { ...existing, documents: existing.documents + 1 })
      })

      members.forEach(m => {
        const date = new Date(m.created_at).toLocaleDateString('pt-BR')
        const existing = dayMap.get(date) || { projects: 0, documents: 0, members: 0 }
        dayMap.set(date, { ...existing, members: existing.members + 1 })
      })

      const timeSeries = Array.from(dayMap.entries())
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.date.split('/').reverse().join('-'))
          const dateB = new Date(b.date.split('/').reverse().join('-'))
          return dateA.getTime() - dateB.getTime()
        })

      // Monthly comparison
      const currentStorage = currentMonthDocs.data?.reduce((sum, d) => sum + (d.file_size || 0), 0) || 0
      const prevStorage = prevMonthDocs.data?.reduce((sum, d) => sum + (d.file_size || 0), 0) || 0

      const monthlyComparison: MonthlyComparison = {
        current: {
          projects: currentMonthProjects.data?.length || 0,
          documents: currentMonthDocs.data?.length || 0,
          members: 0,
          storage: currentStorage,
        },
        previous: {
          projects: prevMonthProjects.data?.length || 0,
          documents: prevMonthDocs.data?.length || 0,
          members: 0,
          storage: prevStorage,
        },
        growth: {
          projects: 0,
          documents: 0,
          members: 0,
          storage: 0,
        },
      }

      // Calcular crescimento percentual
      monthlyComparison.growth.projects = monthlyComparison.previous.projects > 0
        ? ((monthlyComparison.current.projects - monthlyComparison.previous.projects) / monthlyComparison.previous.projects) * 100
        : monthlyComparison.current.projects > 0 ? 100 : 0

      monthlyComparison.growth.documents = monthlyComparison.previous.documents > 0
        ? ((monthlyComparison.current.documents - monthlyComparison.previous.documents) / monthlyComparison.previous.documents) * 100
        : monthlyComparison.current.documents > 0 ? 100 : 0

      monthlyComparison.growth.storage = monthlyComparison.previous.storage > 0
        ? ((monthlyComparison.current.storage - monthlyComparison.previous.storage) / monthlyComparison.previous.storage) * 100
        : monthlyComparison.current.storage > 0 ? 100 : 0

      // Activity by day of week
      const dayOfWeekMap = new Map<string, number>()
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

      ;[...projects, ...documents].forEach(item => {
        const dayIndex = new Date(item.created_at).getDay()
        const dayName = dayNames[dayIndex]
        dayOfWeekMap.set(dayName, (dayOfWeekMap.get(dayName) || 0) + 1)
      })

      const activityByDay = dayNames.map(day => ({
        day,
        count: dayOfWeekMap.get(day) || 0,
      }))

      // Projects by status
      const statusMap = new Map<string, number>()
      projects.forEach(p => {
        statusMap.set(p.status, (statusMap.get(p.status) || 0) + 1)
      })

      const totalProjects = projects.length
      const projectsByStatus = Array.from(statusMap.entries()).map(([category, count]) => ({
        category,
        count,
        percentage: totalProjects > 0 ? (count / totalProjects) * 100 : 0,
      }))

      // Documents by category
      const categoryMap = new Map<string, number>()
      documents.forEach(d => {
        categoryMap.set(d.category, (categoryMap.get(d.category) || 0) + 1)
      })

      const totalDocuments = documents.length
      const documentsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count,
        percentage: totalDocuments > 0 ? (count / totalDocuments) * 100 : 0,
      }))

      // Completion rate
      const completedProjects = projects.filter(p => p.status === 'completed').length
      const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0

      // Most active day
      const maxDay = activityByDay.reduce((max, day) => day.count > max.count ? day : max, activityByDay[0])
      const mostActiveDay = maxDay?.day || 'N/A'

      setAnalytics({
        timeSeries,
        monthlyComparison,
        activityByDay,
        projectsByStatus,
        documentsByCategory,
        completionRate,
        avgProjectDuration: calculateAverageProjectDuration(projects),
        mostActiveDay,
        totalActivities: projects.length + documents.length,
      })
    } catch (err) {
      console.error('Erro ao buscar analytics:', err)
      setError(err instanceof Error ? err : new Error('Erro ao buscar analytics'))
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const exportData = (format: 'csv' | 'json') => {
    if (!analytics) return

    if (format === 'json') {
      const dataStr = JSON.stringify(analytics, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      // CSV da time series
      const headers = ['Data,Projetos,Documentos,Membros']
      const rows = analytics.timeSeries.map(d => 
        `${d.date},${d.projects},${d.documents},${d.members}`
      )
      const csv = [headers, ...rows].join('\n')
      const dataBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  return {
    analytics,
    loading,
    error,
    period,
    setPeriod,
    exportData,
    refetch: fetchAnalytics,
  }
}
