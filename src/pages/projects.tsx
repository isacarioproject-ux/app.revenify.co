import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/hooks/use-i18n'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Copy, Check, Globe, Key, Trash2, ExternalLink } from 'lucide-react'
import { useProjects } from '@/hooks/use-projects'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { HeaderSkeleton, ButtonSkeleton, ListSkeleton } from '@/components/page-skeleton'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { projects, loading, selectedProject, setSelectedProject, addProject, removeProject } = useProjects()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', domain: '' })
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.domain) {
      toast.error(t('projects.fillAllFields'))
      return
    }

    try {
      await addProject(newProject)
      setCreateDialogOpen(false)
      setNewProject({ name: '', domain: '' })
    } catch (err) {
      // Error handled in hook
    }
  }

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    setCopiedKey(key)
    toast.success(t('projects.keyCopied'))
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (confirm(t('projects.confirmDelete'))) {
      await removeProject(projectId)
    }
  }

  const pixelCode = (projectKey: string) => `<script>
  window.revenify = { projectKey: '${projectKey}' };
</script>
<script src="https://cdn.revenify.co/pixel.js" async></script>`

  // Loading State
  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <HeaderSkeleton />
            <ButtonSkeleton />
          </div>
          <ListSkeleton items={3} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('projects.title')}</h1>
            <p className="text-muted-foreground">{t('projects.subtitle')}</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('projects.newProject')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('projects.createNew')}</DialogTitle>
                <DialogDescription>
                  {t('projects.createNewDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('projects.projectName')}</Label>
                  <Input
                    id="name"
                    placeholder={t('projects.projectNamePlaceholder')}
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">{t('projects.domain')}</Label>
                  <Input
                    id="domain"
                    placeholder="meusite.com.br"
                    value={newProject.domain}
                    onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('projects.domainHint')}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateProject}>
                  {t('projects.createProject')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-32 bg-muted rounded" />
                  <div className="h-4 w-48 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('projects.noProjects')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('projects.noProjectsDesc')}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('projects.createProject')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card 
                key={project.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedProject?.id === project.id && 'ring-2 ring-primary'
                )}
                onClick={() => setSelectedProject(project)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {project.name}
                        <Badge variant={project.is_active ? 'default' : 'secondary'}>
                          {project.is_active ? t('projects.active') : t('projects.inactive')}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Globe className="h-3 w-3" />
                        {project.domain}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/projects/${project.id}`)
                        }}
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Project Key */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      Project Key
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={project.project_key}
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyKey(project.project_key)
                        }}
                      >
                        {copiedKey === project.project_key ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Pixel Code */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('projects.pixelCode')}</Label>
                    <div className="relative">
                      <pre className="bg-neutral-900 text-neutral-100 p-3 rounded-lg overflow-x-auto text-xs">
                        <code>{pixelCode(project.project_key)}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(pixelCode(project.project_key))
                          toast.success(t('projects.codeCopied'))
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
