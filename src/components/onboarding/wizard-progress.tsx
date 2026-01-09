import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface WizardProgressProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function WizardProgress({ currentStep, totalSteps, className }: WizardProgressProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div className={cn('w-full space-y-2', className)}>
      <Progress value={progress} className="h-1" />
      <p className="text-center text-xs text-muted-foreground">
        Passo {currentStep} de {totalSteps}
      </p>
    </div>
  )
}
