import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  getDashboardMetrics, 
  getVisitorsChartData, 
  getTopSources, 
  getRecentEvents,
  getConversionFunnel,
  subscribeToEvents 
} from '@/lib/supabase/queries'

interface DashboardMetrics {
  totalVisitors: number
  totalPageViews: number
  totalLeads: number
  totalRevenue: number
  conversionRate: number
  visitorsTrend: number
  leadsTrend: number
}

interface ChartDataPoint {
  date: string
  visitors: number
}

interface Source {
  id: string
  name: string
  utm_source?: string | null
  utm_medium?: string | null
  visitors: number
  leads: number
  revenue: number
  conversion_rate: number
}

interface LiveEvent {
  id: string
  event_type: string
  created_at: string
  utm_source?: string
  country_code?: string
  page_url?: string
}

interface FunnelData {
  visitors: number
  leads: number
  customers: number
  revenue: number
}

export function useDashboardData(projectId: string | null) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [recentEvents, setRecentEvents] = useState<LiveEvent[]>([])
  const [funnel, setFunnel] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const hasLoadedOnce = useRef(false)

  // Date range (últimos 30 dias)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      // Só mostrar loading no primeiro carregamento
      if (!hasLoadedOnce.current) {
        setLoading(true)
      }
      setError(null)

      const [metricsData, chartDataResult, sourcesData, eventsData, funnelData] = await Promise.all([
        getDashboardMetrics(projectId, startDate, endDate),
        getVisitorsChartData(projectId, startDate, endDate),
        getTopSources(projectId, 5),
        getRecentEvents(projectId, 10),
        getConversionFunnel(projectId),
      ])

      setMetrics(metricsData)
      setChartData(chartDataResult)
      setSources(sourcesData)
      setRecentEvents(eventsData || [])
      setFunnel(funnelData)
      hasLoadedOnce.current = true
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time subscription
  useEffect(() => {
    if (!projectId) return

    const unsubscribe = subscribeToEvents(projectId, (newEvent) => {
      setRecentEvents(prev => [newEvent, ...prev].slice(0, 10))
      
      // Atualizar métricas se for page_view ou signup
      if (newEvent.event_type === 'page_view') {
        setMetrics(prev => prev ? {
          ...prev,
          totalPageViews: prev.totalPageViews + 1,
        } : null)
      }
    })

    return unsubscribe
  }, [projectId])

  return {
    metrics,
    chartData,
    sources,
    recentEvents,
    funnel,
    loading,
    error,
    refetch: fetchData,
  }
}
