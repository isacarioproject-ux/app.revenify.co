import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Copy, Check, Link2, ExternalLink, Trash2, DollarSign, Users, UserCheck } from 'lucide-react'
import { useProjects } from '@/hooks/use-projects'
import { getSources, createSource } from '@/lib/supabase/queries'
import { CreateSourceDialog } from '@/components/dashboard'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { HeaderSkeleton, SelectSkeleton, ButtonSkeleton, TableSkeleton } from '@/components/page-skeleton'
import { useI18n } from '@/hooks/use-i18n'

interface Source {
  id: string
  name: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  created_at: string
  total_revenue?: number
  total_payments?: number
  total_visitors?: number
  total_leads?: number
}

export default function SourcesPage() {
  const { t } = useI18n()
  const { projects, loading: projectsLoading, selectedProject, setSelectedProject } = useProjects()
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const hasLoadedOnce = useRef(false)

  // Marcar como carregado após primeira carga
  if (!projectsLoading && !loading && sources.length >= 0 && selectedProject && !hasLoadedOnce.current) {
    hasLoadedOnce.current = true
  }

  // Só mostrar skeleton na primeira carga
  const showInitialSkeleton = !hasLoadedOnce.current && (projectsLoading || loading)

  useEffect(() => {
    if (selectedProject) {
      loadSources()
    }
  }, [selectedProject])

  const loadSources = async () => {
    if (!selectedProject) return
    
    try {
      setLoading(true)
      const data = await getSources(selectedProject.id)
      setSources(data || [])
    } catch (err) {
      console.error('Error loading sources:', err)
      toast.error(t('sources.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSourceCreated = async (sourceData: any) => {
    if (!selectedProject) return

    try {
      const newSource = await createSource({
        project_id: selectedProject.id,
        name: sourceData.name,
        utm_source: sourceData.utm_source,
        utm_medium: sourceData.utm_medium,
        utm_campaign: sourceData.utm_campaign,
      })
      setSources(prev => [newSource, ...prev])
      toast.success(t('sources.created'))
    } catch (err) {
      console.error('Error creating source:', err)
      toast.error(t('sources.createError'))
    }
  }

  const generateUrl = (source: Source) => {
    if (!selectedProject) return ''
    
    const params = new URLSearchParams()
    if (source.utm_source) params.set('utm_source', source.utm_source)
    if (source.utm_medium) params.set('utm_medium', source.utm_medium)
    if (source.utm_campaign) params.set('utm_campaign', source.utm_campaign)
    
    const queryString = params.toString()
    return `https://${selectedProject.domain}${queryString ? '?' + queryString : ''}`
  }

  const handleCopyUrl = async (source: Source) => {
    const url = generateUrl(source)
    await navigator.clipboard.writeText(url)
    setCopiedId(source.id)
    toast.success(t('sources.urlCopied'))
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Loading State - só na primeira carga
  if (showInitialSkeleton) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <HeaderSkeleton />
            <div className="flex items-center gap-3">
              <SelectSkeleton />
              <ButtonSkeleton />
            </div>
          </div>
          <div className="rounded-lg bg-muted/10 p-4">
            <TableSkeleton rows={5} cols={5} />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('sources.title')}</h1>
            <p className="text-muted-foreground">{t('sources.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Project Selector */}
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
                onSourceCreated={handleSourceCreated}
              />
            )}
          </div>
        </div>

        {/* Sources Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sources.yourSources')}</CardTitle>
            <CardDescription>
              {t('sources.yourSourcesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('sources.noSources')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('sources.noSourcesDesc')}
                </p>
                {selectedProject && (
                  <CreateSourceDialog 
                    projectDomain={selectedProject.domain}
                    onSourceCreated={handleSourceCreated}
                    trigger={
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('sources.createFirst')}
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>UTM</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{t('sources.visitors')}</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <UserCheck className="h-4 w-4" />
                        <span>{t('sources.leads')}</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{t('sources.revenue')}</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(source.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {source.utm_source && (
                            <Badge variant="outline" className="text-xs">{source.utm_source}</Badge>
                          )}
                          {source.utm_medium && (
                            <Badge variant="secondary" className="text-xs">{source.utm_medium}</Badge>
                          )}
                          {source.utm_campaign && (
                            <Badge variant="default" className="text-xs">{source.utm_campaign}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {(source.total_visitors || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {(source.total_leads || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-green-600">
                          R$ {(source.total_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {(source.total_payments || 0) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {source.total_payments} {t('sources.payments')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyUrl(source)}
                            title={t('sources.copyUrl')}
                          >
                            {copiedId === source.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(generateUrl(source), '_blank')}
                            title={t('sources.openUrl')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
