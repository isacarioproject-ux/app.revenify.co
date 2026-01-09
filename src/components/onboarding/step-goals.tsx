import { useState } from 'react'
import { WizardStepWrapper } from './wizard-step-wrapper'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface StepGoalsProps {
  onNext: (data: { goals: string[] }) => void
  onBack: () => void
  onSkip: () => void
  initialData?: { goals?: string[] }
}

const goalOptions = [
  {
    id: 'track-sales',
    title: 'Rastrear origem das vendas',
    description: 'Entenda de onde vêm suas conversões',
  },
  {
    id: 'optimize-campaigns',
    title: 'Otimizar campanhas de marketing',
    description: 'Melhore ROI dos seus anúncios',
  },
  {
    id: 'customer-journey',
    title: 'Entender jornada do cliente',
    description: 'Visualize o caminho até a conversão',
  },
  {
    id: 'calculate-roi',
    title: 'Calcular ROI de canais',
    description: 'Compare performance de diferentes fontes',
  },
  {
    id: 'integrations',
    title: 'Integrar com ferramentas',
    description: 'Conecte Stripe, Zapier e mais',
  },
]

export function StepGoals({ onNext, onBack, onSkip, initialData }: StepGoalsProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    initialData?.goals || []
  )

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) => {
      if (prev.includes(goalId)) {
        return prev.filter((id) => id !== goalId)
      }

      if (prev.length >= 3) {
        toast.error('Selecione no máximo 3 objetivos')
        return prev
      }

      return [...prev, goalId]
    })
  }

  const handleNext = () => {
    if (selectedGoals.length === 0) {
      toast.error('Selecione ao menos 1 objetivo')
      return
    }
    onNext({ goals: selectedGoals })
  }

  return (
    <WizardStepWrapper
      title="Quais seus objetivos?"
      description="Selecione até 3 objetivos principais (opcional)"
      onNext={handleNext}
      onBack={onBack}
      onSkip={onSkip}
      showSkip
      nextDisabled={selectedGoals.length === 0}
    >
      <div className="space-y-3">
        {goalOptions.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id)

          return (
            <Card
              key={goal.id}
              className={cn(
                'p-4 cursor-pointer transition-all hover:shadow-md',
                isSelected && 'border-primary bg-primary/5'
              )}
              onClick={() => toggleGoal(goal.id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{goal.title}</h3>
                    {isSelected && (
                      <Badge variant="secondary" className="text-xs">
                        Selecionado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {goal.description}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {selectedGoals.length} de 3 objetivos selecionados
      </div>
    </WizardStepWrapper>
  )
}
