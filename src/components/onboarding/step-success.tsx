import { WizardStepWrapper } from './wizard-step-wrapper'
import { OnboardingHeader } from './onboarding-header'
import { Card } from '@/components/ui/card'
import { CheckCircle2, TrendingUp, Link2, BarChart3, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface StepSuccessProps {
  onComplete: () => void
  data: {
    projectName?: string
    projectCreated?: boolean
    pixelInstalled?: boolean
    sourceCreated?: boolean
  }
}

const nextSteps = [
  {
    icon: TrendingUp,
    title: 'Criar fontes de tráfego',
    description: 'Configure UTMs para rastrear campanhas',
    link: '/sources',
  },
  {
    icon: Settings,
    title: 'Configurar integrações',
    description: 'Conecte Stripe, Zapier e outras ferramentas',
    link: '/settings/integrations',
  },
  {
    icon: BarChart3,
    title: 'Explorar analytics',
    description: 'Visualize métricas e jornadas do cliente',
    link: '/analytics',
  },
  {
    icon: Link2,
    title: 'Ver documentação',
    description: 'Aprenda tudo sobre o Revenify',
    link: 'https://www.revenify.co/docs',
    external: true,
  },
]

export function StepSuccess({ onComplete, data }: StepSuccessProps) {
  return (
    <div className="space-y-8">
      <OnboardingHeader showToggles={true} />

      <WizardStepWrapper
        title="Tudo configurado!"
        description="Você está pronto para começar a rastrear suas conversões"
        onNext={onComplete}
        nextLabel="Ir para Dashboard"
        showBack={false}
      >

      {/* Summary */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">Resumo da configuração:</h3>
        <div className="space-y-2">
          {data.projectCreated && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                Projeto <span className="font-medium">{data.projectName}</span> criado
              </span>
            </div>
          )}
          {data.pixelInstalled ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Pixel instalado</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Pendente
              </Badge>
              <span className="text-sm text-muted-foreground">
                Instale o pixel no seu site
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Next Steps */}
      <div className="space-y-3">
        <h3 className="font-semibold">Próximos passos:</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {nextSteps.map((step) => {
            const Icon = step.icon
            return (
              <Card
                key={step.title}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
      </WizardStepWrapper>
    </div>
  )
}
