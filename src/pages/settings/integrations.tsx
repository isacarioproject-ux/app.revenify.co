import { useState, useEffect } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  Check, 
  ExternalLink, 
  Zap,
  Key,
  Webhook,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  ArrowLeft,
  Code2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Play,
  Terminal
} from 'lucide-react'
import { useSubscription } from '@/contexts/subscription-context'
import { supabase } from '@/lib/supabase'
import { useProjects } from '@/hooks/use-projects'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HeaderSkeleton, SelectSkeleton, IntegrationCardSkeleton } from '@/components/page-skeleton'

interface Integration {
  id: string
  project_id: string
  stripe_account_id: string | null
  stripe_connected_at: string | null
  is_active: boolean
}

// Componente de Documentação da API inline
function ApiDocumentation({ onBack, apiKey }: { onBack: () => void; apiKey: string }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    toast.success('Código copiado!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const codeExamples = {
    curl: `curl -X POST https://api.revenify.co/v1/events \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "page_view",
    "visitor_id": "vis_abc123",
    "properties": {
      "page": "/pricing",
      "referrer": "google.com"
    }
  }'`,
    javascript: `import { Revenify } from '@revenify/sdk';

const revenify = new Revenify({
  apiKey: '${apiKey}'
});

// Rastrear evento
await revenify.track({
  event: 'page_view',
  visitorId: 'vis_abc123',
  properties: {
    page: '/pricing',
    referrer: 'google.com'
  }
});

// Rastrear lead
await revenify.trackLead({
  email: 'usuario@exemplo.com',
  visitorId: 'vis_abc123'
});`,
    python: `from revenify import Revenify

client = Revenify(api_key="${apiKey}")

# Rastrear evento
client.track(
    event="page_view",
    visitor_id="vis_abc123",
    properties={
        "page": "/pricing",
        "referrer": "google.com"
    }
)

# Rastrear lead
client.track_lead(
    email="usuario@exemplo.com",
    visitor_id="vis_abc123"
)`
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h2 className="text-xl font-bold">Documentação da API</h2>
          <p className="text-sm text-muted-foreground">Integre o Revenify com suas aplicações</p>
        </div>
      </div>

      {/* Introdução */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Introdução</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A API REST do Revenify permite que você integre rastreamento de atribuição em qualquer aplicação.
            Use nossa API para rastrear eventos, leads e pagamentos programaticamente.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Base URL</p>
              <code className="text-sm font-mono">https://api.revenify.co/v1</code>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Autenticação</p>
              <code className="text-sm font-mono">Bearer Token</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Endpoints</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { method: 'POST', path: '/events', desc: 'Rastrear um evento' },
              { method: 'POST', path: '/leads', desc: 'Registrar um lead' },
              { method: 'POST', path: '/payments', desc: 'Registrar um pagamento' },
              { method: 'GET', path: '/analytics', desc: 'Obter métricas' },
              { method: 'GET', path: '/sources', desc: 'Listar fontes' },
            ].map((endpoint, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'} className="font-mono text-xs w-14 justify-center">
                  {endpoint.method}
                </Badge>
                <code className="text-sm font-mono flex-1">{endpoint.path}</code>
                <span className="text-xs text-muted-foreground">{endpoint.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exemplos de Código */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Exemplos de Código</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl">
            <TabsList variant="muted" className="mb-4">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
            
            {Object.entries(codeExamples).map(([lang, code]) => (
              <TabsContent key={lang} value={lang} className="relative">
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-100 text-xs overflow-x-auto max-h-[280px]">
                    <code>{code}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-8 text-zinc-400 hover:text-zinc-100"
                    onClick={() => copyCode(code, lang)}
                  >
                    {copiedCode === lang ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Rate Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">1000</p>
              <p className="text-xs text-muted-foreground">req/minuto (Free)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">10000</p>
              <p className="text-xs text-muted-foreground">req/minuto (Pro)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">∞</p>
              <p className="text-xs text-muted-foreground">Business</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function IntegrationsPage() {
  const { t } = useI18n()
  const { projects, selectedProject, setSelectedProject, loading: projectsLoading } = useProjects()
  const { subscription } = useSubscription()
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [showApiDocs, setShowApiDocs] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  // Verificar se tem acesso à API e Webhooks (Pro+)
  const hasApiAccess = ['pro', 'business'].includes(subscription?.plan?.toLowerCase() || '')
  const hasWebhooksAccess = ['pro', 'business'].includes(subscription?.plan?.toLowerCase() || '')
  
  // Testar webhook via Edge Function
  const testWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Configure uma URL de webhook primeiro')
      return
    }
    if (!selectedProject?.id) {
      toast.error('Selecione um projeto primeiro')
      return
    }
    
    setTestingWebhook(true)
    setWebhookStatus('idle')
    
    try {
      const { data, error } = await supabase.functions.invoke('webhook-dispatcher', {
        body: { 
          webhook_url: webhookUrl,
          project_id: selectedProject.id
        }
      })

      if (error) throw error

      if (data?.success) {
        setWebhookStatus('success')
        toast.success(`Webhook testado! Resposta em ${data.response_time_ms}ms`)
      } else {
        setWebhookStatus('error')
        toast.error(data?.message || 'Falha ao testar webhook')
      }
    } catch (err) {
      console.error('Webhook test error:', err)
      setWebhookStatus('error')
      toast.error('Erro ao testar webhook')
    } finally {
      setTestingWebhook(false)
    }
  }
  
  // Salvar webhook no banco
  const saveWebhook = async () => {
    if (!webhookUrl || !selectedProject?.id) return
    
    try {
      const { error } = await supabase
        .from('webhooks')
        .upsert({
          project_id: selectedProject.id,
          url: webhookUrl,
          event_type: 'all',
          is_active: true
        }, { onConflict: 'project_id,url,event_type' })

      if (error) throw error
      toast.success('Webhook salvo com sucesso!')
    } catch (err) {
      console.error('Save webhook error:', err)
      toast.error('Erro ao salvar webhook')
    }
  }
  
  // API Key do integration (gerada no banco)
  const apiKey = integration ? `rev_${(integration as any).api_key?.slice(0, 12) || '***'}...` : ''
  const fullApiKey = (integration as any)?.api_key || ''

  useEffect(() => {
    if (selectedProject?.id) {
      loadIntegration()
    }
  }, [selectedProject?.id])

  const loadIntegration = async () => {
    if (!selectedProject?.id) return
    
    setLoading(true)
    try {
      // Tentar buscar integração existente
      let { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('project_id', selectedProject.id)
        .single()

      // Se não existe, criar uma nova com API key
      if (error && error.code === 'PGRST116') {
        const { data: newIntegration, error: createError } = await supabase
          .from('integrations')
          .insert({
            project_id: selectedProject.id,
            is_active: false
          })
          .select()
          .single()

        if (createError) throw createError
        data = newIntegration
      } else if (error) {
        throw error
      }
      
      setIntegration(data)
      
      // Carregar webhook salvo
      const { data: webhookData } = await supabase
        .from('webhooks')
        .select('url')
        .eq('project_id', selectedProject.id)
        .single()
      
      if (webhookData?.url) {
        setWebhookUrl(webhookData.url)
      }
    } catch (err) {
      console.error('Error loading integration:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    if (!selectedProject?.id) {
      toast.error('Selecione um projeto primeiro')
      return
    }

    setConnecting(true)
    try {
      // Chamar Edge Function para criar OAuth URL do Stripe Connect
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { 
          projectId: selectedProject.id,
          returnUrl: `${window.location.origin}/settings/integrations?connected=true`
        }
      })

      if (error) throw error

      // Redirecionar para Stripe Connect OAuth
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Error connecting Stripe:', err)
      toast.error('Erro ao conectar Stripe. Tente novamente.')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnectStripe = async () => {
    if (!integration?.id) return

    try {
      const { error } = await supabase
        .from('integrations')
        .update({ 
          is_active: false,
          stripe_account_id: null,
          stripe_access_token: null 
        })
        .eq('id', integration.id)

      if (error) throw error

      toast.success('Stripe desconectado')
      loadIntegration()
    } catch (err) {
      console.error('Error disconnecting:', err)
      toast.error('Erro ao desconectar')
    }
  }

  // Check for successful connection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') {
      toast.success('Stripe conectado com sucesso!')
      loadIntegration()
      // Clean URL
      window.history.replaceState({}, '', '/settings/integrations')
    }
  }, [])

  // Loading inicial
  if (projectsLoading) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <HeaderSkeleton />
            <SelectSkeleton />
          </div>
          <IntegrationCardSkeleton />
        </div>
      </DashboardLayout>
    )
  }

  // Se estiver mostrando documentação da API
  if (showApiDocs) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6 max-w-5xl mx-auto">
          <ApiDocumentation onBack={() => setShowApiDocs(false)} apiKey={fullApiKey} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full p-4 md:p-6 max-w-5xl mx-auto">
        {/* Header compacto */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('integrations.title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('integrations.description')}
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
              <SelectValue placeholder="Selecione um projeto" />
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

        {/* Tabs principais */}
        <Tabs defaultValue="stripe" className="w-full">
          <TabsList variant="default" className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="stripe" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Stripe</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="h-4 w-4" />
              <span className="hidden sm:inline">Webhooks</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Stripe */}
          <TabsContent value="stripe" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#635BFF]/10">
                      <CreditCard className="h-6 w-6 text-[#635BFF]" />
                    </div>
                    <div>
                      <CardTitle>{t('integrations.stripe.title')}</CardTitle>
                      <CardDescription>{t('integrations.stripe.description')}</CardDescription>
                    </div>
                  </div>
                  {integration?.is_active ? (
                    <Badge className="bg-green-600 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {t('integrations.stripe.connected')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      {t('integrations.stripe.disconnected')}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : integration?.is_active ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Account ID</p>
                        <code className="text-sm font-mono">{integration.stripe_account_id}</code>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">{t('integrations.stripe.connectedAt')}</p>
                        <p className="text-sm font-medium">
                          {integration.stripe_connected_at 
                            ? new Date(integration.stripe_connected_at).toLocaleDateString('pt-BR')
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {t('integrations.stripe.dashboard')}
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDisconnectStripe}>
                        {t('integrations.stripe.disconnect')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: Zap, text: t('integrations.stripe.feature1') },
                        { icon: Zap, text: t('integrations.stripe.feature2') },
                        { icon: Zap, text: t('integrations.stripe.feature3') },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
                          <item.icon className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs">{item.text}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={handleConnectStripe}
                      disabled={connecting || !selectedProject}
                      className="bg-[#635BFF] hover:bg-[#5851DB] w-full sm:w-auto"
                    >
                      {connecting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('integrations.stripe.connecting')}</>
                      ) : (
                        <><CreditCard className="h-4 w-4 mr-2" />{t('integrations.stripe.connect')}</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Como funciona */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('integrations.stripe.howItWorks')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {[
                    { num: '1', title: t('integrations.stripe.step1'), desc: t('integrations.stripe.step1Desc') },
                    { num: '2', title: t('integrations.stripe.step2'), desc: t('integrations.stripe.step2Desc') },
                    { num: '3', title: t('integrations.stripe.step3'), desc: t('integrations.stripe.step3Desc') },
                  ].map((step) => (
                    <div key={step.num} className="flex-1 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                        {step.num}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{step.title}</p>
                        <p className="text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab API */}
          <TabsContent value="api" className="space-y-4">
            <Card className={!hasApiAccess ? 'opacity-60' : ''}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10">
                      <Key className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle>{t('integrations.api.title')}</CardTitle>
                      <CardDescription>{t('integrations.api.description')}</CardDescription>
                    </div>
                  </div>
                  {hasApiAccess ? (
                    <Badge className="bg-emerald-600">{t('common.available')}</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Pro+
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasApiAccess ? (
                  <>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Input 
                            type={showApiKey ? 'text' : 'password'}
                            value={showApiKey ? fullApiKey : apiKey}
                            readOnly
                            className="pr-20 font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-1 top-1 h-7"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(fullApiKey)
                            toast.success(t('integrations.api.keyCopied'))
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" onClick={() => setShowApiDocs(true)}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        {t('integrations.api.viewDocs')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('integrations.api.proRequired')}
                    </p>
                    <Button size="sm" asChild>
                      <a href="/pricing">{t('integrations.api.upgrade')}</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Webhooks */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card className={!hasWebhooksAccess ? 'opacity-60' : ''}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-orange-500/10">
                      <Webhook className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle>{t('integrations.webhooks.title')}</CardTitle>
                      <CardDescription>{t('integrations.webhooks.description')}</CardDescription>
                    </div>
                  </div>
                  {hasWebhooksAccess ? (
                    webhookStatus === 'success' ? (
                      <Badge className="bg-green-600 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('common.working')}
                      </Badge>
                    ) : webhookStatus === 'error' ? (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        {t('common.error')}
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-600">{t('common.available')}</Badge>
                    )
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Pro+
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasWebhooksAccess ? (
                  <>
                    <div className="space-y-2">
                      <Label>{t('integrations.webhooks.url')}</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder={t('integrations.webhooks.urlPlaceholder')}
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={saveWebhook}
                          disabled={!webhookUrl}
                        >
                          {t('integrations.webhooks.save')}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={testWebhook}
                        disabled={testingWebhook || !webhookUrl}
                      >
                        {testingWebhook ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('integrations.webhooks.testing')}</>
                        ) : (
                          <><Play className="h-4 w-4 mr-2" />{t('integrations.webhooks.test')}</>
                        )}
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-2">{t('integrations.webhooks.events')}:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { event: 'event.created', desc: 'Novo evento' },
                          { event: 'lead.created', desc: 'Novo lead' },
                          { event: 'revenue.attributed', desc: 'Receita atribuída' },
                          { event: 'limit.reached', desc: 'Limite atingido' },
                        ].map((item) => (
                          <div key={item.event} className="flex items-center gap-2 text-xs">
                            <code className="px-1.5 py-0.5 rounded bg-muted">{item.event}</code>
                            <span className="text-muted-foreground">{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('integrations.api.proRequired')}
                    </p>
                    <Button size="sm" asChild>
                      <a href="/pricing">{t('integrations.api.upgrade')}</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
