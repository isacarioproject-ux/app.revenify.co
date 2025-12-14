import { useState } from 'react'
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
import { Lock, Sparkles, Check, AlertTriangle, X } from 'lucide-react'

export function TrialExpiredModal() {
  const { t } = useI18n()
  const { subscription } = useSubscription()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  // Verificar se o trial expirou
  const isTrialExpired = 
    subscription?.status === 'trialing' && 
    subscription?.trial_ends_at && 
    new Date(subscription.trial_ends_at) < new Date() &&
    !subscription?.stripe_subscription_id

  // Mostrar modal se trial expirou (mas pode fechar e continuar usando até limite)
  const shouldShowModal = isTrialExpired && !dismissed

  if (!shouldShowModal) {
    return null
  }

  const plans = [
    {
      name: 'Starter',
      price: '$8',
      features: ['10.000 eventos/mês', '3 projetos', '500 links', '30 dias retenção'],
      popular: false,
    },
    {
      name: 'Pro',
      price: '$20',
      features: ['100.000 eventos/mês', '10 projetos', '5.000 links', '1 ano retenção', 'API Access'],
      popular: true,
    },
    {
      name: 'Business',
      price: '$50',
      features: ['1.000.000 eventos/mês', 'Projetos ilimitados', 'Links ilimitados', '3 anos retenção', 'API + Webhooks'],
      popular: false,
    },
  ]

  return (
    <Dialog open={true} onOpenChange={(open) => !open && setDismissed(true)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <DialogTitle className="text-2xl">
            {t('trial.trialExpired')}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t('trial.trialExpiredDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3 mt-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-lg border p-4 ${
                plan.popular ? 'border-primary shadow-lg' : 'border-border'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                  Popular
                </Badge>
              )}
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>
              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => navigate('/settings/billing')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Escolher {plan.name}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-lg bg-muted/50 flex items-start gap-3">
          <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Seus dados estão seguros</p>
            <p>
              Não perdemos nenhum dado durante o período de trial. Faça upgrade para continuar 
              de onde parou com todos os seus projetos, links e analytics.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
