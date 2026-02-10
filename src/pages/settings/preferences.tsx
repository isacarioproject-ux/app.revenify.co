import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from '@/hooks/use-i18n'
import { useState, useEffect } from 'react'
import { SettingsPageSkeleton } from '@/components/page-skeleton'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'

interface UserPreferences {
  language: 'pt' | 'en' | 'es'
  theme: 'light' | 'dark' | 'system'
  analytics_enabled: boolean
  marketing_emails: boolean
  timezone: string
  date_format: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd'
  currency: 'BRL' | 'USD' | 'EUR'
}

const defaultPreferences: UserPreferences = {
  language: 'pt',
  theme: 'dark',
  analytics_enabled: true,
  marketing_emails: false,
  timezone: 'America/Sao_Paulo',
  date_format: 'dd/MM/yyyy',
  currency: 'BRL',
}

export default function PreferencesPage() {
  const { t, setLanguage } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)

  // Load preferences from Supabase
  useEffect(() => {
    async function loadPreferences() {
      if (!user) return

      try {
        // Try to load from user_settings table
        const { data, error } = await supabase
          .from('user_settings')
          .select('preferences')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
          console.error('Error loading preferences:', error)
        }

        if (data?.preferences) {
          setPreferences({ ...defaultPreferences, ...data.preferences })
        } else {
          // Fallback to user metadata
          const userPrefs = user.user_metadata?.preferences
          if (userPrefs) {
            setPreferences({ ...defaultPreferences, ...userPrefs })
          }
        }

        // Sync theme with current theme
        setPreferences(prev => ({ ...prev, theme: theme as any }))
      } catch (error) {
        console.error('Error loading preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadPreferences()
    }
  }, [user, authLoading, theme])

  const handleChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))

    // Apply theme immediately
    if (key === 'theme') {
      setTheme(value)
    }

    // Apply language immediately
    if (key === 'language') {
      setLanguage(value)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Try to save to user_settings table
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          preferences: preferences,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) {
        // If table doesn't exist, save to user metadata
        if (error.code === '42P01') {
          await supabase.auth.updateUser({
            data: { preferences: preferences }
          })
        } else {
          throw error
        }
      }

      // Also save to localStorage for quick access
      localStorage.setItem('user_preferences', JSON.stringify(preferences))

      toast.success('Preferências salvas com sucesso!')
    } catch (error: any) {
      console.error('Error saving preferences:', error)
      toast.error('Erro ao salvar preferências', {
        description: error.message
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <>
        <SettingsPageSkeleton />
      </>
    )
  }

  return (
    <>
      <div className="w-full p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('preferences.title')}</h1>
          <p className="text-muted-foreground">
            {t('preferences.description')}
          </p>
        </div>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle>{t('preferences.language')}</CardTitle>
            <CardDescription>{t('preferences.languageDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={preferences.language} 
              onValueChange={(value) => handleChange('language', value)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('preferences.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle>{t('preferences.theme')}</CardTitle>
            <CardDescription>{t('preferences.themeDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={preferences.theme} 
              onValueChange={(value) => handleChange('theme', value)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('preferences.selectTheme')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('preferences.light')}</SelectItem>
                <SelectItem value="dark">{t('preferences.dark')}</SelectItem>
                <SelectItem value="system">{t('preferences.system')}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('preferences.regional')}</CardTitle>
            <CardDescription>{t('preferences.regionalDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('preferences.dateFormat')}</Label>
                <Select 
                  value={preferences.date_format} 
                  onValueChange={(value) => handleChange('date_format', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY (Brazil)</SelectItem>
                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY (USA)</SelectItem>
                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD (ISO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('preferences.currency')}</Label>
                <Select 
                  value={preferences.currency} 
                  onValueChange={(value) => handleChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">R$ Brazilian Real</SelectItem>
                    <SelectItem value="USD">$ US Dollar</SelectItem>
                    <SelectItem value="EUR">€ Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('preferences.timezone')}</Label>
              <Select 
                value={preferences.timezone} 
                onValueChange={(value) => handleChange('timezone', value)}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Sao Paulo (GMT-3)</SelectItem>
                  <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Los Angeles (GMT-8)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t('preferences.dataPrivacy')}</CardTitle>
            <CardDescription>{t('preferences.dataPrivacyDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('preferences.analytics')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('preferences.analyticsDesc')}
                </p>
              </div>
              <Switch 
                checked={preferences.analytics_enabled}
                onCheckedChange={(checked) => handleChange('analytics_enabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('preferences.marketing')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('preferences.marketingDesc')}
                </p>
              </div>
              <Switch 
                checked={preferences.marketing_emails}
                onCheckedChange={(checked) => handleChange('marketing_emails', checked)}
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
              t('preferences.savePreferences')
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
