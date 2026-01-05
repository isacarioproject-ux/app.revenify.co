import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Search, 
  Download, 
  Mail,
  Calendar,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { HeaderSkeleton, SelectSkeleton, ButtonSkeleton, MetricCardSkeleton, TableSkeleton } from '@/components/page-skeleton'
import { useI18n } from '@/hooks/use-i18n'

interface Lead {
  id: string
  email: string
  name?: string
  session_id: string
  created_at: string
  source?: {
    name: string
    utm_source?: string
  }
}

export default function LeadsPage() {
  const { t } = useI18n()
  const { projects, loading: projectsLoading, selectedProject, setSelectedProject } = useProjects()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const hasLoadedOnce = useRef(false)

  const isLoading = projectsLoading || loading
  
  // Marcar como carregado após primeira carga
  if (!isLoading && selectedProject && !hasLoadedOnce.current) {
    hasLoadedOnce.current = true
  }
  
  // Só mostrar skeleton na primeira carga
  const showInitialSkeleton = !hasLoadedOnce.current && isLoading

  useEffect(() => {
    if (selectedProject) {
      loadLeads()
    }
  }, [selectedProject])

  const loadLeads = async () => {
    if (!selectedProject) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          source:sources(name, utm_source)
        `)
        .eq('project_id', selectedProject.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setLeads(data || [])
    } catch (err) {
      console.error('Error loading leads:', err)
      toast.error(t('leads.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const filteredLeads = leads.filter(lead => 
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExport = () => {
    const csv = [
      ['Email', 'Nome', 'Fonte', 'Data'].join(','),
      ...filteredLeads.map(lead => [
        lead.email,
        lead.name || '',
        lead.source?.name || 'Direto',
        new Date(lead.created_at).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${selectedProject?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('leads.exported'))
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
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
          <div className="rounded-lg bg-muted/10 p-4">
            <TableSkeleton rows={6} cols={5} />
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
            <h1 className="text-2xl font-bold">{t('leads.title')}</h1>
            <p className="text-muted-foreground">{t('leads.subtitle')}</p>
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

            <Button variant="outline" onClick={handleExport} disabled={leads.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              {t('leads.exportCsv')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('leads.totalLeads')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('leads.leadsToday')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leads.filter(l => {
                  const today = new Date().toDateString()
                  return new Date(l.created_at).toDateString() === today
                }).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('leads.leadsThisWeek')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leads.filter(l => {
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return new Date(l.created_at) >= weekAgo
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle>{t('leads.leadsList')}</CardTitle>
                <CardDescription>
                  {filteredLeads.length} {t('leads.leadsFound')}
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('leads.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('leads.noLeads')}</h3>
                <p className="text-muted-foreground">
                  {t('leads.noLeadsDesc')}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('leads.email')}</TableHead>
                    <TableHead>{t('leads.name')}</TableHead>
                    <TableHead>{t('leads.source')}</TableHead>
                    <TableHead>{t('leads.date')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{lead.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.name || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {lead.source ? (
                          <Badge variant="outline">{lead.source.name}</Badge>
                        ) : (
                          <Badge variant="secondary">{t('leads.direct')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(lead.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
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
