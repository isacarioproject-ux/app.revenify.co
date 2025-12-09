import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/use-i18n'
import { useState, useEffect } from 'react'
import { SettingsPageSkeleton } from '@/components/page-skeleton'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface NotificationSettings {
  email_limit_alerts: boolean
  email_weekly_report: boolean
  email_product_updates: boolean
  app_realtime_events: boolean
  app_sound_enabled: boolean
  email_new_leads: boolean
  email_new_payments: boolean
}

const defaultSettings: NotificationSettings = {
  email_limit_alerts: true,
  email_weekly_report: true,
  email_product_updates: false,
  app_realtime_events: true,
  app_sound_enabled: false,
  email_new_leads: true,
  email_new_payments: true,
}

export default function NotificationsPage() {
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)

  // Load settings from Supabase
  useEffect(() => {
    async function loadSettings() {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('notification_settings')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading settings:', error)
        }

        if (data?.notification_settings) {
          setSettings({ ...defaultSettings, ...data.notification_settings })
        }
      } catch (error) {
        console.error('Error loading notification settings:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadSettings()
    }
  }, [user, authLoading])

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notification_settings: settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) {
        // If table doesn't exist, save to user metadata
        if (error.code === '42P01') {
          await supabase.auth.updateUser({
            data: { notification_settings: settings }
          })
        } else {
          throw error
        }
      }

      toast.success('Configurações salvas com sucesso!')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error('Erro ao salvar configurações', {
        description: error.message
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <SettingsPageSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('notifications.title')}</h1>
          <p className="text-muted-foreground">
            {t('notifications.description')}
          </p>
        </div>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>{t('notifications.emailTitle')}</CardTitle>
            <CardDescription>{t('notifications.emailDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notifications.limitAlerts')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.limitAlertsDesc')}
                </p>
              </div>
              <Switch 
                checked={settings.email_limit_alerts}
                onCheckedChange={() => handleToggle('email_limit_alerts')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notifications.weeklyReport')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.weeklyReportDesc')}
                </p>
              </div>
              <Switch 
                checked={settings.email_weekly_report}
                onCheckedChange={() => handleToggle('email_weekly_report')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notifications.newLeads')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.newLeadsDesc')}
                </p>
              </div>
              <Switch 
                checked={settings.email_new_leads}
                onCheckedChange={() => handleToggle('email_new_leads')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notifications.newPayments')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.newPaymentsDesc')}
                </p>
              </div>
              <Switch 
                checked={settings.email_new_payments}
                onCheckedChange={() => handleToggle('email_new_payments')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notifications.productUpdates')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.productUpdatesDesc')}
                </p>
              </div>
              <Switch 
                checked={settings.email_product_updates}
                onCheckedChange={() => handleToggle('email_product_updates')}
              />
            </div>
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>{t('notifications.inAppTitle')}</CardTitle>
            <CardDescription>{t('notifications.inAppDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notifications.realtimeEvents')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.realtimeEventsDesc')}
                </p>
              </div>
              <Switch 
                checked={settings.app_realtime_events}
                onCheckedChange={() => handleToggle('app_realtime_events')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notifications.sounds')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.soundsDesc')}
                </p>
              </div>
              <Switch 
                checked={settings.app_sound_enabled}
                onCheckedChange={() => handleToggle('app_sound_enabled')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('notifications.saveSettings')
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
