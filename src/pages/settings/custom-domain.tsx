import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Globe, 
  Check, 
  X, 
  Loader2, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  Shield,
  Zap
} from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { useSubscription } from '@/contexts/subscription-context'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getPlanLimits } from '@/lib/stripe/plans'

type DnsStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'error'

export default function CustomDomainPage() {
  const { t } = useI18n()
  const { subscription, refetch } = useSubscription()
  const { user } = useAuth()
  const [domain, setDomain] = useState('')
  const [dnsStatus, setDnsStatus] = useState<DnsStatus>('idle')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [copied, setCopied] = useState(false)

  const planLimits = getPlanLimits(subscription?.plan || 'free')
  const canUseCustomDomain = planLimits.custom_domain_enabled
  const currentDomain = subscription?.custom_short_domain

  useEffect(() => {
    if (currentDomain) {
      setDomain(currentDomain)
    }
  }, [currentDomain])

  const validateDomain = (value: string): boolean => {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    return domainRegex.test(value)
  }

  const checkDns = async () => {
    if (!domain || !validateDomain(domain)) {
      toast.error(t('customDomain.invalidDomain'))
      return
    }

    setDnsStatus('checking')

    try {
      // Verificar DNS usando API pública
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`)
      const data = await response.json()

      if (data.Answer && data.Answer.length > 0) {
        // Verificar se aponta para nosso domínio
        const cnameTarget = data.Answer[0].data?.toLowerCase()
        if (cnameTarget?.includes('revenify') || cnameTarget?.includes('supabase')) {
          setDnsStatus('valid')
          toast.success(t('customDomain.dnsValid'))
        } else {
          setDnsStatus('invalid')
          toast.error(t('customDomain.dnsInvalidTarget'))
        }
      } else {
        setDnsStatus('invalid')
        toast.error(t('customDomain.dnsNotFound'))
      }
    } catch (error) {
      console.error('DNS check error:', error)
      setDnsStatus('error')
      toast.error(t('customDomain.dnsCheckError'))
    }
  }

  const saveDomain = async () => {
    if (!user?.id || !domain) return

    if (!validateDomain(domain)) {
      toast.error(t('customDomain.invalidDomain'))
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ custom_short_domain: domain })
        .eq('user_id', user.id)

      if (error) throw error

      await refetch()
      toast.success(t('customDomain.saved'))
    } catch (error) {
      console.error('Error saving domain:', error)
      toast.error(t('customDomain.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const removeDomain = async () => {
    if (!user?.id) return

    setRemoving(true)

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ custom_short_domain: null })
        .eq('user_id', user.id)

      if (error) throw error

      setDomain('')
      setDnsStatus('idle')
      await refetch()
      toast.success(t('customDomain.removed'))
    } catch (error) {
      console.error('Error removing domain:', error)
      toast.error(t('customDomain.removeError'))
    } finally {
      setRemoving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(t('common.copied'))
    setTimeout(() => setCopied(false), 2000)
  }

  const cnameTarget = 'links.revenify.co'

  if (!canUseCustomDomain) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t('customDomain.title')}</h1>
            <p className="text-muted-foreground">{t('customDomain.subtitle')}</p>
          </div>

          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('customDomain.upgradeRequired')}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t('customDomain.upgradeDesc')}
              </p>
              <Button asChild>
                <a href="/settings/billing?upgrade=pro">
                  <Zap className="mr-2 h-4 w-4" />
                  {t('customDomain.upgradeToPro')}
                </a>
              </Button>
            </CardContent>
          </Card>
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
            <h1 className="text-2xl font-bold">{t('customDomain.title')}</h1>
            <p className="text-muted-foreground">{t('customDomain.subtitle')}</p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {subscription?.plan?.toUpperCase()}
          </Badge>
        </div>

        {/* Current Domain Status */}
        {currentDomain && (
          <Alert className="border-emerald-500/50 bg-emerald-500/10">
            <Check className="h-4 w-4 text-emerald-500" />
            <AlertTitle className="text-emerald-600">{t('customDomain.active')}</AlertTitle>
            <AlertDescription>
              {t('customDomain.activeDesc', { domain: currentDomain })}
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('customDomain.configure')}
            </CardTitle>
            <CardDescription>
              {t('customDomain.configureDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Domain Input */}
            <div className="space-y-2">
              <Label htmlFor="domain">{t('customDomain.yourDomain')}</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  placeholder="links.seusite.com"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value.toLowerCase().trim())
                    setDnsStatus('idle')
                  }}
                  className={cn(
                    "flex-1",
                    dnsStatus === 'valid' && "border-emerald-500 focus-visible:ring-emerald-500",
                    dnsStatus === 'invalid' && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                <Button 
                  variant="outline" 
                  onClick={checkDns}
                  disabled={!domain || dnsStatus === 'checking'}
                >
                  {dnsStatus === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('customDomain.verifyDns')
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('customDomain.domainHint')}
              </p>
            </div>

            {/* DNS Status */}
            {dnsStatus !== 'idle' && dnsStatus !== 'checking' && (
              <Alert className={cn(
                dnsStatus === 'valid' && "border-emerald-500/50 bg-emerald-500/10",
                dnsStatus === 'invalid' && "border-red-500/50 bg-red-500/10",
                dnsStatus === 'error' && "border-yellow-500/50 bg-yellow-500/10"
              )}>
                {dnsStatus === 'valid' && <Check className="h-4 w-4 text-emerald-500" />}
                {dnsStatus === 'invalid' && <X className="h-4 w-4 text-red-500" />}
                {dnsStatus === 'error' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                <AlertTitle>
                  {dnsStatus === 'valid' && t('customDomain.dnsVerified')}
                  {dnsStatus === 'invalid' && t('customDomain.dnsNotVerified')}
                  {dnsStatus === 'error' && t('customDomain.dnsError')}
                </AlertTitle>
                <AlertDescription>
                  {dnsStatus === 'valid' && t('customDomain.dnsVerifiedDesc')}
                  {dnsStatus === 'invalid' && t('customDomain.dnsNotVerifiedDesc')}
                  {dnsStatus === 'error' && t('customDomain.dnsErrorDesc')}
                </AlertDescription>
              </Alert>
            )}

            {/* DNS Instructions */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t('customDomain.dnsInstructions')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('customDomain.dnsInstructionsDesc')}
              </p>
              
              <div className="bg-background rounded-md border p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">{t('customDomain.recordType')}</p>
                    <p className="font-mono font-medium">CNAME</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">{t('customDomain.recordName')}</p>
                    <p className="font-mono font-medium">links</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">{t('customDomain.recordValue')}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium">{cnameTarget}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(cnameTarget)}
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {t('customDomain.dnsPropagation')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              {currentDomain && (
                <Button 
                  variant="outline" 
                  onClick={removeDomain}
                  disabled={removing}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {removing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  {t('customDomain.remove')}
                </Button>
              )}
              <Button 
                onClick={saveDomain}
                disabled={saving || !domain || !validateDomain(domain)}
                className="flex-1"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {currentDomain ? t('customDomain.update') : t('customDomain.save')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('customDomain.needHelp')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('customDomain.helpDesc')}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://docs.revenify.co/custom-domain" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('customDomain.viewDocs')}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
