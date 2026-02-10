import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Globe, 
  Key, 
  Settings, 
  BarChart3,
  Code2,
  Trash2,
  Save
} from 'lucide-react'
import { getProject, updateProject, deleteProject } from '@/lib/supabase/queries'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { MetricCard, VisitorsChart, SourcesTable } from '@/components/dashboard'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Project {
  id: string
  user_id: string
  name: string
  domain: string
  project_key: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({ name: '', domain: '', is_active: true })

  const { metrics, chartData, sources, loading: dataLoading } = useDashboardData(projectId || null)

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      const data = await getProject(projectId)
      setProject(data)
      setFormData({
        name: data.name,
        domain: data.domain,
        is_active: data.is_active,
      })
    } catch (err) {
      console.error('Error loading project:', err)
      toast.error('Erro ao carregar projeto')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!projectId) return

    try {
      setSaving(true)
      await updateProject(projectId, formData)
      toast.success('Projeto atualizado!')
      loadProject()
    } catch (err) {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!projectId) return

    try {
      await deleteProject(projectId)
      toast.success('Projeto excluído!')
      navigate('/projects')
    } catch (err) {
      toast.error('Erro ao excluir projeto')
    }
  }

  const handleCopyKey = async () => {
    if (!project) return
    await navigator.clipboard.writeText(project.project_key)
    setCopied(true)
    toast.success('Chave copiada!')
    setTimeout(() => setCopied(false), 2000)
  }

  const pixelCode = project ? `<script>
  window.revenify = { projectKey: '${project.project_key}' };
</script>
<script src="https://cdn.revenify.co/pixel.js" async></script>` : ''

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </>
    )
  }

  if (!project) {
    return (
      <>
        <div className="text-center py-12">
          <p>Projeto não encontrado</p>
          <Button onClick={() => navigate('/projects')} className="mt-4">
            Voltar para Projetos
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant={project.is_active ? 'default' : 'secondary'}>
                {project.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-1">
              <Globe className="h-4 w-4" />
              {project.domain}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="pixel">
              <Code2 className="h-4 w-4 mr-2" />
              Pixel
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard
                title="Visitors"
                value={metrics?.totalVisitors.toLocaleString() || '0'}
                icon={Globe}
                color="blue"
                loading={dataLoading}
              />
              <MetricCard
                title="Page Views"
                value={metrics?.totalPageViews.toLocaleString() || '0'}
                icon={BarChart3}
                color="purple"
                loading={dataLoading}
              />
              <MetricCard
                title="Leads"
                value={metrics?.totalLeads.toLocaleString() || '0'}
                icon={Globe}
                color="green"
                loading={dataLoading}
              />
              <MetricCard
                title="Conversion"
                value={`${(metrics?.conversionRate || 0).toFixed(1)}%`}
                icon={BarChart3}
                color="orange"
                loading={dataLoading}
              />
            </div>

            {/* Chart */}
            <VisitorsChart data={chartData} loading={dataLoading} />

            {/* Sources */}
            <SourcesTable sources={sources} loading={dataLoading} />
          </TabsContent>

          {/* Pixel Tab */}
          <TabsContent value="pixel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pixel Code</CardTitle>
                <CardDescription>
                  Add this code to your site to start tracking visitors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Key</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={project.project_key} className="font-mono" />
                    <Button variant="outline" onClick={handleCopyKey}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Installation Code</Label>
                  <div className="relative">
                    <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{pixelCode}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        navigator.clipboard.writeText(pixelCode)
                        toast.success('Code copied!')
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Paste this code before the closing &lt;/head&gt; tag on your site.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verify Installation</CardTitle>
                <CardDescription>
                  Test if the pixel is working correctly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm">
                      After installing the pixel, visit your site and check if events appear on the dashboard.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => window.open(`https://${project.domain}`, '_blank')}>
                    Visit Site
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>
                  Update your project information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active Project</Label>
                    <p className="text-sm text-muted-foreground">
                      Disable to pause tracking
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-500/50">
              <CardHeader>
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All tracking data will be permanently lost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
