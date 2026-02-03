import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Zap, AlertCircle } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useI18n } from '@/hooks/use-i18n'
import { useSubscription } from '@/contexts/subscription-context'
import { useAuth } from '@/contexts/auth-context'
import { PLANS } from '@/lib/stripe/plans'
import { redirectToCheckout } from '@/lib/stripe'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { HeaderSkeleton, MetricCardSkeleton, CardSkeleton } from '@/components/page-skeleton'

export default function BillingPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { subscription, loading: subLoading } = useSubscription()
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')

  const currentPlan = subscription?.plan || 'free'
  const currentPlanData = PLANS[currentPlan]
  const upgradePlan = searchParams.get('upgrade')

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) {
      toast.info('Você já está neste plano')
      return
    }

    if (planId === 'free') {
      toast.info('Para fazer downgrade, entre em contato com o suporte')
      return
    }

    if (!user?.id || !user?.email) {
      toast.error('Você precisa estar logado para fazer upgrade')
      return
    }

    setLoading(planId)
    
    try {
      await redirectToCheckout({
        planId,
        interval: billingInterval,
        userId: user.id,
        userEmail: user.email,
      })
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Erro ao iniciar checkout', {
        description: 'Tente novamente ou entre em contato com o suporte'
      })
    } finally {
      setLoading(null)
    }
  }

  const usagePercent = subscription 
    ? (subscription.current_monthly_events / subscription.max_monthly_events) * 100 
    : 0

  if (subLoading) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
          <HeaderSkeleton />
          <CardSkeleton lines={4} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header with Plan Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('billing.title')}</h1>
            <p className="text-muted-foreground">
              {t('billing.description')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={currentPlan === 'free' ? 'secondary' : 'default'}
              className={cn(
                "text-sm px-3 py-1",
                currentPlan === 'pro' && 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0',
                currentPlan === 'business' && 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0'
              )}
            >
              {currentPlanData?.name || 'Free'}
            </Badge>
          </div>
        </div>

        {/* Usage Warning */}
        {usagePercent > 80 && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium">{t('billing.nearLimit')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('billing.nearLimitDesc')}
                </p>
              </div>
              <Button onClick={() => handleUpgrade('starter')}>
                {t('billing.upgrade')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('billing.choosePlan')}</h2>
            <div className="flex items-center gap-3">
              <Label 
                htmlFor="billing-toggle" 
                className={cn(
                  "text-sm cursor-pointer",
                  billingInterval === 'monthly' ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {t('billing.monthly')}
              </Label>
              <Switch
                id="billing-toggle"
                checked={billingInterval === 'yearly'}
                onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
              />
              <Label 
                htmlFor="billing-toggle" 
                className={cn(
                  "text-sm cursor-pointer flex items-center gap-1",
                  billingInterval === 'yearly' ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {t('billing.yearly')}
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  -20%
                </Badge>
              </Label>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.values(PLANS).map((plan) => {
              const isCurrentPlan = plan.id === currentPlan
              
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
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Zap className="h-3 w-3 mr-1" />
                        {t('billing.popular')}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="text-xs">{plan.description}</CardDescription>
                    <div className="pt-2">
                      <span className="text-2xl font-bold">
                        {plan.price.monthly === 0 
                          ? 'Free' 
                          : billingInterval === 'yearly'
                            ? `R$ ${Math.round(plan.price.yearly / 12)}`
                            : `R$ ${plan.price.monthly}`
                        }
                      </span>
                      {plan.price.monthly > 0 && (
                        <span className="text-muted-foreground text-sm">/mês</span>
                      )}
                      {billingInterval === 'yearly' && plan.price.yearly > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          R$ {plan.price.yearly}/ano
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col h-full space-y-4">
                    <ul className="space-y-1.5 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {/* Botão apenas para planos pagos ou se é o plano atual */}
                    {plan.id !== 'free' ? (
                      <Button 
                        className="w-full mt-auto" 
                        variant={isCurrentPlan ? 'outline' : plan.popular ? 'default' : 'outline'}
                        disabled={isCurrentPlan}
                        loading={loading === plan.id}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {isCurrentPlan ? t('billing.currentPlan') : t('billing.upgrade')}
                      </Button>
                    ) : isCurrentPlan ? (
                      <div className="text-center text-sm text-muted-foreground mt-auto py-2">
                        {t('billing.currentPlan')}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>{t('billing.faqTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left text-sm">
                  {t('billing.faq1Question')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  {t('billing.faq1Answer')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left text-sm">
                  {t('billing.faq2Question')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  {t('billing.faq2Answer')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left text-sm">
                  {t('billing.faq3Question')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  {t('billing.faq3Answer')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
