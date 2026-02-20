import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  Users,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Calendar,
  Download,
  Loader2
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useProjects } from '@/hooks/use-projects'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { VisitorsChart } from '@/components/dashboard'
import { getDeviceAnalytics, getCountryAnalytics, getBrowserAnalytics } from '@/lib/supabase/queries'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HeaderSkeleton, SelectSkeleton, ButtonSkeleton, ChartSkeleton, CardSkeleton } from '@/components/page-skeleton'
import { useI18n } from '@/hooks/use-i18n'

interface DeviceData {
  name: string
  value: number
}

interface CountryData {
  code: string
  name: string
  value: number
}

interface BrowserData {
  name: string
  value: number
}

export default function AnalyticsPage() {
  const { t } = useI18n()
  const { projects, loading: projectsLoading, selectedProject, setSelectedProject } = useProjects()
  const { metrics, chartData, sources, loading: dataLoading } = useDashboardData(selectedProject?.id || null)
  const [dateRange, setDateRange] = useState('30d')

  // Analytics data from database
  const [deviceData, setDeviceData] = useState<DeviceData[]>([])
  const [countryData, setCountryData] = useState<CountryData[]>([])
  const [browserData, setBrowserData] = useState<BrowserData[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const hasLoadedOnce = useRef(false)

  const loading = projectsLoading || dataLoading

  // Marcar como carregado após primeira carga
  if (!loading && !analyticsLoading && selectedProject && !hasLoadedOnce.current) {
    hasLoadedOnce.current = true
  }

  // Só mostrar skeleton na primeira carga
  const showInitialSkeleton = !hasLoadedOnce.current && loading

  // Calculate date range - memoized to avoid stale closures
  const getDateRange = useCallback(() => {
    const end = new Date()
    const start = new Date()
    switch (dateRange) {
      case '7d':
        start.setDate(start.getDate() - 7)
        break
      case '30d':
        start.setDate(start.getDate() - 30)
        break
      case '90d':
        start.setDate(start.getDate() - 90)
        break
    }
    return { start, end }
  }, [dateRange])

  // Fetch analytics data when project or date range changes
  // IMPORTANT: All hooks must be called before any conditional returns
  useEffect(() => {
    async function fetchAnalytics() {
      if (!selectedProject?.id) return

      setAnalyticsLoading(true)
      try {
        const { start } = getDateRange()
        const [devices, countries, browsers] = await Promise.all([
          getDeviceAnalytics(selectedProject.id, start.toISOString()),
          getCountryAnalytics(selectedProject.id, start.toISOString()),
          getBrowserAnalytics(selectedProject.id, start.toISOString()),
        ])

        setDeviceData(devices)
        setCountryData(countries)
        setBrowserData(browsers)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setAnalyticsLoading(false)
      }
    }

    fetchAnalytics()
  }, [selectedProject?.id, dateRange])

  // Loading State - só na primeira carga
  if (showInitialSkeleton) {
    return (
      <>
        <div className="w-full p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <HeaderSkeleton />
            <div className="flex items-center gap-3">
              <SelectSkeleton />
              <SelectSkeleton />
              <ButtonSkeleton />
            </div>
          </div>
          <ChartSkeleton />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton lines={5} />
            <CardSkeleton lines={5} />
            <CardSkeleton lines={5} />
          </div>
        </div>
      </>
    )
  }

  // Export analytics data
  const handleExport = () => {
    const { start, end } = getDateRange()

    const csv = [
      '# Relatório Analytics - Revenify',
      `Projeto: ${selectedProject?.name || 'N/A'}`,
      `Período: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      '',
      '# Métricas',
      `Visitantes,${metrics?.totalVisitors || 0}`,
      `Leads,${metrics?.totalLeads || 0}`,
      `Taxa de Conversão,${metrics?.conversionRate || 0}%`,
      '',
      '# Dispositivos',
      'Dispositivo,Porcentagem',
      ...deviceData.map(d => `${d.name},${d.value}%`),
      '',
      '# Países',
      'País,Porcentagem',
      ...countryData.map(c => `${c.name},${c.value}%`),
      '',
      '# Navegadores',
      'Navegador,Porcentagem',
      ...browserData.map(b => `${b.name},${b.value}%`),
      '',
      '# Fontes',
      'Fonte,Visitantes,Conversão',
      ...sources.map(s => `${s.name},${s.visitors},${s.conversion_rate}%`)
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${selectedProject?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const deviceIcons: Record<string, typeof Monitor> = {
    Desktop: Monitor,
    Mobile: Smartphone,
    Tablet: Tablet,
  }

  return (
    <>
      <div className="w-full p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
            <p className="text-muted-foreground">{t('analytics.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {/* Date Range */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[120px] md:w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{t('analytics.last7Days')}</SelectItem>
                <SelectItem value="30d">{t('analytics.last30Days')}</SelectItem>
                <SelectItem value="90d">{t('analytics.last90Days')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Project Selector */}
            <Select
              value={selectedProject?.id || ''}
              onValueChange={(value) => {
                const project = projects.find(p => p.id === value)
                if (project) setSelectedProject(project)
              }}
            >
              <SelectTrigger className="w-[140px] md:w-[200px]">
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

            {/* Export Button - Icon only on mobile */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleExport} disabled={!selectedProject} className="md:hidden">
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('common.export')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" onClick={handleExport} disabled={!selectedProject} className="hidden md:flex">
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
          </div>
        </div>

        {/* Chart */}
        <VisitorsChart
          data={chartData}
          loading={loading}
          title={t('analytics.visitorsOverTime')}
        />

        {/* Analytics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Devices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('analytics.devices')}</CardTitle>
              <CardDescription>{t('analytics.devicesDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : deviceData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('analytics.noDeviceData')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deviceData.map((device) => {
                    const Icon = deviceIcons[device.name] || Monitor
                    return (
                      <div key={device.name} className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{device.name}</span>
                            <span className="text-sm text-muted-foreground">{device.value}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${device.value}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t('analytics.countries')}
              </CardTitle>
              <CardDescription>{t('analytics.countriesDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : countryData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('analytics.noCountryData')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {countryData.map((country) => (
                    <div key={country.code} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCountryFlag(country.code)}</span>
                        <span className="text-sm">{country.name}</span>
                      </div>
                      <Badge variant="secondary">{country.value}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Browsers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('analytics.browsers')}</CardTitle>
              <CardDescription>{t('analytics.browsersDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : browserData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('analytics.noBrowserData')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {browserData.map((browser, index) => (
                    <div key={browser.name} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{browser.name}</span>
                          <span className="text-sm text-muted-foreground">{browser.value}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Sources */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.topSources')}</CardTitle>
            <CardDescription>{t('analytics.topSourcesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('analytics.noSourceData')}</p>
                <p className="text-sm">{t('analytics.addUtmParams')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sources.map((source, index) => (
                  <div key={source.id} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{source.name}</span>
                        {source.utm_source && (
                          <Badge variant="outline" className="text-xs">
                            {source.utm_source}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {source.visitors.toLocaleString()} {t('analytics.visitors')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {source.conversion_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Helper function para flags de países
function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    BR: '🇧🇷',
    PT: '🇵🇹',
    US: '🇺🇸',
    XX: '🌍',
  }
  return flags[code] || '🌍'
}
