import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Save, Loader2, Bell, HelpCircle } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

interface NotificationSettings {
  // Email Notifications
  email_projects: boolean
  email_documents: boolean
  email_team: boolean
  email_deadlines: boolean
  email_mentions: boolean
  email_security: boolean
  
  // In-App Notifications
  app_projects: boolean
  app_documents: boolean
  app_team: boolean
  app_deadlines: boolean
  app_mentions: boolean
  app_comments: boolean
  
  // Marketing
  marketing_newsletter: boolean
  marketing_updates: boolean
  marketing_tips: boolean
  
  // System
  system_maintenance: boolean
  system_updates: boolean
}

export default function NotificationsPage() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    // Email
    email_projects: true,
    email_documents: true,
    email_team: true,
    email_deadlines: true,
    email_mentions: true,
    email_security: true,
    
    // In-App
    app_projects: true,
    app_documents: true,
    app_team: true,
    app_deadlines: true,
    app_mentions: true,
    app_comments: true,
    
    // Marketing
    marketing_newsletter: false,
    marketing_updates: true,
    marketing_tips: false,
    
    // System
    system_maintenance: true,
    system_updates: true,
  })

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      if (data && data.length > 0) {
        const loadedSettings: any = { ...settings }
        data.forEach(item => {
          loadedSettings[item.setting_key] = item.enabled
        })
        setSettings(loadedSettings)
      }
    } catch (error: any) {
      console.error('Error loading notification settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar settings ao montar - com key única para forçar re-render no mobile
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      // Upsert all 17 notification settings
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        user_id: user.id,
        setting_key: key,
        enabled: value,
      }))

      const { error } = await supabase
        .from('notification_settings')
        .upsert(settingsArray, {
          onConflict: 'user_id,setting_key',
        })

      if (error) throw error

      toast.success(t('common.success'), {
        description: t('notifications.saved')
      })
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleDisableAll = () => {
    const allDisabled = Object.keys(settings).reduce((acc, key) => {
      // Manter apenas notificações de segurança e sistema críticas
      if (key === 'email_security' || key === 'system_maintenance') {
        acc[key as keyof NotificationSettings] = true
      } else {
        acc[key as keyof NotificationSettings] = false
      }
      return acc
    }, {} as NotificationSettings)
    
    setSettings(allDisabled)
    toast.info(t('notifications.allDisabled'), {
      description: t('notifications.securityRemains')
    })
  }

  const NotificationItem = ({ 
    title, 
    description, 
    settingKey,
    tooltip
  }: { 
    title: string
    description: string
    settingKey: keyof NotificationSettings
    tooltip?: string
  }) => (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="space-y-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={settingKey} className="font-medium cursor-pointer text-sm">
            {title}
          </Label>
          {tooltip && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] text-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Switch
        id={settingKey}
        checked={settings[settingKey]}
        onCheckedChange={(checked) => updateSetting(settingKey, checked)}
        className="shrink-0 scale-90"
      />
    </div>
  )

  return (
    <DashboardLayout>
      <div className="min-h-screen w-full flex items-start justify-center pt-6 pb-8">
        <div className="w-full px-4 md:w-[60%] md:px-0 space-y-4">
          {/* Loading Skeleton */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
              {[1, 2, 3].map((section) => (
                <div key={section} className="space-y-3">
                  <Skeleton className="h-5 w-40" />
                  {[1, 2, 3].map((item) => (
                    <motion.div
                      key={`${section}-${item}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: section * 0.1 + item * 0.05 }}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-5 w-9 rounded-full" />
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          ) : (
          <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight">{t('notifications.title')}</h1>
              <p className="text-xs text-muted-foreground">
                {t('notifications.description')}
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-3.5 w-3.5" />
                  {t('common.save')}
                </>
              )}
            </Button>
          </div>

          {/* Email Notifications */}
          <div className="space-y-3">
            <h2 className="text-base font-medium">{t('notifications.emailNotifications')}</h2>
            <div className="space-y-1">
              <NotificationItem
                title={t('notifications.newProjects')}
                description={t('notifications.newProjectsDesc')}
                settingKey="email_projects"
                tooltip="Receba um email quando um novo projeto for criado no seu workspace ou quando você for adicionado a um projeto existente."
              />
              <NotificationItem
                title={t('notifications.documents')}
                description={t('notifications.documentsDesc')}
                settingKey="email_documents"
                tooltip="Receba emails quando documentos forem criados, editados ou compartilhados com você."
              />
              <NotificationItem
                title={t('notifications.team')}
                description={t('notifications.teamDesc')}
                settingKey="email_team"
                tooltip="Receba emails sobre atividades da equipe: novos membros, mudanças de permissão e convites."
              />
              <NotificationItem
                title={t('notifications.deadlines')}
                description={t('notifications.deadlinesDesc')}
                settingKey="email_deadlines"
                tooltip="Receba lembretes por email sobre prazos de tarefas que estão próximos ou vencidos."
              />
              <NotificationItem
                title={t('notifications.mentions')}
                description={t('notifications.mentionsDesc')}
                settingKey="email_mentions"
                tooltip="Receba um email quando alguém mencionar você (@seu_nome) em comentários ou discussões."
              />
              <NotificationItem
                title={t('notifications.security')}
                description={t('notifications.securityDesc')}
                settingKey="email_security"
                tooltip="Alertas críticos de segurança: novos logins, mudanças de senha, tentativas suspeitas. Recomendamos manter ativo."
              />
            </div>
          </div>

          {/* In-App Notifications */}
          <div className="space-y-3">
            <h2 className="text-base font-medium">{t('notifications.appNotifications')}</h2>
            <div className="space-y-1">
              <NotificationItem
                title={t('notifications.projects')}
                description={t('notifications.projectsDesc')}
                settingKey="app_projects"
                tooltip="Notificações push no navegador sobre atualizações em projetos que você participa."
              />
              <NotificationItem
                title={t('notifications.documents')}
                description={t('notifications.documentsDesc')}
                settingKey="app_documents"
                tooltip="Notificações em tempo real quando documentos são modificados ou compartilhados."
              />
              <NotificationItem
                title={t('notifications.team')}
                description={t('notifications.teamDesc')}
                settingKey="app_team"
                tooltip="Alertas sobre mudanças na equipe: novos membros, saídas e alterações de função."
              />
              <NotificationItem
                title={t('notifications.deadlines')}
                description={t('notifications.deadlinesDesc')}
                settingKey="app_deadlines"
                tooltip="Pop-ups de lembrete no app quando um prazo está próximo ou já passou."
              />
              <NotificationItem
                title={t('notifications.mentions')}
                description={t('notifications.mentionsDesc')}
                settingKey="app_mentions"
                tooltip="Alertas instantâneos quando você é mencionado em qualquer lugar do sistema."
              />
              <NotificationItem
                title={t('notifications.comments')}
                description={t('notifications.commentsDesc')}
                settingKey="app_comments"
                tooltip="Notificações quando alguém comenta em itens que você criou ou está acompanhando."
              />
            </div>
          </div>

          {/* Marketing */}
          <div className="space-y-3">
            <h2 className="text-base font-medium">{t('notifications.marketing')}</h2>
            <div className="space-y-1">
              <NotificationItem
                title={t('notifications.newsletter')}
                description={t('notifications.newsletterDesc')}
                settingKey="marketing_newsletter"
                tooltip="Newsletter mensal com dicas, novidades e conteúdo exclusivo sobre produtividade."
              />
              <NotificationItem
                title={t('notifications.productUpdates')}
                description={t('notifications.productUpdatesDesc')}
                settingKey="marketing_updates"
                tooltip="Anúncios sobre novas funcionalidades, melhorias e atualizações importantes do produto."
              />
              <NotificationItem
                title={t('notifications.tips')}
                description={t('notifications.tipsDesc')}
                settingKey="marketing_tips"
                tooltip="Dicas personalizadas de como usar melhor o ISACAR baseado no seu uso."
              />
            </div>
          </div>

          {/* System */}
          <div className="space-y-3">
            <h2 className="text-base font-medium">{t('notifications.system')}</h2>
            <div className="space-y-1">
              <NotificationItem
                title={t('notifications.maintenance')}
                description={t('notifications.maintenanceDesc')}
                settingKey="system_maintenance"
                tooltip="Avisos sobre manutenções programadas e indisponibilidades do sistema. Recomendamos manter ativo."
              />
              <NotificationItem
                title={t('notifications.systemUpdates')}
                description={t('notifications.systemUpdatesDesc')}
                settingKey="system_updates"
                tooltip="Informações sobre atualizações de sistema, correções de bugs e melhorias de performance."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <p className="font-medium text-sm">{t('notifications.disableAll')}</p>
              <p className="text-xs text-muted-foreground">
                {t('notifications.reactivateAnytime')}
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleDisableAll}
              size="sm"
            >
              {t('notifications.disableAllButton')}
            </Button>
          </div>
          </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
