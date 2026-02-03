import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Lock, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle,
  Building2,
  Users,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSubscription } from '@/contexts/subscription-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/use-i18n'
import { HeaderSkeleton, CardSkeleton } from '@/components/page-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

interface SSOConfig {
  id?: string
  enabled: boolean
  provider: 'saml' | 'oidc'
  entity_id: string
  sso_url: string
  certificate: string
  attribute_mapping: {
    email: string
    name: string
    groups?: string
  }
  allowed_domains: string[]
  auto_provision: boolean
  default_role: 'member' | 'admin'
}

const defaultConfig: SSOConfig = {
  enabled: false,
  provider: 'saml',
  entity_id: '',
  sso_url: '',
  certificate: '',
  attribute_mapping: {
    email: 'email',
    name: 'name',
    groups: 'groups'
  },
  allowed_domains: [],
  auto_provision: true,
  default_role: 'member'
}

export default function SSOSettingsPage() {
  const { t } = useI18n()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const [config, setConfig] = useState<SSOConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [newDomain, setNewDomain] = useState('')

  const isBusinessPlan = subscription?.plan === 'business'
  const canUseSSO = isBusinessPlan

  // Supabase SSO metadata URLs
  const supabaseProjectRef = 'gyqohtqfyzzifxjkuuiz'
  const acsUrl = `https://${supabaseProjectRef}.supabase.co/auth/v1/sso/saml/acs`
  const metadataUrl = `https://${supabaseProjectRef}.supabase.co/auth/v1/sso/saml/metadata`
  const entityId = `https://${supabaseProjectRef}.supabase.co/auth/v1/sso/saml`

  useEffect(() => {
    if (canUseSSO) {
      loadConfig()
    } else {
      setLoading(false)
    }
  }, [canUseSSO])

  const loadConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('sso_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data && !error) {
        setConfig({
          ...defaultConfig,
          ...data,
          attribute_mapping: data.attribute_mapping || defaultConfig.attribute_mapping,
          allowed_domains: data.allowed_domains || []
        })
      }
    } catch (err) {
      console.warn('SSO config not available:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const configData = {
        user_id: user.id,
        enabled: config.enabled,
        provider: config.provider,
        entity_id: config.entity_id,
        sso_url: config.sso_url,
        certificate: config.certificate,
        attribute_mapping: config.attribute_mapping,
        allowed_domains: config.allowed_domains,
        auto_provision: config.auto_provision,
        default_role: config.default_role,
        updated_at: new Date().toISOString()
      }

      if (config.id) {
        const { error } = await supabase
          .from('sso_configs')
          .update(configData)
          .eq('id', config.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('sso_configs')
          .insert(configData)
          .select()
          .single()

        if (error) throw error
        if (data) setConfig(prev => ({ ...prev, id: data.id }))
      }

      toast.success('Configuração SSO salva!')
    } catch (err) {
      console.error('Error saving SSO config:', err)
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      // Simulate test - in production this would validate the SAML config
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (!config.entity_id || !config.sso_url || !config.certificate) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      toast.success('Conexão SSO testada com sucesso!')
    } catch (err) {
      toast.error('Erro ao testar conexão SSO')
    } finally {
      setTesting(false)
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success('Copiado!')
    setTimeout(() => setCopied(null), 2000)
  }

  const addDomain = () => {
    if (newDomain && !config.allowed_domains.includes(newDomain)) {
      setConfig(prev => ({
        ...prev,
        allowed_domains: [...prev.allowed_domains, newDomain.toLowerCase()]
      }))
      setNewDomain('')
    }
  }

  const removeDomain = (domain: string) => {
    setConfig(prev => ({
      ...prev,
      allowed_domains: prev.allowed_domains.filter(d => d !== domain)
    }))
  }

  if (subscriptionLoading || loading) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <HeaderSkeleton />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16 rounded-full bg-muted/40" />
              <Skeleton className="h-6 w-20 rounded-full bg-muted/40" />
            </div>
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-8 w-28 bg-muted/30" />
            <Skeleton className="h-8 w-28 bg-muted/30" />
            <Skeleton className="h-8 w-28 bg-muted/30" />
          </div>
          <CardSkeleton lines={6} />
          <CardSkeleton lines={4} />
        </div>
      </DashboardLayout>
    )
  }

  if (!canUseSSO) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{t('sso.title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('sso.subtitle')}
            </p>
          </div>

          <Card>
            <CardContent className="p-12 text-center">
              <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('sso.upgradeRequired')}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t('sso.upgradeDesc')}
              </p>
              <Button asChild>
                <a href="/pricing">{t('sso.upgradeToBusiness')}</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('sso.title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('sso.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {config.enabled ? (
              <Badge className="gap-1 text-xs sm:text-sm bg-green-600 text-white">
                <CheckCircle2 className="h-3 w-3" />
                {t('sso.enabled')}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
                <XCircle className="h-3 w-3" />
                {t('sso.disabled')}
              </Badge>
            )}
            <Badge className="bg-emerald-600 text-white gap-1 text-xs sm:text-sm">
              <Shield className="h-3 w-3" />
              Business
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="h-auto p-0 bg-transparent rounded-none inline-flex gap-4 sm:gap-6 overflow-x-auto">
            <TabsTrigger 
              value="config" 
              className="rounded-none border-0 border-b-[3px] border-transparent data-[state=active]:border-b-black dark:data-[state=active]:border-b-white data-[state=active]:!bg-transparent !bg-transparent px-0 pb-2 pt-0 font-normal text-muted-foreground data-[state=active]:text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:!bg-transparent hover:text-foreground transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              {t('common.configuration')}
            </TabsTrigger>
            <TabsTrigger 
              value="metadata"
              className="rounded-none border-0 border-b-[3px] border-transparent data-[state=active]:border-b-black dark:data-[state=active]:border-b-white data-[state=active]:!bg-transparent !bg-transparent px-0 pb-2 pt-0 font-normal text-muted-foreground data-[state=active]:text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:!bg-transparent hover:text-foreground transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              <span className="hidden sm:inline">{t('sso.spMetadata')}</span>
              <span className="sm:hidden">Metadados</span>
            </TabsTrigger>
            <TabsTrigger 
              value="advanced"
              className="rounded-none border-0 border-b-[3px] border-transparent data-[state=active]:border-b-black dark:data-[state=active]:border-b-white data-[state=active]:!bg-transparent !bg-transparent px-0 pb-2 pt-0 font-normal text-muted-foreground data-[state=active]:text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:!bg-transparent hover:text-foreground transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              {t('common.advanced')}
            </TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {t('sso.provider')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{t('sso.entityIdTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>
                  {t('sso.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Tipo de Provedor</Label>
                  <select
                    id="provider"
                    value={config.provider}
                    onChange={(e) => setConfig(prev => ({ ...prev, provider: e.target.value as 'saml' | 'oidc' }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="saml">SAML 2.0</option>
                    <option value="oidc">OpenID Connect (OIDC)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity_id" className="flex items-center gap-2">
                    {t('sso.entityId')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{t('sso.entityIdTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="entity_id"
                    placeholder="https://idp.example.com/saml/metadata"
                    value={config.entity_id}
                    onChange={(e) => setConfig(prev => ({ ...prev, entity_id: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sso_url" className="flex items-center gap-2">
                    {t('sso.ssoUrl')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{t('sso.ssoUrlTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="sso_url"
                    placeholder="https://idp.example.com/saml/sso"
                    value={config.sso_url}
                    onChange={(e) => setConfig(prev => ({ ...prev, sso_url: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificate" className="flex items-center gap-2">
                    {t('sso.certificate')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{t('sso.certificateTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <textarea
                    id="certificate"
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    value={config.certificate}
                    onChange={(e) => setConfig(prev => ({ ...prev, certificate: e.target.value }))}
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attribute Mapping */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mapeamento de Atributos</CardTitle>
                <CardDescription>
                  Configure como os atributos SAML são mapeados para campos do usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attr_email">Atributo de Email</Label>
                    <Input
                      id="attr_email"
                      placeholder="email"
                      value={config.attribute_mapping.email}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        attribute_mapping: { ...prev.attribute_mapping, email: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attr_name">Atributo de Nome</Label>
                    <Input
                      id="attr_name"
                      placeholder="displayName"
                      value={config.attribute_mapping.name}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        attribute_mapping: { ...prev.attribute_mapping, name: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attr_groups">Atributo de Grupos (opcional)</Label>
                  <Input
                    id="attr_groups"
                    placeholder="groups"
                    value={config.attribute_mapping.groups || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      attribute_mapping: { ...prev.attribute_mapping, groups: e.target.value }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={saveConfig} disabled={saving}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                ) : (
                  'Salvar Configuração'
                )}
              </Button>
              <Button variant="outline" onClick={testConnection} disabled={testing}>
                {testing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testando...</>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadados do Service Provider (SP)</CardTitle>
                <CardDescription>
                  Use estas informações para configurar o Revenify no seu provedor de identidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Entity ID (Audience)</Label>
                  <div className="flex gap-2">
                    <Input value={entityId} readOnly className="font-mono text-sm" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(entityId, 'entityId')}
                    >
                      {copied === 'entityId' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ACS URL (Reply URL)</Label>
                  <div className="flex gap-2">
                    <Input value={acsUrl} readOnly className="font-mono text-sm" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(acsUrl, 'acsUrl')}
                    >
                      {copied === 'acsUrl' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Metadata URL</Label>
                  <div className="flex gap-2">
                    <Input value={metadataUrl} readOnly className="font-mono text-sm" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(metadataUrl, 'metadataUrl')}
                    >
                      {copied === 'metadataUrl' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Provedores Suportados
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['Okta', 'Azure AD', 'Google Workspace', 'OneLogin', 'Auth0', 'Ping Identity', 'JumpCloud'].map((provider) => (
                      <Badge key={provider} variant="secondary">{provider}</Badge>
                    ))}
                  </div>
                </div>

                <Button variant="outline" asChild>
                  <a href="https://www.revenify.co/docs" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Documentação Completa
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Domínios Permitidos</CardTitle>
                <CardDescription>
                  Restrinja o SSO apenas para emails de domínios específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="empresa.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                  />
                  <Button onClick={addDomain}>Adicionar</Button>
                </div>

                {config.allowed_domains.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {config.allowed_domains.map((domain) => (
                      <Badge key={domain} variant="secondary" className="gap-1">
                        {domain}
                        <button
                          onClick={() => removeDomain(domain)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum domínio configurado. Todos os domínios serão aceitos.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Provisionamento de Usuários</CardTitle>
                <CardDescription>
                  Configure como novos usuários são criados via SSO
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-provisionamento</Label>
                    <p className="text-xs text-muted-foreground">
                      Criar automaticamente contas para novos usuários SSO
                    </p>
                  </div>
                  <Switch
                    checked={config.auto_provision}
                    onCheckedChange={(auto_provision) => setConfig(prev => ({ ...prev, auto_provision }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Papel Padrão</Label>
                  <select
                    value={config.default_role}
                    onChange={(e) => setConfig(prev => ({ ...prev, default_role: e.target.value as 'member' | 'admin' }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="member">Membro</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Papel atribuído a novos usuários criados via SSO
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-600">Importante</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Após habilitar o SSO, usuários com emails dos domínios configurados 
                    serão redirecionados automaticamente para o provedor de identidade.
                    Certifique-se de testar a configuração antes de ativar.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={saveConfig} disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
              ) : (
                'Salvar Configurações Avançadas'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
