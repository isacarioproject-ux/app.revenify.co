import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  MousePointer,
  UserPlus,
  CreditCard,
  ArrowRight,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  ExternalLink
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
import { HeaderSkeleton, SelectSkeleton, CardSkeleton, ListSkeleton } from '@/components/page-skeleton'
import { useI18n } from '@/hooks/use-i18n'

interface Touchpoint {
  id: string
  visitor_id: string
  session_id: string
  touchpoint_type: string
  page_url: string
  referrer: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  created_at: string
  source?: {
    name: string
  }
}

interface Lead {
  id: string
  email: string
  name: string
  created_at: string
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
}

interface JourneyData {
  visitor_id: string
  touchpoints: Touchpoint[]
  lead: Lead | null
  payments: Payment[]
  total_revenue: number
}

export default function CustomerJourneyPage() {
  const { t, locale } = useI18n()
  const { projects, selectedProject, setSelectedProject, loading: projectsLoading } = useProjects()
  const [searchQuery, setSearchQuery] = useState('')
  const [journeys, setJourneys] = useState<JourneyData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedJourney, setSelectedJourney] = useState<JourneyData | null>(null)
  const hasLoadedOnce = useRef(false)

  const isLoading = projectsLoading || loading

  // Marcar como carregado após primeira carga
  if (!isLoading && selectedProject && !hasLoadedOnce.current) {
    hasLoadedOnce.current = true
  }

  // Só mostrar skeleton na primeira carga
  const showInitialSkeleton = !hasLoadedOnce.current && isLoading

  const searchJourneys = async () => {
    if (!selectedProject?.id) {
      toast.error(t('dashboard.selectProjectAlert'))
      return
    }

    setLoading(true)
    try {
      // Buscar por email ou visitor_id
      let visitorIds: string[] = []

      if (searchQuery.includes('@')) {
        // Buscar lead por email
        const { data: leads } = await supabase
          .from('leads')
          .select('session_id')
          .eq('project_id', selectedProject.id)
          .ilike('email', `%${searchQuery}%`)
          .limit(10)

        if (leads?.length) {
          // Buscar visitor_id dos eventos dessas sessões
          const { data: events } = await supabase
            .from('events')
            .select('visitor_id')
            .eq('project_id', selectedProject.id)
            .in('session_id', leads.map(l => l.session_id))
            .not('visitor_id', 'is', null)

          visitorIds = [...new Set(events?.map(e => e.visitor_id) || [])]
        }
      } else if (searchQuery) {
        // Buscar direto por visitor_id
        visitorIds = [searchQuery]
      } else {
        // Buscar últimos 10 visitors com touchpoints
        const { data: recentTouchpoints } = await supabase
          .from('touchpoints')
          .select('visitor_id')
          .eq('project_id', selectedProject.id)
          .order('created_at', { ascending: false })
          .limit(50)

        visitorIds = [...new Set(recentTouchpoints?.map(t => t.visitor_id) || [])].slice(0, 10)
      }

      // Buscar dados completos de cada visitor
      const journeyPromises = visitorIds.map(async (visitorId) => {
        const [touchpointsRes, leadsRes, paymentsRes] = await Promise.all([
          supabase
            .from('touchpoints')
            .select('*, source:sources(name)')
            .eq('project_id', selectedProject.id)
            .eq('visitor_id', visitorId)
            .order('created_at', { ascending: true }),
          supabase
            .from('leads')
            .select('*')
            .eq('project_id', selectedProject.id)
            .in('session_id', (await supabase
              .from('events')
              .select('session_id')
              .eq('project_id', selectedProject.id)
              .eq('visitor_id', visitorId)
            ).data?.map(e => e.session_id) || [])
            .limit(1)
            .single(),
          supabase
            .from('payments')
            .select('*')
            .eq('project_id', selectedProject.id)
            .eq('visitor_id', visitorId)
            .order('created_at', { ascending: true })
        ])

        const payments = paymentsRes.data || []
        const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)

        return {
          visitor_id: visitorId,
          touchpoints: touchpointsRes.data || [],
          lead: leadsRes.data || null,
          payments,
          total_revenue: totalRevenue
        }
      })

      const results = await Promise.all(journeyPromises)
      setJourneys(results.filter(j => j.touchpoints.length > 0))

      if (results.length === 0) {
        toast.info(t('journey.noJourneys'))
      }
    } catch (err) {
      console.error('Error searching journeys:', err)
      toast.error(t('journey.searchError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedProject?.id) {
      searchJourneys()
    }
  }, [selectedProject?.id])


  const formatDate = (date: string) => {
    const localeMap: Record<string, string> = { 'pt-BR': 'pt-BR', 'en': 'en-US', 'es': 'es-ES' }
    return new Date(date).toLocaleString(localeMap[locale] || 'en-US', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return Monitor
    if (userAgent.toLowerCase().includes('mobile')) return Smartphone
    return Monitor
  }

  // Loading State - só na primeira carga
  if (showInitialSkeleton) {
    return (
      <>
        <div className="w-full p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <HeaderSkeleton />
            <SelectSkeleton />
          </div>
          <CardSkeleton lines={2} />
          <ListSkeleton items={4} />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="w-full p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('journey.title')}</h1>
            <p className="text-muted-foreground">
              {t('journey.subtitle')}
            </p>
          </div>

          <Select
            value={selectedProject?.id || ''}
            onValueChange={(value) => {
              const project = projects.find(p => p.id === value)
              if (project) setSelectedProject(project)
            }}
          >
            <SelectTrigger className="w-[200px]">
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
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('journey.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchJourneys()}
                  className="pl-9"
                />
              </div>
              <Button onClick={searchJourneys} loading={loading}>
                {loading ? t('journey.searching') : t('journey.search')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Journeys List */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* List */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground px-1">
              {journeys.length} {t('journey.journeysFound')}
            </h3>
            {journeys.map((journey) => (
              <Card
                key={journey.visitor_id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedJourney?.visitor_id === journey.visitor_id ? 'border-primary' : ''
                  }`}
                onClick={() => setSelectedJourney(journey)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {journey.lead?.email || journey.visitor_id.slice(0, 20) + '...'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {journey.touchpoints.length} {t('journey.touchpoints').toLowerCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      {journey.total_revenue > 0 ? (
                        <Badge variant="default" className="bg-green-600">
                          R$ {journey.total_revenue.toLocaleString('pt-BR')}
                        </Badge>
                      ) : journey.lead ? (
                        <Badge variant="secondary">Lead</Badge>
                      ) : (
                        <Badge variant="outline">{t('journey.visitor')}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Journey Detail */}
          <div className="lg:col-span-2">
            {selectedJourney ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedJourney.lead?.email || t('journey.anonymousVisitor')}
                  </CardTitle>
                  <CardDescription>
                    ID: {selectedJourney.visitor_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Timeline */}
                  <div className="relative space-y-0">
                    {/* Touchpoints */}
                    {selectedJourney.touchpoints.map((tp, index) => (
                      <div key={tp.id} className="flex gap-4 pb-6">
                        <div className="flex flex-col items-center">
                          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                            <MousePointer className="h-4 w-4 text-blue-600" />
                          </div>
                          {index < selectedJourney.touchpoints.length - 1 && (
                            <div className="w-0.5 flex-1 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{t('journey.visit')}</span>
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
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {tp.page_url}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Lead Conversion */}
                    {selectedJourney.lead && (
                      <div className="flex gap-4 pb-6">
                        <div className="flex flex-col items-center">
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                            <UserPlus className="h-4 w-4 text-green-600" />
                          </div>
                          {selectedJourney.payments.length > 0 && (
                            <div className="w-0.5 flex-1 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-sm text-green-600">
                            {t('journey.convertedToLead')}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(selectedJourney.lead.created_at)}
                          </p>
                          <p className="text-sm mt-1">
                            {selectedJourney.lead.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Payments */}
                    {selectedJourney.payments.map((payment, index) => (
                      <div key={payment.id} className="flex gap-4 pb-6">
                        <div className="flex flex-col items-center">
                          <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                            <CreditCard className="h-4 w-4 text-emerald-600" />
                          </div>
                          {index < selectedJourney.payments.length - 1 && (
                            <div className="w-0.5 flex-1 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-emerald-600">
                              {t('journey.payment')}
                            </span>
                            <Badge variant="default" className="bg-emerald-600">
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

                  {/* Summary */}
                  <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{selectedJourney.touchpoints.length}</p>
                      <p className="text-xs text-muted-foreground">{t('journey.touchpoints')}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{selectedJourney.payments.length}</p>
                      <p className="text-xs text-muted-foreground">{t('journey.payments')}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {selectedJourney.total_revenue.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('journey.totalRevenue')}</p>
                    </div>
                  </div>
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
