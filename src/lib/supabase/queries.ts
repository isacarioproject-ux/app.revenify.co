// src/lib/supabase/queries.ts
import { supabase } from '@/lib/supabase'

// ===================================
// PROJECTS
// ===================================

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getProject(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data
}

export async function createProject(project: {
  name: string
  domain: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Gerar project_key único
  const projectKey = `pk_live_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: project.name,
      domain: project.domain,
      project_key: projectKey,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProject(projectId: string, updates: {
  name?: string
  domain?: string
  is_active?: boolean
}) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) throw error
}

// ===================================
// REAL-TIME SUBSCRIPTIONS
// ===================================

export function subscribeToEvents(
  projectId: string,
  callback: (event: any) => void
) {
  const channel = supabase
    .channel('events-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ===================================
// DASHBOARD METRICS
// ===================================

export async function getDashboardMetrics(
  projectId: string,
  startDate: Date,
  endDate: Date
) {
  // Total visitors (unique sessions)
  const { count: totalVisitors } = await supabase
    .from('events')
    .select('session_id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('event_type', 'session_start')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  // Total page views
  const { count: totalPageViews } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('event_type', 'page_view')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  // Total leads
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  // Total revenue
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('amount')
    .eq('project_id', projectId)
    .eq('status', 'succeeded')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  const totalRevenue = paymentsData?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0

  // Previous period (para calcular trends)
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const prevStartDate = new Date(startDate)
  prevStartDate.setDate(prevStartDate.getDate() - daysDiff)
  const prevEndDate = new Date(startDate)

  const { count: prevVisitors } = await supabase
    .from('events')
    .select('session_id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('event_type', 'session_start')
    .gte('created_at', prevStartDate.toISOString())
    .lte('created_at', prevEndDate.toISOString())

  const { count: prevLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('created_at', prevStartDate.toISOString())
    .lte('created_at', prevEndDate.toISOString())

  // Calculate trends
  const visitorsTrend = prevVisitors ? (((totalVisitors || 0) - prevVisitors) / prevVisitors) * 100 : 0
  const leadsTrend = prevLeads ? (((totalLeads || 0) - prevLeads) / prevLeads) * 100 : 0

  return {
    totalVisitors: totalVisitors || 0,
    totalPageViews: totalPageViews || 0,
    totalLeads: totalLeads || 0,
    totalRevenue,
    conversionRate: totalVisitors ? ((totalLeads || 0) / totalVisitors) * 100 : 0,
    visitorsTrend: Math.round(visitorsTrend * 10) / 10,
    leadsTrend: Math.round(leadsTrend * 10) / 10,
  }
}

// ===================================
// CHART DATA
// ===================================

export async function getVisitorsChartData(
  projectId: string,
  startDate: Date,
  endDate: Date
) {
  const { data, error } = await supabase
    .from('events')
    .select('created_at')
    .eq('project_id', projectId)
    .eq('event_type', 'page_view')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error

  // Agrupar por dia
  const dayGroups = new Map<string, number>()

  data?.forEach(event => {
    const date = new Date(event.created_at)
    const dayKey = date.toISOString().split('T')[0]
    dayGroups.set(dayKey, (dayGroups.get(dayKey) || 0) + 1)
  })

  // Converter para array
  const chartData = Array.from(dayGroups.entries()).map(([date, count]) => ({
    date,
    visitors: count,
  }))

  return chartData
}

// ===================================
// TOP SOURCES
// ===================================

export async function getTopSources(projectId: string, limit = 5) {
  const { data, error } = await supabase
    .from('events')
    .select('utm_source, utm_medium')
    .eq('project_id', projectId)
    .not('utm_source', 'is', null)

  if (error) throw error

  // Agrupar por source
  const sourceGroups = new Map<string, { visitors: number; utm_medium: string | null }>()

  data?.forEach(event => {
    const source = event.utm_source || 'direct'
    const current = sourceGroups.get(source) || { visitors: 0, utm_medium: event.utm_medium }
    sourceGroups.set(source, {
      visitors: current.visitors + 1,
      utm_medium: event.utm_medium,
    })
  })

  // Converter e ordenar
  const sources = Array.from(sourceGroups.entries())
    .map(([name, data], index) => ({
      id: `source-${index}`,
      name,
      utm_source: name,
      utm_medium: data.utm_medium,
      visitors: data.visitors,
      leads: 0,
      revenue: 0,
      conversion_rate: 0,
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, limit)

  return sources
}

// ===================================
// RECENT EVENTS
// ===================================

export async function getRecentEvents(projectId: string, limit = 10) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// ===================================
// CONVERSION FUNNEL
// ===================================

export async function getConversionFunnel(projectId: string) {
  // Visitors (unique sessions)
  const { count: visitors } = await supabase
    .from('events')
    .select('session_id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('event_type', 'session_start')

  // Leads
  const { count: leads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  return {
    visitors: visitors || 0,
    leads: leads || 0,
    customers: 0, // TODO: implementar quando tiver tabela de customers
    revenue: 0,
  }
}

// ===================================
// SOURCES CRUD
// ===================================

export async function createSource(source: {
  project_id: string
  name: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}) {
  const { data, error } = await supabase
    .from('sources')
    .insert(source)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSources(projectId: string) {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ===================================
// ANALYTICS - DEVICE, COUNTRY, BROWSER
// ===================================

export async function getDeviceAnalytics(projectId: string, startDate?: string) {
  let query = supabase
    .from('events')
    .select('device_type')
    .eq('project_id', projectId)
    .not('device_type', 'is', null)
  
  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  const { data, error } = await query

  if (error) throw error

  // Contar por tipo de dispositivo
  const counts: Record<string, number> = {}
  let total = 0
  
  data?.forEach(event => {
    const device = event.device_type || 'desktop'
    counts[device] = (counts[device] || 0) + 1
    total++
  })

  if (total === 0) {
    return [
      { name: 'Desktop', value: 0 },
      { name: 'Mobile', value: 0 },
      { name: 'Tablet', value: 0 },
    ]
  }

  return [
    { name: 'Desktop', value: Math.round((counts['desktop'] || 0) / total * 100) },
    { name: 'Mobile', value: Math.round((counts['mobile'] || 0) / total * 100) },
    { name: 'Tablet', value: Math.round((counts['tablet'] || 0) / total * 100) },
  ]
}

export async function getCountryAnalytics(projectId: string, startDate?: string) {
  let query = supabase
    .from('events')
    .select('country_code')
    .eq('project_id', projectId)
    .not('country_code', 'is', null)
  
  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  const { data, error } = await query

  if (error) throw error

  // Contar por país
  const counts: Record<string, number> = {}
  let total = 0
  
  data?.forEach(event => {
    const country = event.country_code || 'XX'
    counts[country] = (counts[country] || 0) + 1
    total++
  })

  if (total === 0) {
    return []
  }

  // Ordenar e pegar top 5
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({
      code,
      name: getCountryName(code),
      value: Math.round(count / total * 100),
    }))

  return sorted
}

export async function getBrowserAnalytics(projectId: string, startDate?: string) {
  let query = supabase
    .from('events')
    .select('browser')
    .eq('project_id', projectId)
    .not('browser', 'is', null)
  
  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  const { data, error } = await query

  if (error) throw error

  // Contar por navegador
  const counts: Record<string, number> = {}
  let total = 0
  
  data?.forEach(event => {
    const browser = event.browser || 'Unknown'
    counts[browser] = (counts[browser] || 0) + 1
    total++
  })

  if (total === 0) {
    return []
  }

  // Ordenar e pegar top 5
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      value: Math.round(count / total * 100),
    }))

  return sorted
}

function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    BR: 'Brasil',
    US: 'Estados Unidos',
    PT: 'Portugal',
    ES: 'Espanha',
    AR: 'Argentina',
    MX: 'México',
    CO: 'Colômbia',
    CL: 'Chile',
    PE: 'Peru',
    GB: 'Reino Unido',
    DE: 'Alemanha',
    FR: 'França',
    IT: 'Itália',
    CA: 'Canadá',
    AU: 'Austrália',
    XX: 'Desconhecido',
  }
  return countries[code] || code
}

// ===================================
// SUBSCRIPTION
// ===================================

export async function getSubscription() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}

export async function updateSubscription(updates: {
  plan?: string
  max_monthly_events?: number
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}
