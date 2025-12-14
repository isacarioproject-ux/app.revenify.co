import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Check, Zap, Crown, Building2 } from 'lucide-react'
import { PLANS } from '@/lib/stripe/plans'
import { useSubscription } from '@/contexts/subscription-context'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function PricingPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { subscription } = useSubscription()
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const currentPlan = subscription?.plan || 'free'

  const formatPrice = (price: number) => {
    if (price === 0) return t('pricing.free')
    return `$${price}`
  }

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      toast.info(t('pricing.alreadyFree'))
      return
    }

    if (planId === currentPlan) {
      toast.info(t('pricing.alreadyOnPlan'))
      return
    }

    setLoading(planId)

    try {
      // Redirecionar para billing com o plano selecionado
      navigate(`/settings/billing?upgrade=${planId}&interval=${interval}`)
    } catch (error) {
      toast.error(t('pricing.error'))
    } finally {
      setLoading(null)
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return Zap
      case 'pro':
        return Crown
      case 'business':
        return Building2
      default:
        return Check
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{t('pricing.title')}</h1>
          <p className="text-muted-foreground">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Interval Toggle */}
        <div className="flex items-center justify-center gap-4">
          <Label htmlFor="interval" className={cn(interval === 'monthly' && 'font-semibold')}>
            {t('pricing.monthly')}
          </Label>
          <Switch
            id="interval"
            checked={interval === 'yearly'}
            onCheckedChange={(checked) => setInterval(checked ? 'yearly' : 'monthly')}
          />
          <Label htmlFor="interval" className={cn(interval === 'yearly' && 'font-semibold')}>
            {t('pricing.yearly')}
            <Badge variant="secondary" className="ml-2">
              {t('pricing.saveMonths')}
            </Badge>
          </Label>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Object.values(PLANS).map((plan) => {
            const Icon = getPlanIcon(plan.id)
            const isCurrentPlan = plan.id === currentPlan
            const price = plan.price[interval]
            
            return (
              <Card 
                key={plan.id}
                className={cn(
                  'relative transition-all',
                  plan.popular && 'border-primary shadow-lg',
                  isCurrentPlan && 'ring-2 ring-primary'
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    {t('pricing.mostPopular')}
                  </Badge>
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      'p-2 rounded-lg',
                      plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex flex-col h-full">
                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {formatPrice(price)}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground">
                          /{interval === 'monthly' ? t('pricing.mo') : t('pricing.yr')}
                        </span>
                      )}
                    </div>
                    {interval === 'yearly' && price > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ${(price / 12).toFixed(0)}/{t('pricing.mo')} {t('pricing.billedAnnually')}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button - Only for paid plans */}
                  {plan.id !== 'free' && (
                    <Button
                      className="w-full mt-6"
                      variant={plan.popular ? 'default' : 'outline'}
                      disabled={isCurrentPlan || loading === plan.id}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {loading === plan.id ? (
                        t('common.processing')
                      ) : isCurrentPlan ? (
                        t('pricing.currentPlan')
                      ) : (
                        t('pricing.upgrade')
                      )}
                    </Button>
                  )}
                  {plan.id === 'free' && isCurrentPlan && (
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                      {t('pricing.currentPlan')}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ or Additional Info */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t('pricing.faq')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">{t('pricing.faq1Question')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('pricing.faq1Answer')}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">{t('pricing.faq2Question')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('pricing.faq2Answer')}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">{t('pricing.faq3Question')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('pricing.faq3Answer')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
