import { useState } from 'react'
import { Check, Zap, Crown, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  price: number
  events: number
  features: string[]
  icon: React.ElementType
  popular?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    events: 10000,
    icon: Zap,
    features: [
      '10.000 eventos/mês',
      '1 projeto',
      'Relatórios básicos',
      'Suporte por email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    events: 50000,
    icon: Crown,
    popular: true,
    features: [
      '50.000 eventos/mês',
      '5 projetos',
      'Relatórios avançados',
      'API access',
      'Suporte prioritário',
      'Exportação de dados',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 249,
    events: 200000,
    icon: Rocket,
    features: [
      '200.000 eventos/mês',
      'Projetos ilimitados',
      'Relatórios customizados',
      'API access',
      'Suporte dedicado',
      'White-label',
      'SLA garantido',
    ],
  },
]

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan?: string
  onSelectPlan?: (planId: string) => void
}

export function UpgradeModal({ open, onOpenChange, currentPlan = 'free', onSelectPlan }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!selectedPlan) return
    
    setLoading(true)
    // Aqui você integraria com Stripe
    onSelectPlan?.(selectedPlan)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Upgrade seu Plano</DialogTitle>
          <DialogDescription>
            Escolha o plano ideal para o seu negócio e desbloqueie mais recursos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 py-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isSelected = selectedPlan === plan.id
            const isCurrent = currentPlan === plan.id

            return (
              <div
                key={plan.id}
                onClick={() => !isCurrent && setSelectedPlan(plan.id)}
                className={cn(
                  'relative rounded-xl border-2 p-6 cursor-pointer transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                  isCurrent && 'opacity-50 cursor-not-allowed',
                  plan.popular && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'p-2 rounded-lg',
                    plan.popular
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    {isCurrent && (
                      <span className="text-xs text-muted-foreground">Plano atual</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">R${plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={!selectedPlan || loading}
          >
            {loading ? 'Processando...' : 'Fazer Upgrade'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
