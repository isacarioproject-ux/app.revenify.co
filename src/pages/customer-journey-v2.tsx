import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  MousePointer, 
  UserPlus, 
  CreditCard, 
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
  Download,
  Filter,
  ChevronDown,
  Eye,
  Mail,
  DollarSign,
  Clock,
  MapPin,
  Chrome,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  ArrowRight
} from 'lucide-react'
import { useProjects } from '@/hooks/use-projects'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/hooks/use-i18n'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Types
interface Touchpoint {
  id: string
  visitor_id: string
  session_id: string
  touchpoint_type: string
  page_url: string
  referrer: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  country_code: string | null
  city: string | null
  created_at: string
}

interface Lead {
  id: string
  email: string
  name: string | null
  created_at: string
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  customer_email: string | null
  created_at: string
}

interface JourneyData {
  visitor_id: string
  first_seen: string
  last_seen: string
  touchpoints: Touchpoint[]
  events_count: number
  lead: Lead | null
  payments: Payment[]
  total_revenue: number
  first_source: {
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
  }
  devices: string[]
  countries: string[]
}

interface JourneyStats {
  total_visitors: number
  total_leads: number
  total_customers: number
  total_revenue: number
  avg_touchpoints: number
  conversion_rate: number
}

export default function CustomerJourneyPage() {
  const { t } = useI18n()
  const { projects, selectedProject, setSelectedProject, loading: projectsLoading } = useProjects()
  
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [journeys, setJourneys] = useState<JourneyData[]>([])
  const [stats, setStats] = useState<JourneyStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedJourney, setSelectedJourney] = useState<JourneyData | null>(null)
  const [dateFilter, setDateFilter] = useState('30d')
  const [statusFilter, setStatusFilter] = useState<'all' | 'visitors' | 'leads' | 'customers'>('all')
  const [activeTab, setActiveTab] = useState('timeline')

  // Fetch journeys
  const fetchJourneys = useCallback(async () => {
    if (!selectedProject?.id) return

    setLoading(true)
    try {
      // Calculate date range
      const now = new Date()
      let startDate = new Date()
      switch (dateFilter) {
        case '7d': startDate.setDate(now.getDate() - 7); break
        case '30d': startDate.setDate(now.getDate() - 30); break
        case '90d': startDate.setDate(now.getDate() - 90); break
        default: startDate.setDate(now.getDate() - 30)
      }

      // Build query based on search
      let visitorIds: string[] = []

      if (searchQuery) {
        if (searchQuery.includes('@')) {
          // Search by email
          const { data: leads } = await supabase
            .from('leads')
            .select('session_id')
            .eq('project_id', selectedProject.id)
            .ilike('email', `%${searchQuery}%`)
            .limit(20)

          if (leads?.length) {
            const { data: events } = await supabase
              .from('events')
              .select('visitor_id')
              .eq('project_id', selectedProject.id)
              .in('session_id', leads.map(l => l.session_id))
              .not('visitor_id', 'is', null)

            visitorIds = [...new Set(events?.map(e => e.visitor_id) || [])]
          }
        } else {
          // Search by visitor_id
          visitorIds = [searchQuery]
        }
      } else {
        // Get recent visitors with touchpoints
        const { data: recentEvents } = await supabase
          .from('events')
          .select('visitor_id')
          .eq('project_id', selectedProject.id)
          .not('visitor_id', 'is', null)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(100)

        visitorIds = [...new Set(recentEvents?.map(e => e.visitor_id) || [])].slice(0, 20)
      }

      // Fetch complete journey data for each visitor
      const journeyPromises = visitorIds.map(async (visitorId) => {
        // Get all events for this visitor
        const { data: events } = await supabase
          .from('events')
          .select('*')
          .eq('project_id', selectedProject.id)
          .eq('visitor_id', visitorId)
          .order('created_at', { ascending: true })

        if (!events?.length) return null

        // Get session IDs
        const sessionIds = [...new Set(events.map(e => e.session_id))]

        // Get lead if exists
        const { data: leadData } = await supabase
          .from('leads')
          .select('*')
          .eq('project_id', selectedProject.id)
          .in('session_id', sessionIds)
          .limit(1)
          .maybeSingle()

        // Get payments
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('project_id', selectedProject.id)
          .eq('visitor_id', visitorId)
          .order('created_at', { ascending: true })

        const payments = paymentsData || []
        const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

        // Build touchpoints from events
        const touchpoints: Touchpoint[] = events.map(e => ({
          id: e.id,
          visitor_id: e.visitor_id,
          session_id: e.session_id,
          touchpoint_type: e.event_type,
          page_url: e.page_url || '',
          referrer: e.referrer || '',
          utm_source: e.utm_source,
          utm_medium: e.utm_medium,
          utm_campaign: e.utm_campaign,
          utm_term: e.utm_term,
          utm_content: e.utm_content,
          device_type: e.device_type,
          browser: e.browser,
          os: e.os,
          country_code: e.country_code,
          city: e.city,
          created_at: e.created_at
        }))

        // Get unique devices and countries
        const devices = [...new Set(events.map(e => e.device_type).filter(Boolean))]
        const countries = [...new Set(events.map(e => e.country_code).filter(Boolean))]

        // First source attribution
        const firstEvent = events[0]
        const firstSource = {
          utm_source: firstEvent?.utm_source || null,
          utm_medium: firstEvent?.utm_medium || null,
          utm_campaign: firstEvent?.utm_campaign || null
        }

        return {
          visitor_id: visitorId,
          first_seen: events[0]?.created_at || '',
          last_seen: events[events.length - 1]?.created_at || '',
          touchpoints,
          events_count: events.length,
          lead: leadData || null,
          payments,
          total_revenue: totalRevenue,
          first_source: firstSource,
          devices,
          countries
        } as JourneyData
      })

      const results = (await Promise.all(journeyPromises)).filter(Boolean) as JourneyData[]

      // Apply status filter
      let filteredResults = results
      if (statusFilter === 'visitors') {
        filteredResults = results.filter(j => !j.lead && j.payments.length === 0)
      } else if (statusFilter === 'leads') {
        filteredResults = results.filter(j => j.lead && j.payments.length === 0)
      } else if (statusFilter === 'customers') {
        filteredResults = results.filter(j => j.payments.length > 0)
      }

      setJourneys(filteredResults)

      // Calculate stats
      const totalVisitors = results.length
      const totalLeads = results.filter(j => j.lead).length
      const totalCustomers = results.filter(j => j.payments.length > 0).length
      const totalRevenue = results.reduce((sum, j) => sum + j.total_revenue, 0)
      const avgTouchpoints = results.length > 0 
        ? results.reduce((sum, j) => sum + j.touchpoints.length, 0) / results.length 
        : 0

      setStats({
        total_visitors: totalVisitors,
        total_leads: totalLeads,
        total_customers: totalCustomers,
        total_revenue: totalRevenue,
        avg_touchpoints: Math.round(avgTouchpoints * 10) / 10,
        conversion_rate: totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0
      })

      if (filteredResults.length === 0) {
        toast.info('Nenhuma jornada encontrada')
      }
    } catch (err) {
      console.error('Error fetching journeys:', err)
      toast.error('Erro ao buscar jornadas')
    } finally {
      setLoading(false)
    }
  }, [selectedProject?.id, searchQuery, dateFilter, statusFilter])

  useEffect(() => {
    if (selectedProject?.id) {
      fetchJourneys()
    }
  }, [selectedProject?.id, dateFilter, statusFilter])

  // Export to CSV
  const exportToCSV = () => {
    if (!journeys.length) {
      toast.error(t('journey.noDataToExport'))
      return
    }

    const headers = ['Visitor ID', 'Email', 'First Source', 'Touchpoints', 'Revenue', 'First Seen', 'Last Seen']
    const rows = journeys.map(j => [
      j.visitor_id,
      j.lead?.email || '',
      j.first_source.utm_source || 'direct',
      j.touchpoints.length,
      j.total_revenue,
      j.first_seen,
      j.last_seen
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customer-journeys-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('journey.exportSuccess'))
  }

  // Helpers
  const getDeviceIcon = (device: string | null) => {
    switch (device?.toLowerCase()) {
      case 'mobile': return Smartphone
      case 'tablet': return Tablet
      default: return Monitor
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'page_view': return Eye
      case 'session_start': return Globe
      case 'signup': return UserPlus
      case 'purchase': return CreditCard
      default: return MousePointer
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'page_view': return 'bg-blue-500/10 text-blue-500'
      case 'session_start': return 'bg-purple-500/10 text-purple-500'
      case 'signup': return 'bg-green-500/10 text-green-500'
      case 'purchase': return 'bg-emerald-500/10 text-emerald-500'
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  const formatRelativeDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
  }

  const getStatusBadge = (journey: JourneyData) => {
    if (journey.payments.length > 0) {
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t('journey.customers')}</Badge>
    }
    if (journey.lead) {
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t('journey.leads')}</Badge>
    }
    return <Badge variant="outline">{t('journey.visitors')}</Badge>
  }

  return (
    <>
      <div className="w-full p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('journey.title')}</h1>
            <p className="text-muted-foreground">
              {t('journey.subtitle')}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select 
              value={selectedProject?.id || ''} 
              onValueChange={(value) => {
                const project = projects.find(p => p.id === value)
                if (project) setSelectedProject(project)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('dashboard.selectProject')} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{t('journey.last7Days')}</SelectItem>
                <SelectItem value="30d">{t('journey.last30Days')}</SelectItem>
                <SelectItem value="90d">{t('journey.last90Days')}</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={fetchJourneys} loading={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              {t('journey.export')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_visitors}</p>
                    <p className="text-xs text-muted-foreground">{t('journey.visitors')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <UserPlus className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_leads}</p>
                    <p className="text-xs text-muted-foreground">{t('journey.leads')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CreditCard className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_customers}</p>
                    <p className="text-xs text-muted-foreground">{t('journey.customers')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">{t('journey.conversionRate')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <DollarSign className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ {stats.total_revenue.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">{t('journey.totalRevenue')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('journey.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchJourneys()}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('journey.allStatus')}</SelectItem>
                    <SelectItem value="visitors">{t('journey.visitors')}</SelectItem>
                    <SelectItem value="leads">{t('journey.leads')}</SelectItem>
                    <SelectItem value="customers">{t('journey.customers')}</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={fetchJourneys} loading={loading}>
                  {t('common.search')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Journeys List */}
          <div className="lg:col-span-1 space-y-2">
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                {journeys.length} {t('journey.journeysFound')}
              </h3>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              <AnimatePresence>
                {journeys.map((journey, index) => (
                  <motion.div
                    key={journey.visitor_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        selectedJourney?.visitor_id === journey.visitor_id 
                          ? 'border-primary bg-primary/5' 
                          : ''
                      }`}
                      onClick={() => setSelectedJourney(journey)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {journey.lead?.email || `${t('journey.anonymous')} ${journey.visitor_id.slice(0, 8)}...`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {journey.touchpoints.length} {t('journey.events')}
                              </span>
                              {journey.first_source.utm_source && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                  {journey.first_source.utm_source}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatRelativeDate(journey.last_seen)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(journey)}
                            {journey.total_revenue > 0 && (
                              <span className="text-xs font-medium text-emerald-500">
                                R$ {journey.total_revenue.toLocaleString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {journeys.length === 0 && !loading && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t('journey.noJourneys')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Journey Detail */}
          <div className="lg:col-span-2">
            {selectedJourney ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {selectedJourney.lead?.email || t('journey.anonymous')}
                        {getStatusBadge(selectedJourney)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        ID: {selectedJourney.visitor_id}
                      </CardDescription>
                    </div>
                    {selectedJourney.total_revenue > 0 && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-500">
                          R$ {selectedJourney.total_revenue.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('journey.totalRevenue')}</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-lg font-bold">{selectedJourney.touchpoints.length}</p>
                      <p className="text-xs text-muted-foreground">{t('journey.events')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{selectedJourney.payments.length}</p>
                      <p className="text-xs text-muted-foreground">{t('journey.payments')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{selectedJourney.devices.length}</p>
                      <p className="text-xs text-muted-foreground">{t('journey.devices')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{selectedJourney.countries.length}</p>
                      <p className="text-xs text-muted-foreground">{t('journey.countries')}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="timeline">{t('journey.timeline')}</TabsTrigger>
                      <TabsTrigger value="attribution">{t('journey.attribution')}</TabsTrigger>
                      <TabsTrigger value="details">{t('journey.details')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline" className="mt-0">
                      <div className="relative space-y-0 max-h-[400px] overflow-y-auto pr-2">
                        {/* Touchpoints */}
                        {selectedJourney.touchpoints.map((tp, index) => {
                          const EventIcon = getEventIcon(tp.touchpoint_type)
                          return (
                            <div key={tp.id} className="flex gap-4 pb-4">
                              <div className="flex flex-col items-center">
                                <div className={`p-2 rounded-full ${getEventColor(tp.touchpoint_type)}`}>
                                  <EventIcon className="h-4 w-4" />
                                </div>
                                {index < selectedJourney.touchpoints.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-border mt-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm capitalize">
                                    {tp.touchpoint_type.replace('_', ' ')}
                                  </span>
                                  {tp.utm_source && (
                                    <Badge variant="outline" className="text-xs">
                                      {tp.utm_source}
                                    </Badge>
                                  )}
                                  {tp.utm_campaign && (
                                    <Badge variant="secondary" className="text-xs">
                                      {tp.utm_campaign}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(tp.created_at)}
                                </p>
                                {tp.page_url && (
                                  <p className="text-xs text-muted-foreground truncate mt-1 max-w-md">
                                    {tp.page_url}
                                  </p>
                                )}
                                {(tp.device_type || tp.country_code) && (
                                  <div className="flex items-center gap-2 mt-1">
                                    {tp.device_type && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        {tp.device_type === 'mobile' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                                        {tp.device_type}
                                      </span>
                                    )}
                                    {tp.country_code && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {tp.country_code}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {/* Lead Conversion */}
                        {selectedJourney.lead && (
                          <div className="flex gap-4 pb-4">
                            <div className="flex flex-col items-center">
                              <div className="p-2 rounded-full bg-green-500/10">
                                <Mail className="h-4 w-4 text-green-500" />
                              </div>
                              {selectedJourney.payments.length > 0 && (
                                <div className="w-0.5 flex-1 bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-sm text-green-500">
                                Converteu para Lead
                              </span>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(selectedJourney.lead.created_at)}
                              </p>
                              <p className="text-sm mt-1">{selectedJourney.lead.email}</p>
                            </div>
                          </div>
                        )}

                        {/* Payments */}
                        {selectedJourney.payments.map((payment, index) => (
                          <div key={payment.id} className="flex gap-4 pb-4">
                            <div className="flex flex-col items-center">
                              <div className="p-2 rounded-full bg-emerald-500/10">
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                              </div>
                              {index < selectedJourney.payments.length - 1 && (
                                <div className="w-0.5 flex-1 bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-emerald-500">
                                  Pagamento
                                </span>
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                  R$ {Number(payment.amount).toLocaleString('pt-BR')}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(payment.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="attribution" className="mt-0">
                      <div className="space-y-4">
                        {/* Multi-Touch Attribution Models */}
                        {(() => {
                          // Calculate attribution for each touchpoint
                          const touchpointsWithSource = selectedJourney.touchpoints.filter(
                            tp => tp.utm_source || tp.referrer
                          )
                          const uniqueSources = [...new Map(
                            touchpointsWithSource.map(tp => {
                              let source = 'direct'
                              if (tp.utm_source) {
                                source = tp.utm_source
                              } else if (tp.referrer) {
                                try {
                                  source = new URL(tp.referrer).hostname
                                } catch {
                                  source = tp.referrer
                                }
                              }
                              return [source, tp]
                            })
                          ).entries()]

                          const totalRevenue = selectedJourney.total_revenue
                          const touchpointCount = Math.max(uniqueSources.length, 1)

                          // First-Touch: 100% to first
                          const firstTouch = selectedJourney.first_source

                          // Last-Touch: 100% to last with UTM
                          const lastTouchpoint = [...touchpointsWithSource].reverse()[0]
                          const lastTouch = lastTouchpoint ? {
                            utm_source: lastTouchpoint.utm_source || (lastTouchpoint.referrer ? (() => {
                              try {
                                return new URL(lastTouchpoint.referrer).hostname
                              } catch {
                                return lastTouchpoint.referrer
                              }
                            })() : null),
                            utm_medium: lastTouchpoint.utm_medium,
                            utm_campaign: lastTouchpoint.utm_campaign
                          } : firstTouch

                          // Linear: Equal distribution
                          const linearAttribution = uniqueSources.map(([source, tp]) => ({
                            source,
                            medium: tp.utm_medium || '-',
                            campaign: tp.utm_campaign || '-',
                            percentage: 100 / touchpointCount,
                            revenue: totalRevenue / touchpointCount
                          }))

                          // Time-Decay: More weight to recent touchpoints
                          const timeDecayAttribution = uniqueSources.map(([source, tp], index) => {
                            const weight = Math.pow(2, index) // Exponential weight
                            const totalWeight = uniqueSources.reduce((sum, _, i) => sum + Math.pow(2, i), 0)
                            const percentage = (weight / totalWeight) * 100
                            return {
                              source,
                              medium: tp.utm_medium || '-',
                              campaign: tp.utm_campaign || '-',
                              percentage,
                              revenue: (percentage / 100) * totalRevenue
                            }
                          })

                          return (
                            <>
                              {/* First-Touch */}
                              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-blue-600">{t('journey.firstTouch')}</h4>
                                  <Badge variant="outline" className="text-blue-600 border-blue-300">100%</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">{t('journey.source')}</p>
                                    <p className="font-medium">{firstTouch.utm_source || 'Direct'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">{t('journey.medium')}</p>
                                    <p className="font-medium">{firstTouch.utm_medium || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">{t('journey.campaign')}</p>
                                    <p className="font-medium">{firstTouch.utm_campaign || '-'}</p>
                                  </div>
                                </div>
                                {totalRevenue > 0 && (
                                  <p className="text-sm text-blue-600 mt-2 font-medium">
                                    R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                )}
                              </div>

                              {/* Last-Touch */}
                              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-purple-600">{t('journey.lastTouch')}</h4>
                                  <Badge variant="outline" className="text-purple-600 border-purple-300">100%</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">{t('journey.source')}</p>
                                    <p className="font-medium">{lastTouch.utm_source || 'Direct'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">{t('journey.medium')}</p>
                                    <p className="font-medium">{lastTouch.utm_medium || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">{t('journey.campaign')}</p>
                                    <p className="font-medium">{lastTouch.utm_campaign || '-'}</p>
                                  </div>
                                </div>
                                {totalRevenue > 0 && (
                                  <p className="text-sm text-purple-600 mt-2 font-medium">
                                    R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                )}
                              </div>

                              {/* Linear Attribution */}
                              {linearAttribution.length > 1 && (
                                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-amber-600">{t('journey.linear')}</h4>
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">{t('journey.linearEqual')}</Badge>
                                  </div>
                                  <div className="space-y-2">
                                    {linearAttribution.map((attr, i) => (
                                      <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                                          <span>{attr.source}</span>
                                          <span className="text-muted-foreground">/ {attr.medium}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-muted-foreground">{attr.percentage.toFixed(1)}%</span>
                                          {totalRevenue > 0 && (
                                            <span className="font-medium text-amber-600">
                                              R$ {attr.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Time-Decay Attribution */}
                              {timeDecayAttribution.length > 1 && (
                                <div className="p-4 rounded-lg bg-teal-500/5 border border-teal-500/20">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-teal-600">{t('journey.timeDecay')}</h4>
                                    <Badge variant="outline" className="text-teal-600 border-teal-300">{t('journey.timeDecayRecent')}</Badge>
                                  </div>
                                  <div className="space-y-2">
                                    {timeDecayAttribution.map((attr, i) => (
                                      <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-teal-500" />
                                          <span>{attr.source}</span>
                                          <span className="text-muted-foreground">/ {attr.medium}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-muted-foreground">{attr.percentage.toFixed(1)}%</span>
                                          {totalRevenue > 0 && (
                                            <span className="font-medium text-teal-600">
                                              R$ {attr.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Revenue Summary */}
                              {totalRevenue > 0 && (
                                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                  <h4 className="font-medium mb-2 text-emerald-600">{t('journey.totalRevenue')}</h4>
                                  <p className="text-3xl font-bold text-emerald-600">
                                    R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {selectedJourney.payments.length} pagamento(s) • {touchpointCount} touchpoint(s)
                                  </p>
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </TabsContent>

                    <TabsContent value="details" className="mt-0">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">{t('journey.firstVisit')}</p>
                            <p className="font-medium">{formatDate(selectedJourney.first_seen)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">{t('journey.lastActivity')}</p>
                            <p className="font-medium">{formatDate(selectedJourney.last_seen)}</p>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-2">{t('journey.devices')}</p>
                          <div className="flex gap-2">
                            {selectedJourney.devices.map((device, i) => {
                              const DeviceIcon = getDeviceIcon(device)
                              return (
                                <Badge key={i} variant="outline" className="flex items-center gap-1">
                                  <DeviceIcon className="h-3 w-3" />
                                  {device}
                                </Badge>
                              )
                            })}
                            {selectedJourney.devices.length === 0 && (
                              <span className="text-sm text-muted-foreground">{t('journey.notIdentified')}</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-2">{t('journey.countries')}</p>
                          <div className="flex gap-2">
                            {selectedJourney.countries.map((country, i) => (
                              <Badge key={i} variant="outline">
                                {country}
                              </Badge>
                            ))}
                            {selectedJourney.countries.length === 0 && (
                              <span className="text-sm text-muted-foreground">{t('journey.notIdentified')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <MousePointer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">{t('journey.selectJourney')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('journey.selectJourneyDesc')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
