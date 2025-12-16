import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '@/contexts/subscription-context'
import { useI18n } from '@/hooks/use-i18n'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Sparkles, Check, AlertTriangle, Crown, Zap } from 'lucide-react'
import { PLANS } from '@/lib/stripe/plans'

export function TrialExpiredModal() {
  const { t } = useI18n()
  const { subscription } = useSubscription()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)
  const [open, setOpen] = useState(false)

  // Verificar se o trial expirou
  const isTrialExpired = 
    subscription?.status === 'trialing' && 
    subscription?.trial_ends_at && 
    new Date(subscription.trial_ends_at) < new Date() &&
    !subscription?.stripe_subscription_id

  useEffect(() => {
    if (isTrialExpired && !dismissed) {
      // Check if already dismissed in this session
      const dismissedInSession = sessionStorage.getItem('trial_expired_dismissed')
      if (dismissedInSession === 'true') {
        return
      }
      setOpen(true)
    }
  }, [isTrialExpired, dismissed])

  const handleDismiss = () => {
    sessionStorage.setItem('trial_expired_dismissed', 'true')
    setDismissed(true)
    setOpen(false)
  }

  if (!isTrialExpired) {
    return null
  }

  // Planos baseados no PLANS do stripe/plans.ts
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'R$39',
      yearlyPrice: 'R$349',
      features: [
        `${PLANS.starter.limits.max_monthly_events.toLocaleString()} eventos/mês`,
        `${PLANS.starter.limits.max_projects} projetos`,
        `${PLANS.starter.limits.max_short_links} links`,
        `${PLANS.starter.limits.data_retention_days} dias retenção`,
        'Custom Domain',
        'A/B Testing (3)',
        'Geo Targeting (5)',
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 'R$99',
      yearlyPrice: 'R$949',
      features: [
        `${PLANS.pro.limits.max_monthly_events.toLocaleString()} eventos/mês`,
        `${PLANS.pro.limits.max_projects} projetos`,
        `${PLANS.pro.limits.max_short_links.toLocaleString()} links`,
        `${PLANS.pro.limits.data_retention_days} dias retenção`,
        'A/B Testing ilimitado',
        'Geo Targeting ilimitado',
        'Link Cloaking',
        'Webhooks',
      ],
      popular: true,
    },
    {
      id: 'business',
      name: 'Business',
      price: 'R$249',
      yearlyPrice: 'R$2390',
      features: [
        `${PLANS.business.limits.max_monthly_events.toLocaleString()} eventos/mês`,
        'Projetos ilimitados',
        'Links ilimitados',
        `${Math.floor(PLANS.business.limits.data_retention_days / 365)} anos retenção`,
        'SSO/SAML',
        'White-label',
        'Suporte dedicado',
      ],
      popular: false,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleDismiss()}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 overflow-hidden">
        {/* Header */}
        <div className="relative px-4 sm:px-6 pt-4 sm:pt-6 pb-4 bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-2xl" />
          
          <DialogHeader className="relative text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold">
                  Seu trial expirou
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Escolha um plano para continuar usando todas as features
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Plans Grid */}
        <div className="px-4 sm:px-6 py-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-3 sm:p-4 transition-all hover:shadow-md ${
                  plan.popular 
                    ? 'border-primary shadow-lg ring-1 ring-primary/20' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary px-3">
                    <Crown className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
                
                <div className="text-center mb-3">
                  <h3 className="font-semibold text-base sm:text-lg">{plan.name}</h3>
                  <div className="mt-1">
                    <span className="text-2xl sm:text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ou {plan.yearlyPrice}/ano (20% off)
                  </p>
                </div>
                
                <ul className="space-y-1.5 mb-3 text-xs sm:text-sm">
                  {plan.features.slice(0, 5).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="truncate">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-xs text-muted-foreground pl-5">
                      +{plan.features.length - 5} mais...
                    </li>
                  )}
                </ul>
                
                <Button
                  className={`w-full ${plan.popular ? '' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setOpen(false)
                    navigate('/settings/billing')
                  }}
                >
                  {plan.popular ? (
                    <>
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                      Escolher Pro
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Escolher {plan.name}
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
            <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-0.5">Seus dados estão seguros</p>
              <p>
                Não perdemos nenhum dado. Faça upgrade para continuar de onde parou.
              </p>
            </div>
          </div>
          
          <div className="mt-3 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={handleDismiss}
            >
              Continuar com plano Free (limitado)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
