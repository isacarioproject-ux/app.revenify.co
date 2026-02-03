import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  Check, 
  ExternalLink, 
  Zap,
  Key,
  Webhook,
  Copy,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  Code2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Play,
  Terminal,
  CreditCard
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
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
import { Skeleton } from '@/components/ui/skeleton'

interface Integration {
  id: string
  project_id: string
  stripe_account_id: string | null
  stripe_connected_at: string | null
  is_active: boolean
}

// Componente de Documentação da API inline
function ApiDocumentation({ onBack, apiKey }: { onBack: () => void; apiKey: string }) {
  const { t } = useI18n()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    toast.success(t('integrations.apiDocs.codeCopied'))
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
          {t('integrations.apiDocs.back')}
        </Button>
        <div>
          <h2 className="text-xl font-bold">{t('integrations.apiDocs.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('integrations.apiDocs.subtitle')}</p>
        </div>
      </div>

      {/* Introdução */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('integrations.apiDocs.introduction')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('integrations.apiDocs.introText')}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">{t('integrations.apiDocs.baseUrl')}</p>
              <code className="text-sm font-mono">https://api.revenify.co/v1</code>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">{t('integrations.apiDocs.authentication')}</p>
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
            <CardTitle className="text-lg">{t('integrations.apiDocs.endpoints')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { method: 'POST', path: '/events', desc: t('integrations.apiDocs.trackEvent') },
              { method: 'POST', path: '/leads', desc: t('integrations.apiDocs.registerLead') },
              { method: 'POST', path: '/payments', desc: t('integrations.apiDocs.registerPayment') },
              { method: 'GET', path: '/analytics', desc: t('integrations.apiDocs.getMetrics') },
              { method: 'GET', path: '/sources', desc: t('integrations.apiDocs.listSources') },
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
            <CardTitle className="text-lg">{t('integrations.apiDocs.codeExamples')}</CardTitle>
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
          <CardTitle className="text-lg">{t('integrations.apiDocs.rateLimits')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">1000</p>
              <p className="text-xs text-muted-foreground">{t('integrations.apiDocs.rateLimitFree')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">10000</p>
              <p className="text-xs text-muted-foreground">{t('integrations.apiDocs.rateLimitPro')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">∞</p>
              <p className="text-xs text-muted-foreground">{t('integrations.apiDocs.rateLimitBusiness')}</p>
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
      toast.error(t('integrations.configureWebhookFirst'))
      return
    }
    if (!selectedProject?.id) {
      toast.error(t('integrations.selectProjectFirst'))
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
        toast.success(t('integrations.webhookTested').replace('{time}', data.response_time_ms))
      } else {
        setWebhookStatus('error')
        toast.error(data?.message || t('integrations.webhookTestFailed'))
      }
    } catch (err) {
      console.error('Webhook test error:', err)
      setWebhookStatus('error')
      toast.error(t('integrations.webhookTestError'))
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
      toast.success(t('integrations.webhookSaved'))
    } catch (err) {
      console.error('Save webhook error:', err)
      toast.error(t('integrations.webhookSaveError'))
    }
  }
  
  // API Key do integration (gerada no banco)
  const apiKey = integration ? `rev_${(integration as any).api_key?.slice(0, 12) || '***'}...` : ''
  const fullApiKey = (integration as any)?.api_key || ''

  const loadIntegration = useCallback(async () => {
    if (!selectedProject?.id) return
    
    setLoading(true)
    try {
      // Tentar buscar integração existente
      let { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('project_id', selectedProject.id)
        .maybeSingle()

      // Se não existe, criar uma nova com API key
      if (!data && !error) {
        const { data: newIntegration, error: createError } = await supabase
          .from('integrations')
          .insert({
            project_id: selectedProject.id,
            is_active: false
          })
          .select()
          .single()

        if (!createError) {
          data = newIntegration
        }
      }
      
      if (data) {
        setIntegration(data)
      }
      
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
  }, [selectedProject?.id])

  useEffect(() => {
    if (selectedProject?.id) {
      loadIntegration()
    }
  }, [selectedProject?.id, loadIntegration])

  const handleConnectStripe = async () => {
    if (!selectedProject?.id) {
      toast.error(t('integrations.selectProjectFirst'))
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
      toast.error(t('integrations.stripeConnectError'))
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

      toast.success(t('integrations.stripeDisconnected'))
      loadIntegration()
    } catch (err) {
      console.error('Error disconnecting:', err)
      toast.error(t('integrations.stripeDisconnectError'))
    }
  }

  // Check for successful connection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') {
      toast.success(t('integrations.stripeConnected'))
      loadIntegration()
      // Clean URL
      window.history.replaceState({}, '', '/settings/integrations')
    }
  }, [loadIntegration, t])

  // Loading inicial
  if (projectsLoading) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <HeaderSkeleton />
            <SelectSkeleton />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-8 w-28 bg-muted/30" />
            <Skeleton className="h-8 w-20 bg-muted/30" />
            <Skeleton className="h-8 w-24 bg-muted/30" />
          </div>
          <IntegrationCardSkeleton />
          <IntegrationCardSkeleton />
        </div>
      </DashboardLayout>
    )
  }

  // Se estiver mostrando documentação da API
  if (showApiDocs) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6">
          <ApiDocumentation onBack={() => setShowApiDocs(false)} apiKey={fullApiKey} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full p-4 md:p-6 space-y-6">
        {/* Header compacto */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('integrations.title')}</h1>
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
              <SelectValue placeholder={t('integrations.selectProjectPlaceholder')} />
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

        {/* Tabs */}
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="h-auto p-0 bg-transparent rounded-none inline-flex gap-4 sm:gap-6 overflow-x-auto">
            <TabsTrigger 
              value="payments" 
              className="rounded-none border-0 border-b-[3px] border-transparent data-[state=active]:border-b-black dark:data-[state=active]:border-b-white data-[state=active]:!bg-transparent !bg-transparent px-0 pb-2 pt-0 font-normal text-muted-foreground data-[state=active]:text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:!bg-transparent hover:text-foreground transition-colors gap-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <DollarSign className="h-4 w-4" />
              {t('integrations.payments.title')}
            </TabsTrigger>
            <TabsTrigger 
              value="api"
              className="rounded-none border-0 border-b-[3px] border-transparent data-[state=active]:border-b-black dark:data-[state=active]:border-b-white data-[state=active]:!bg-transparent !bg-transparent px-0 pb-2 pt-0 font-normal text-muted-foreground data-[state=active]:text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:!bg-transparent hover:text-foreground transition-colors gap-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <Key className="h-4 w-4" />
              {t('integrations.api.title')}
            </TabsTrigger>
            <TabsTrigger 
              value="webhooks"
              className="rounded-none border-0 border-b-[3px] border-transparent data-[state=active]:border-b-black dark:data-[state=active]:border-b-white data-[state=active]:!bg-transparent !bg-transparent px-0 pb-2 pt-0 font-normal text-muted-foreground data-[state=active]:text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:!bg-transparent hover:text-foreground transition-colors gap-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <Webhook className="h-4 w-4" />
              {t('integrations.webhooks.title')}
            </TabsTrigger>
          </TabsList>

          {/* Tab Pagamentos */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle>{t('integrations.payments.title')}</CardTitle>
                      <CardDescription>{t('integrations.payments.description')}</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600">{t('common.available')}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="md" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Features */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: Zap, text: t('integrations.payments.feature1') },
                        { icon: Zap, text: t('integrations.payments.feature2') },
                        { icon: Zap, text: t('integrations.payments.feature3') },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
                          <item.icon className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs">{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Webhook URL */}
                    <div className="space-y-2">
                      <Label>{t('integrations.payments.webhookUrl')}</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={selectedProject?.id ? `https://gyqohtqfyzzifxjkuuiz.supabase.co/functions/v1/api-payments?project_id=${selectedProject.id}&api_key=${fullApiKey}` : t('integrations.selectProjectPlaceholder')}
                          className="flex-1 font-mono text-xs"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            if (selectedProject?.id) {
                              navigator.clipboard.writeText(`https://gyqohtqfyzzifxjkuuiz.supabase.co/functions/v1/api-payments?project_id=${selectedProject.id}&api_key=${fullApiKey}`)
                              toast.success(t('integrations.payments.copied'))
                            }
                          }}
                          disabled={!selectedProject?.id}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('integrations.payments.webhookUrlDesc')}
                      </p>
                    </div>

                    {/* Gateways suportados */}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-2">{t('integrations.payments.gateways')}</p>
                      <div className="flex flex-wrap gap-2">
                        {['Stripe', 'Hotmart', 'Kiwify', 'Eduzz', 'PagSeguro', 'PayPal', 'WooCommerce'].map((gateway) => (
                          <Badge key={gateway} variant="secondary" className="text-xs">
                            {gateway}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('integrations.payments.gatewaysDesc')}
                      </p>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <a href="https://www.revenify.co/docs" target="_blank" rel="noopener noreferrer" className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {t('integrations.payments.viewDocs')}
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Como funciona */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('integrations.payments.howItWorks')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {[
                    { num: '1', title: t('integrations.payments.step1'), desc: t('integrations.payments.step1Desc') },
                    { num: '2', title: t('integrations.payments.step2'), desc: t('integrations.payments.step2Desc') },
                    { num: '3', title: t('integrations.payments.step3'), desc: t('integrations.payments.step3Desc') },
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
            <Card className={`transition-all duration-200 hover:shadow-md ${!hasApiAccess ? 'opacity-60' : ''}`}>
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
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium mb-1">{t('integrations.api.proRequired')}</h4>
                    <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                      Acesse a API para integrar o Revenify com seus sistemas
                    </p>
                    <Button size="sm">
                      <a href="/pricing" className="flex items-center">{t('integrations.api.upgrade')}</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Webhooks */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card className={`transition-all duration-200 hover:shadow-md ${!hasWebhooksAccess ? 'opacity-60' : ''}`}>
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
                        disabled={!webhookUrl}
                        loading={testingWebhook}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {testingWebhook ? t('integrations.webhooks.testing') : t('integrations.webhooks.test')}
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-2">{t('integrations.webhooks.events')}:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { event: 'event.created', desc: t('integrations.webhooks.eventCreated') },
                          { event: 'lead.created', desc: t('integrations.webhooks.leadCreated') },
                          { event: 'revenue.attributed', desc: t('integrations.webhooks.paymentReceived') },
                          { event: 'limit.reached', desc: t('integrations.webhooks.limitReached') },
                        ].map((item) => (
                          <div key={item.event} className="flex items-center gap-2 text-xs">
                            <code className="px-1.5 py-0.5 rounded bg-muted">{item.event}</code>
                            <span className="text-muted-foreground">{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Revenue Attribution API */}
                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <p className="text-sm font-semibold">{t('integrations.webhooks.revenueApi')}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {t('integrations.webhooks.revenueApiDesc')}
                      </p>
                      <div className="bg-muted rounded-md p-3 font-mono text-xs overflow-x-auto">
                        <pre className="text-muted-foreground">
{`POST /functions/v1/revenue-attribution
Headers:
  X-API-Key: your_api_key

Body:
{
  "visitor_id": "visitor_abc123",
  "amount": 99.90,
  "currency": "BRL",
  "transaction_id": "txn_123"
}`}
                        </pre>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium mb-1">{t('integrations.api.proRequired')}</h4>
                    <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                      Configure webhooks para receber notificações em tempo real
                    </p>
                    <Button size="sm">
                      <a href="/pricing" className="flex items-center">{t('integrations.api.upgrade')}</a>
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
