import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Smartphone, LogOut, Trash2, Save, Loader2, Settings, HelpCircle, ShieldCheck, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

export default function PreferencesPage() {
  const navigate = useNavigate()
  const { locale, changeLocale, t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '30',
    loginNotifications: true,
    suspiciousActivity: true,
  })

  const [preferences, setPreferences] = useState({
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  })

  const [currentLanguage, setCurrentLanguage] = useState<'pt-BR' | 'en' | 'es'>(locale)

  // 2FA State
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [twoFactorStep, setTwoFactorStep] = useState<'setup' | 'verify' | 'disable'>('setup')
  const [qrCode, setQrCode] = useState<string>('')
  const [totpSecret, setTotpSecret] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState('')
  const [factorId, setFactorId] = useState<string>('')
  const [verifying2FA, setVerifying2FA] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  useEffect(() => {
    setCurrentLanguage(locale)
  }, [locale])

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setSecurity({
          twoFactor: data.two_factor_enabled,
          sessionTimeout: data.session_timeout.toString(),
          loginNotifications: data.login_notifications,
          suspiciousActivity: data.suspicious_activity_alerts,
        })
        setPreferences({
          timezone: data.timezone,
          dateFormat: data.date_format,
          timeFormat: data.time_format,
        })
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  const handleLanguageChange = (newLanguage: string) => {
    const lang = newLanguage as 'pt-BR' | 'en' | 'es'
    setCurrentLanguage(lang)
    changeLocale(lang)
  }

  // ===== 2FA Functions =====
  const checkExisting2FA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      
      const totpFactor = data?.totp?.[0]
      if (totpFactor) {
        setFactorId(totpFactor.id)
        setSecurity(prev => ({ ...prev, twoFactor: true }))
        return true
      }
      return false
    } catch (error) {
      console.error('Error checking 2FA:', error)
      return false
    }
  }

  // Verificar 2FA existente ao carregar
  useEffect(() => {
    checkExisting2FA()
  }, [])

  const handleSetup2FA = async () => {
    try {
      setVerifying2FA(true)
      setTwoFactorStep('setup')
      
      // Enroll novo fator TOTP
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'ISACAR Authenticator'
      })

      if (error) throw error

      if (data) {
        setQrCode(data.totp.qr_code)
        setTotpSecret(data.totp.secret)
        setFactorId(data.id)
        setShow2FADialog(true)
      }
    } catch (error: any) {
      toast.error('Erro ao configurar 2FA', {
        description: error.message
      })
    } finally {
      setVerifying2FA(false)
    }
  }

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Código inválido', {
        description: 'Digite um código de 6 dígitos'
      })
      return
    }

    try {
      setVerifying2FA(true)

      // Primeiro criar challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      })

      if (challengeError) throw challengeError

      // Depois verificar
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: verificationCode
      })

      if (verifyError) throw verifyError

      setSecurity(prev => ({ ...prev, twoFactor: true }))
      setShow2FADialog(false)
      setVerificationCode('')
      toast.success('2FA ativado com sucesso!', {
        description: 'Sua conta agora está protegida com autenticação em dois fatores'
      })
    } catch (error: any) {
      toast.error('Erro ao verificar código', {
        description: error.message || 'Código inválido ou expirado'
      })
    } finally {
      setVerifying2FA(false)
    }
  }

  const handleDisable2FA = async () => {
    try {
      setVerifying2FA(true)

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorId
      })

      if (error) throw error

      setSecurity(prev => ({ ...prev, twoFactor: false }))
      setFactorId('')
      setShow2FADialog(false)
      toast.success('2FA desativado', {
        description: 'Autenticação em dois fatores foi removida da sua conta'
      })
    } catch (error: any) {
      toast.error('Erro ao desativar 2FA', {
        description: error.message
      })
    } finally {
      setVerifying2FA(false)
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(totpSecret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
    toast.success('Código copiado!')
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          two_factor_enabled: security.twoFactor,
          session_timeout: parseInt(security.sessionTimeout),
          login_notifications: security.loginNotifications,
          suspicious_activity_alerts: security.suspiciousActivity,
          timezone: preferences.timezone,
          date_format: preferences.dateFormat,
          time_format: preferences.timeFormat,
        })

      if (error) throw error

      toast.success(t('common.success'), {
        description: t('settings.saved')
      })
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message || t('settings.saveFailed')
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await supabase.auth.signOut()
      navigate('/auth')
    } catch (error) {
      toast.error('Erro ao deletar conta')
    } finally {
      setDeleting(false)
    }
  }

  const handleSignOutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' })
      navigate('/auth')
    } catch (error) {
      toast.error('Erro ao desconectar dispositivos')
    }
  }

  const PreferenceItem = ({ 
    label, 
    description, 
    children,
    tooltip
  }: { 
    label: string
    description: string
    children: React.ReactNode
    tooltip?: string
  }) => (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="space-y-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Label className="font-medium cursor-pointer text-sm">
            {label}
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
      <div className="shrink-0">
        {children}
      </div>
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
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
              {[1, 2, 3].map((section) => (
                <motion.div 
                  key={section}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: section * 0.1 }}
                  className="space-y-3"
                >
                  <Skeleton className="h-5 w-32" />
                  {[1, 2, 3].map((item) => (
                    <div key={`${section}-${item}`} className="flex items-center justify-between py-2">
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                      <Skeleton className="h-8 w-[120px]" />
                    </div>
                  ))}
                </motion.div>
              ))}
            </motion.div>
          ) : (
          <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight">{t('preferences.title')}</h1>
              <p className="text-xs text-muted-foreground">
                Gerencie suas preferências e configurações de segurança
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-3.5 w-3.5" />
                  Salvar
                </>
              )}
            </Button>
          </div>

          {/* Segurança */}
          <div className="space-y-3">
            <h2 className="text-base font-medium">{t('settings.security')}</h2>
            <div className="space-y-1">
              <PreferenceItem
                label={t('settings.twoFactor')}
                description={t('settings.twoFactorDesc')}
                tooltip="Adiciona uma camada extra de segurança exigindo um código do seu celular além da senha ao fazer login."
              >
                <Switch
                  checked={security.twoFactor}
                  onCheckedChange={(checked) => {
                    if (checked && !security.twoFactor) {
                      handleSetup2FA()
                    } else if (!checked && security.twoFactor) {
                      setTwoFactorStep('disable')
                      setShow2FADialog(true)
                    }
                  }}
                  disabled={verifying2FA}
                  className="scale-90"
                />
              </PreferenceItem>

              {security.twoFactor && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 ml-0">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-green-400">{t('settings.twoFactorActive')}</p>
                      <p className="mt-0.5 text-xs text-green-400/80">
                        {t('settings.twoFactorActiveDesc')}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => {
                            setTwoFactorStep('disable')
                            setShow2FADialog(true)
                          }}
                        >
                          Desativar 2FA
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <PreferenceItem
                label={t('settings.sessionTimeout')}
                description={t('settings.sessionTimeoutDesc')}
                tooltip="Tempo de inatividade antes de ser desconectado automaticamente. Menor tempo = mais seguro."
              >
                <Select
                  value={security.sessionTimeout}
                  onValueChange={(value) => setSecurity({ ...security, sessionTimeout: value })}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">{t('settings.timeout15')}</SelectItem>
                    <SelectItem value="30">{t('settings.timeout30')}</SelectItem>
                    <SelectItem value="60">{t('settings.timeout60')}</SelectItem>
                    <SelectItem value="120">{t('settings.timeout120')}</SelectItem>
                    <SelectItem value="never">{t('settings.timeoutNever')}</SelectItem>
                  </SelectContent>
                </Select>
              </PreferenceItem>

              <PreferenceItem
                label={t('settings.loginNotifications')}
                description={t('settings.loginNotificationsDesc')}
                tooltip="Receba um alerta por email sempre que sua conta for acessada de um novo dispositivo ou localização."
              >
                <Switch
                  checked={security.loginNotifications}
                  onCheckedChange={(checked) => setSecurity({ ...security, loginNotifications: checked })}
                  className="scale-90"
                />
              </PreferenceItem>

              <PreferenceItem
                label={t('settings.suspiciousActivity')}
                description={t('settings.suspiciousActivityDesc')}
                tooltip="Monitora tentativas de login falhas, acessos de locais incomuns e outras atividades suspeitas na sua conta."
              >
                <Switch
                  checked={security.suspiciousActivity}
                  onCheckedChange={(checked) => setSecurity({ ...security, suspiciousActivity: checked })}
                  className="scale-90"
                />
              </PreferenceItem>
            </div>
          </div>

          {/* Idioma e Região */}
          <div className="space-y-3">
            <h2 className="text-base font-medium">{t('settings.languageRegion')}</h2>
            <div className="space-y-1">
              {/* Idioma - Layout Inline */}
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <Label className="font-medium text-sm">{t('settings.language')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.languageDesc')}</p>
                </div>
                <Select value={currentLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[110px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">🇧🇷 PT-BR</SelectItem>
                    <SelectItem value="en">🇺🇸 EN</SelectItem>
                    <SelectItem value="es">🇪🇸 ES</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fuso Horário - Layout Inline */}
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <Label className="font-medium text-sm">{t('settings.timezone')}</Label>
                  <p className="text-xs text-muted-foreground">Fuso horário para exibição de datas e horas</p>
                </div>
                <Select
                  value={preferences.timezone}
                  onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                >
                  <SelectTrigger className="w-[130px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">UTC-3</SelectItem>
                    <SelectItem value="America/New_York">UTC-5</SelectItem>
                    <SelectItem value="America/Los_Angeles">UTC-8</SelectItem>
                    <SelectItem value="Europe/London">UTC+0</SelectItem>
                    <SelectItem value="Europe/Paris">UTC+1</SelectItem>
                    <SelectItem value="Asia/Tokyo">UTC+9</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Formato de Data - Layout Inline */}
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <Label className="font-medium text-sm">{t('settings.dateFormat')}</Label>
                  <p className="text-xs text-muted-foreground">Formato de exibição de datas</p>
                </div>
                <Select
                  value={preferences.dateFormat}
                  onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                >
                  <SelectTrigger className="w-[130px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Formato de Hora - Layout Inline */}
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <Label className="font-medium text-sm">{t('settings.timeFormat')}</Label>
                  <p className="text-xs text-muted-foreground">Formato de exibição de horas</p>
                </div>
                <Select
                  value={preferences.timeFormat}
                  onValueChange={(value) => setPreferences({ ...preferences, timeFormat: value })}
                >
                  <SelectTrigger className="w-[100px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24h</SelectItem>
                    <SelectItem value="12h">12h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Zona de Perigo */}
          <div className="space-y-3 pt-4 border-t border-red-500/20">
            <h2 className="text-base font-medium text-red-400">{t('settings.dangerZone')}</h2>
            <div className="space-y-2">
              {/* Sair de Todos Dispositivos */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">{t('settings.signOutAll')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.signOutAllDesc')}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <LogOut className="h-3.5 w-3.5" />
                      {t('settings.signOut')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('settings.signOutAllTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('settings.signOutAllConfirm')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSignOutAllDevices}>
                        {t('common.confirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Deletar Conta */}
              <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <div>
                  <p className="font-medium text-sm text-red-400">{t('settings.deleteAccount')}</p>
                  <p className="text-xs text-red-400/70">
                    {t('settings.deleteAccountDesc')}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('common.delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-400">
                        {t('settings.deleteAccountTitle')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('settings.deleteAccountConfirm')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('settings.deleting')}
                          </>
                        ) : (
                          t('settings.deleteAccountButton')
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      {/* 2FA Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {twoFactorStep === 'disable' ? 'Desativar 2FA' : 'Configurar 2FA'}
            </DialogTitle>
            <DialogDescription>
              {twoFactorStep === 'disable' 
                ? 'Tem certeza que deseja desativar a autenticação em dois fatores?' 
                : 'Escaneie o QR code com seu aplicativo autenticador'
              }
            </DialogDescription>
          </DialogHeader>

          {twoFactorStep === 'disable' ? (
            <div className="space-y-4">
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                <p className="font-medium">⚠️ Atenção</p>
                <p className="text-xs mt-1">
                  Ao desativar o 2FA, sua conta ficará menos protegida. Qualquer pessoa com sua senha poderá acessar sua conta.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShow2FADialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDisable2FA}
                  disabled={verifying2FA}
                >
                  {verifying2FA ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Desativando...
                    </>
                  ) : (
                    'Desativar 2FA'
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QR Code */}
              {qrCode && (
                <div className="flex flex-col items-center space-y-3">
                  <div className="bg-white p-3 rounded-lg">
                    <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Use o Google Authenticator, Authy ou outro app compatível
                  </p>
                </div>
              )}

              {/* Secret Key */}
              {totpSecret && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Não consegue escanear? Use este código:
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                      {totpSecret}
                    </code>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9 shrink-0"
                      onClick={copySecret}
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Verification Code Input */}
              <div className="space-y-2">
                <Label htmlFor="verification-code">Código de verificação</Label>
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Digite o código de 6 dígitos do seu app autenticador
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShow2FADialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleVerify2FA}
                  disabled={verifying2FA || verificationCode.length !== 6}
                >
                  {verifying2FA ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar e Ativar'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
