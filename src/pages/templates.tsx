import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Copy, Trash2, FileText, Check, ExternalLink } from 'lucide-react'
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
import { CreateTemplateDialog } from '@/components/create-template-dialog'
import { HeaderSkeleton, SelectSkeleton, ButtonSkeleton, ListSkeleton } from '@/components/page-skeleton'
import { useI18n } from '@/hooks/use-i18n'

interface Template {
  id: string
  name: string
  description: string | null
  utm_source: string
  utm_medium: string
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
  times_used: number
  created_at: string
}

export default function TemplatesPage() {
  const { t } = useI18n()
  const { projects, selectedProject, setSelectedProject, loading: projectsLoading } = useProjects()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true) // Inicia como true
  const [baseUrl, setBaseUrl] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const hasLoadedTemplates = useRef(false)

  // Só mostrar skeleton enquanto não carregou templates pela primeira vez
  const showInitialSkeleton = !hasLoadedTemplates.current && (projectsLoading || loading)

  useEffect(() => {
    if (selectedProject) {
      setBaseUrl(`https://${selectedProject.domain}`)
      loadTemplates()
    } else if (!projectsLoading) {
      // Se não há projeto selecionado e já terminou de carregar projetos, parar loading
      setLoading(false)
    }
  }, [selectedProject, projectsLoading])

  const loadTemplates = async () => {
    if (!selectedProject) return
    
    // Só mostrar loading se ainda não carregou uma vez
    if (!hasLoadedTemplates.current) {
      setLoading(true)
    }
    try {
      const { data, error } = await supabase
        .from('utm_templates')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
      hasLoadedTemplates.current = true
    } catch (err) {
      console.error('Error loading templates:', err)
      toast.error(t('templates.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const generateUrl = (template: Template) => {
    let url = baseUrl || 'https://seusite.com'
    url += url.includes('?') ? '&' : '?'
    url += `utm_source=${encodeURIComponent(template.utm_source)}`
    url += `&utm_medium=${encodeURIComponent(template.utm_medium)}`
    if (template.utm_campaign) url += `&utm_campaign=${encodeURIComponent(template.utm_campaign)}`
    if (template.utm_term) url += `&utm_term=${encodeURIComponent(template.utm_term)}`
    if (template.utm_content) url += `&utm_content=${encodeURIComponent(template.utm_content)}`
    return url
  }

  const copyUrl = async (template: Template) => {
    const url = generateUrl(template)
    await navigator.clipboard.writeText(url)
    setCopiedId(template.id)
    toast.success(t('templates.urlCopied'))
    setTimeout(() => setCopiedId(null), 2000)

    // Incrementar times_used
    await supabase
      .from('utm_templates')
      .update({ times_used: template.times_used + 1, last_used_at: new Date().toISOString() })
      .eq('id', template.id)
  }

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('utm_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success(t('templates.deleted'))
    } catch (err) {
      console.error('Error deleting template:', err)
      toast.error(t('templates.deleteError'))
    }
  }

  const handleCreateTemplate = async (data: Partial<Template>) => {
    if (!selectedProject) return

    try {
      const { data: newTemplate, error } = await supabase
        .from('utm_templates')
        .insert({
          project_id: selectedProject.id,
          ...data,
        })
        .select()
        .single()

      if (error) throw error
      setTemplates(prev => [newTemplate, ...prev])
      toast.success(t('templates.created'))
      setDialogOpen(false)
    } catch (err) {
      console.error('Error creating template:', err)
      toast.error(t('templates.createError'))
    }
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
          <ListSkeleton items={4} />
        </div>
      </DashboardLayout>
    )
  }

  // No Project State
  if (!selectedProject) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center max-w-md">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {t('templates.noProject')}
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t('templates.noProjectDesc')}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Empty State
  if (templates.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center max-w-md">
            {/* Icon Circle */}
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
              <FileText className="h-12 w-12 text-primary" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-3">
              {t('templates.noTemplates')}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t('templates.noTemplatesDesc')}
            </p>

            {/* CTA */}
            <Button size="lg" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('templates.createFirst')}
            </Button>

            {/* Feature list */}
            <div className="mt-8 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{t('templates.feature1')}</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{t('templates.feature2')}</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{t('templates.feature3')}</span>
              </div>
            </div>
          </div>

          <CreateTemplateDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onCreate={handleCreateTemplate}
          />
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
            <h1 className="text-2xl font-bold">{t('templates.title')}</h1>
            <p className="text-muted-foreground">
              {t('templates.subtitle')}
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
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('templates.createTemplate')}
            </Button>
          </div>
        </div>

        {/* URL Generator */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">
                {t('templates.baseUrl')}
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://seusite.com"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('templates.baseUrlHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* UTM Parameters */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {template.utm_source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">/</span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {template.utm_medium}
                      </Badge>
                    </div>
                    {template.utm_campaign && (
                      <div className="text-xs text-muted-foreground">
                        {t('templates.campaign')}: <span className="font-mono">{template.utm_campaign}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => copyUrl(template)}
                    >
                      {copiedId === template.id ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {t('templates.copyUrl')}
                    </Button>
                    {template.times_used > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {template.times_used}× {t('templates.used')}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <CreateTemplateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreate={handleCreateTemplate}
        />
      </div>
    </DashboardLayout>
  )
}
