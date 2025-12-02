import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Save, Loader2, CheckSquare, Wallet, ArrowRight, FolderKanban, BarChart3, Plug } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { GoogleIntegrationCard } from '@/components/integrations/google-integration-card'
import { GmailInvoiceScanner } from '@/components/integrations/gmail-invoice-scanner'
import { CalendarSyncPanel } from '@/components/integrations/calendar-sync-panel'
import { SheetsExportDialog } from '@/components/integrations/sheets-export-dialog'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/contexts/workspace-context'
import { useGoogleIntegration } from '@/hooks/use-google-integration'
import { useI18n } from '@/hooks/use-i18n'

export default function IntegrationsPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const { isConnected: isGoogleConnected } = useGoogleIntegration()
  const [config, setConfig] = useState({
    ENABLED: false,
    WHITEBOARD_TO_TASKS: true,
    WHITEBOARD_TO_GERENCIADOR: true,
    TASKS_TO_FINANCE: true,
    PROJECTS_TO_FINANCE: true,
    AUTO_CREATE: true,
    SHOW_NOTIFICATIONS: true,
    DEBUG_MODE: false,
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  // ✨ Detectar retorno do Google OAuth
  useEffect(() => {
    const handleGoogleCallback = async () => {
      // Verificar se já processamos este callback (evitar loop infinito)
      const callbackProcessed = sessionStorage.getItem('google_oauth_processed')
      if (callbackProcessed) {
        console.log('⏭️ Callback já processado, pulando...')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('🔍 Verificando sessão na página:', {
        hasSession: !!session,
        hasProviderToken: !!session?.provider_token
      })

      if (session?.provider_token && session?.user) {
        // Marcar como processado ANTES de fazer qualquer coisa
        sessionStorage.setItem('google_oauth_processed', 'true')
        console.log('✅ Provider token encontrado, salvando...')
        
        try {
          // Buscar email do Google
          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${session.provider_token}` }
          })

          if (!userInfoResponse.ok) {
            throw new Error('Erro ao buscar info do Google')
          }
          
          const userInfo = await userInfoResponse.json()
          console.log('📧 Email do Google:', userInfo.email)

          // Calcular token_expires_at (Google tokens expiram em 1h)
          const expiresAt = new Date()
          expiresAt.setHours(expiresAt.getHours() + 1)

          const integrationData: any = {
            user_id: session.user.id,
            workspace_id: currentWorkspace?.id || null,
            google_email: userInfo.email,
            google_id: userInfo.id,
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token || null,
            token_expires_at: expiresAt.toISOString(),
            is_active: true,
            scopes: [
              'https://www.googleapis.com/auth/gmail.readonly',
              'https://www.googleapis.com/auth/calendar.events',
              'https://www.googleapis.com/auth/spreadsheets',
              'https://www.googleapis.com/auth/drive.file',
              'https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/documents'
            ],
            settings: {
              gmail: { enabled: true, auto_import: true },
              calendar: { enabled: true, sync_tasks: true },
              sheets: { enabled: true },
              drive: { enabled: true },
              docs: { enabled: true }
            }
          }

          console.log('💾 Salvando integração...')

          // Verificar se já existe integração
          let query = supabase
            .from('google_integrations')
            .select('id')
            .eq('user_id', session.user.id)

          if (currentWorkspace?.id) {
            query = query.eq('workspace_id', currentWorkspace.id)
          } else {
            query = query.is('workspace_id', null)
          }

          const { data: existing } = await query.maybeSingle()

          // Se existe, atualizar. Senão, inserir
          if (existing) {
            console.log('🔄 Atualizando integração existente')
            await supabase
              .from('google_integrations')
              .update(integrationData)
              .eq('id', existing.id)
          } else {
            console.log('➕ Criando nova integração')
            await supabase
              .from('google_integrations')
              .insert(integrationData)
          }
          
          console.log('✅ Integração salva com sucesso!')
          // Toast já é mostrado pelo hook useGoogleIntegration
          // NÃO fazer reload - o hook atualiza o estado automaticamente
        } catch (error: any) {
          console.error('❌ Erro ao salvar integração:', error)
          toast.error(`Erro ao conectar: ${error.message}`)
          // Limpar flag em caso de erro
          sessionStorage.removeItem('google_oauth_processed')
        }
      }
    }

    handleGoogleCallback()
  }, [currentWorkspace?.id])

  const loadConfig = async () => {
    try {
      setPageLoading(true)
      const { INTEGRATION_CONFIG } = await import('@/integrations/config')
      setConfig({ ...INTEGRATION_CONFIG })
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const handleToggle = (key: string, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      localStorage.setItem('integration-config', JSON.stringify(config))
      
      // ✨ Disparar evento para atualizar componentes em tempo real
      window.dispatchEvent(new CustomEvent('integration-config-changed', { 
        detail: config 
      }))
      
      setHasChanges(false)
      
      toast.success(t('integrations.configSaved'), {
        description: t('integrations.configSavedDesc'),
      })
      
    } catch (error) {
      toast.error(t('integrations.configError'))
    } finally {
      setSaving(false)
    }
  }

  const IntegrationItem = ({ 
    title, 
    description, 
    settingKey,
    disabled = false,
    icon
  }: { 
    title: string
    description: string
    settingKey: string
    disabled?: boolean
    icon?: React.ReactNode
  }) => (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="space-y-0.5 flex-1 min-w-0 flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Label htmlFor={settingKey} className="font-medium cursor-pointer text-sm">
            {title}
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <Switch
        id={settingKey}
        checked={config[settingKey as keyof typeof config] as boolean}
        onCheckedChange={(checked) => handleToggle(settingKey, checked)}
        className="shrink-0 scale-90"
        disabled={disabled}
      />
    </div>
  )

  return (
    <DashboardLayout>
      <div className="h-full w-full flex flex-col overflow-hidden">
        {/* Header padrão */}
        <div className="flex items-center justify-between gap-2 px-[5px] py-0.5 border-b border-border">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Plug className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h2 className="text-sm font-semibold truncate">{t('integrations.title')}</h2>
          </div>

          <div className="flex items-center gap-0.5">
            <Button 
              onClick={saveConfig} 
              disabled={saving || !hasChanges}
              size="icon"
              variant={hasChanges ? "primary" : "ghost"}
              className="h-7 w-7"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto">
          {pageLoading ? (
            <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
              {/* Skeleton de Integrações */}
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-lg bg-muted/30 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-md" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-48" />
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={`switch-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-5 w-9 rounded-full" />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
          <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-4">

          {/* Integrações API REST */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h2 className="text-base font-medium">{t('integrations.apiRest')}</h2>
            <GoogleIntegrationCard />
            
            {/* Google Features - só aparece se conectado */}
            {isGoogleConnected && (
              <div className="mt-8 space-y-6">
                <div>
                  <h2 className="text-base font-medium mb-1">{t('integrations.googleWorkspace')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t('integrations.googleWorkspaceDesc')}
                  </p>
                </div>

                {/* Grid de ferramentas */}
                <div className="grid gap-6">
                  {/* Gmail Tools */}
                  <GmailInvoiceScanner />

                  {/* Calendar Sync */}
                  <CalendarSyncPanel />

                  {/* Sheets Export */}
                  <SheetsExportDialog />

                  {/* Link para Analytics Detalhado */}
                  <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <CardTitle className="text-base">{t('integrations.analytics')}</CardTitle>
                      </div>
                      <CardDescription>
                        {t('integrations.analyticsDesc')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => navigate('/analytics/google')}
                        className="w-full"
                        variant="primary"
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        {t('integrations.viewAnalytics')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </motion.div>

          {/* Sistema Principal */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <h2 className="text-base font-medium">{t('integrations.internalSystem')}</h2>
            <div className="space-y-1">
              <IntegrationItem
                title={t('integrations.enableSystem')}
                description={t('integrations.enableSystemDesc')}
                settingKey="ENABLED"
              />
            </div>
          </motion.div>

          {/* Integrações Disponíveis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h2 className="text-base font-medium">{t('integrations.available')}</h2>
            <div className="space-y-1">
              <IntegrationItem
                icon={
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                }
                title={t('integrations.tasksToFinance')}
                description={t('integrations.tasksToFinanceDesc')}
                settingKey="TASKS_TO_FINANCE"
                disabled={!config.ENABLED}
              />
              <IntegrationItem
                icon={
                  <div className="flex items-center gap-1.5">
                    <FolderKanban className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                }
                title={t('integrations.projectsToFinance')}
                description={t('integrations.projectsToFinanceDesc')}
                settingKey="PROJECTS_TO_FINANCE"
                disabled={!config.ENABLED}
              />
            </div>
          </motion.div>

          {/* Opções de Comportamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h2 className="text-base font-medium">{t('integrations.behaviorOptions')}</h2>
            <div className="space-y-1">
              <IntegrationItem
                title={t('integrations.autoCreate')}
                description={t('integrations.autoCreateDesc')}
                settingKey="AUTO_CREATE"
                disabled={!config.ENABLED}
              />
              <IntegrationItem
                title={t('integrations.notifications')}
                description={t('integrations.notificationsDesc')}
                settingKey="SHOW_NOTIFICATIONS"
                disabled={!config.ENABLED}
              />
              <IntegrationItem
                title={t('integrations.debugMode')}
                description={t('integrations.debugModeDesc')}
                settingKey="DEBUG_MODE"
                disabled={!config.ENABLED}
              />
            </div>
          </motion.div>

          {/* Status */}
          {config.ENABLED && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between pt-2 border-t"
            >
              <div>
                <p className="font-medium text-sm text-green-600 dark:text-green-400">
                  ✅ {t('integrations.systemActive')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('integrations.systemActiveDesc')}
                </p>
              </div>
            </motion.div>
          )}
          </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
