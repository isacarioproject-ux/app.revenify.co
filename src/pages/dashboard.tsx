import { useState, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Eye,
  UserCheck,
  Percent,
  Plus,
  FolderOpen,
  DollarSign
} from 'lucide-react'
import { useProjects } from '@/hooks/use-projects'
import { usePageToast } from '@/hooks/use-page-toast'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { 
  MetricCard, 
  VisitorsChart, 
  LiveEventsFeed, 
  SourcesTable, 
  ConversionFunnel,
  CreateSourceDialog,
  UpgradeModal 
} from '@/components/dashboard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'
import { TOOLTIPS } from '@/lib/tooltips'
import { HeaderSkeleton, SelectSkeleton, ButtonSkeleton, MetricCardSkeleton, ChartSkeleton, CardSkeleton } from '@/components/page-skeleton'
import { useI18n } from '@/hooks/use-i18n'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { projects, loading: projectsLoading, selectedProject, setSelectedProject } = useProjects()
  const { metrics, chartData, sources, recentEvents, funnel, loading: dataLoading } = useDashboardData(selectedProject?.id || null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const hasLoadedOnce = useRef(false)

  // Toast de aviso quando não há projeto selecionado
  usePageToast(
    !selectedProject && projects.length > 0
      ? {
          id: 'select-project-warning',
          title: t('dashboard.selectProjectAlert'),
          type: 'warning',
          duration: 6000,
        }
      : null
  )

  // Marcar como carregado após primeira carga
  if (!projectsLoading && !dataLoading && !hasLoadedOnce.current) {
    hasLoadedOnce.current = true
  }

  // Só mostrar skeleton completo na primeira carga
  const showInitialSkeleton = !hasLoadedOnce.current && (projectsLoading || dataLoading)

  // Se não tem projetos, mostrar tela de setup
  if (!projectsLoading && projects.length === 0) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6">
          <Card className="max-w-2xl mx-auto text-center py-12">
            <CardContent className="space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">{t('dashboard.welcome')}</h2>
                <p className="text-muted-foreground">
                  {t('dashboard.welcomeDesc')}
                </p>
              </div>
              <Button size="lg" onClick={() => navigate('/projects')}>
                <Plus className="mr-2 h-5 w-5" />
                {t('dashboard.createFirstProject')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {showInitialSkeleton ? (
            <>
              <HeaderSkeleton />
              <div className="flex items-center gap-3">
                <SelectSkeleton />
                <ButtonSkeleton />
              </div>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
                <p className="text-muted-foreground">
                  {t('dashboard.subtitle')}
                </p>
              </div>
              <div className="flex items-center gap-3">
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
                  {selectedProject && (
                    <CreateSourceDialog 
                      projectDomain={selectedProject.domain}
                      onSourceCreated={() => {}}
                    />
                  )}
                </div>
            </>
          )}
        </div>


        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title={t('dashboard.visitors')}
            value={metrics?.totalVisitors.toLocaleString() || '0'}
            icon={Users}
            trend={metrics?.visitorsTrend ? { value: metrics.visitorsTrend, label: t('dashboard.vsPreviousPeriod') } : undefined}
            color="blue"
            loading={showInitialSkeleton}
            tooltip={TOOLTIPS.visitors}
          />
          <MetricCard
            title={t('dashboard.pageViews')}
            value={metrics?.totalPageViews.toLocaleString() || '0'}
            icon={Eye}
            color="purple"
            loading={showInitialSkeleton}
            tooltip={TOOLTIPS.pageViews}
          />
          <MetricCard
            title={t('dashboard.leads')}
            value={metrics?.totalLeads.toLocaleString() || '0'}
            icon={UserCheck}
            trend={metrics?.leadsTrend ? { value: metrics.leadsTrend, label: t('dashboard.vsPreviousPeriod') } : undefined}
            color="green"
            loading={showInitialSkeleton}
            tooltip={TOOLTIPS.leads}
          />
          <MetricCard
            title={t('dashboard.conversionRate')}
            value={`${(metrics?.conversionRate || 0).toFixed(1)}%`}
            icon={Percent}
            color="orange"
            loading={showInitialSkeleton}
            tooltip={TOOLTIPS.conversionRate}
          />
          <MetricCard
            title={t('dashboard.revenue')}
            value={`R$ ${(metrics?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            color="green"
            loading={showInitialSkeleton}
            tooltip={TOOLTIPS.revenue}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Chart */}
          <div className="lg:col-span-2">
            <VisitorsChart 
              data={chartData} 
              loading={showInitialSkeleton}
              title={t('dashboard.visitorsLast30Days')}
            />
          </div>

          {/* Conversion Funnel */}
          <div>
            {funnel && (
              <ConversionFunnel 
                data={funnel}
                loading={showInitialSkeleton}
              />
            )}
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Sources Table */}
          <SourcesTable 
            sources={sources}
            loading={showInitialSkeleton}
          />

          {/* Live Events Feed */}
          {selectedProject && (
            <LiveEventsFeed 
              projectId={selectedProject.id}
              initialEvents={recentEvents}
            />
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan="free"
        onSelectPlan={() => {
          setUpgradeOpen(false)
        }}
      />
    </DashboardLayout>
  )
}
