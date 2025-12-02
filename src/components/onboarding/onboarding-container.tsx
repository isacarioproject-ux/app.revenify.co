import { useState, useEffect } from 'react'
import { useOnboarding } from '@/hooks/use-onboarding'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Database } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useI18n } from '@/hooks/use-i18n'
import { WelcomeStep } from './steps/welcome-step'
import { UserTypeStep } from './steps/user-type-step'
import { GoalsStep } from './steps/goals-step'
import { WorkspaceStep } from './steps/workspace-step'
import { TeamInviteStep } from './steps/team-invite-step'
import { PricingStep } from './steps/pricing-step'
import { TourStep } from './steps/tour-step'
import { FirstTaskStep } from './steps/first-task-step'
import { ManagementStep } from './steps/management-step'
import { BudgetStep } from './steps/budget-step'
import { CompletionStep } from './steps/completion-step'

const STEPS = [
  { id: 1, component: WelcomeStep },
  { id: 2, component: WorkspaceStep },
  { id: 3, component: TeamInviteStep },
  { id: 4, component: PricingStep },
  { id: 5, component: UserTypeStep },
  { id: 6, component: GoalsStep },
  { id: 7, component: TourStep },
  { id: 8, component: FirstTaskStep },
  { id: 9, component: ManagementStep },
  { id: 10, component: BudgetStep },
  { id: 11, component: CompletionStep }
]

export function OnboardingContainer() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  const {
    currentStep,
    totalSteps,
    progress,
    nextStep,
    previousStep,
    skip,
    complete,
    isFirst,
    isLast
  } = useOnboarding()

  // Verificar se tabela existe
  useEffect(() => {
    const checkTable = async () => {
      if (!user) return

      try {
        const { error } = await supabase
          .from('onboarding_analytics')
          .select('id')
          .limit(1)

        setTableExists(!error)
        
        if (error) {
          console.error('⚠️ Tabela onboarding_analytics não encontrada:', error.message)
        }
      } catch (error) {
        console.error('Erro ao verificar tabela:', error)
        setTableExists(false)
      } finally {
        setChecking(false)
      }
    }

    checkTable()
  }, [user])

  const CurrentStepComponent = STEPS[currentStep - 1]?.component

  const handleNext = async (data?: any) => {
    if (isLast) {
      await complete()
    } else {
      await nextStep(data)
    }
  }

  // Mostrar loading enquanto verifica
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  // Mostrar erro se tabela não existe
  if (tableExists === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-2xl border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Configuração Necessária</CardTitle>
            <CardDescription>
              A tabela de onboarding não foi encontrada no banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Passo 1: Acesse o Supabase</p>
                  <p className="text-sm text-muted-foreground">
                    Vá para o SQL Editor no seu projeto Supabase
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Passo 2: Execute o SQL</p>
                  <p className="text-sm text-muted-foreground">
                    Copie e execute o script SQL do arquivo onboarding.md
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Passo 3: Recarregue a página</p>
                  <p className="text-sm text-muted-foreground">
                    Após executar o SQL, recarregue esta página
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={skip} className="flex-1">
                Pular por enquanto
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!CurrentStepComponent) return null

  return (
    <div className={`min-h-screen w-full relative text-gray-800 flex overflow-hidden ${currentStep === 4 ? 'bg-gray-50' : 'bg-white items-center justify-center p-4'}`}>
      {/* Crosshatch Art - Light Pattern - esconder no passo 4 */}
      {currentStep !== 4 && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(22.5deg, transparent, transparent 2px, rgba(75, 85, 99, 0.06) 2px, rgba(75, 85, 99, 0.06) 3px, transparent 3px, transparent 8px),
              repeating-linear-gradient(67.5deg, transparent, transparent 2px, rgba(107, 114, 128, 0.05) 2px, rgba(107, 114, 128, 0.05) 3px, transparent 3px, transparent 8px),
              repeating-linear-gradient(112.5deg, transparent, transparent 2px, rgba(55, 65, 81, 0.04) 2px, rgba(55, 65, 81, 0.04) 3px, transparent 3px, transparent 8px),
              repeating-linear-gradient(157.5deg, transparent, transparent 2px, rgba(31, 41, 55, 0.03) 2px, rgba(31, 41, 55, 0.03) 3px, transparent 3px, transparent 8px)
            `,
          }}
        />
      )}

      {/* Link "Fazer depois" - visível em todos os passos exceto o primeiro e o último */}
      {currentStep > 1 && currentStep < totalSteps && (
        <button
          className="absolute top-4 right-4 z-10 text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
          onClick={() => nextStep()}
        >
          {t('onboarding.doLater') || 'Fazer depois'}
        </button>
      )}

      {/* Progress - esconder nos passos 1-12 */}
      {currentStep !== 1 && currentStep !== 2 && currentStep !== 3 && currentStep !== 4 && currentStep !== 5 && currentStep !== 6 && currentStep !== 7 && currentStep !== 8 && currentStep !== 9 && currentStep !== 10 && currentStep !== 11 && currentStep !== 12 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-10">
          <div className="space-y-2">
            <Progress value={progress} className="h-1" />
            <p className="text-xs text-center text-muted-foreground">
              Passo {currentStep} de {totalSteps}
            </p>
          </div>
        </div>
      )}

      <div className={`w-full ${currentStep === 4 ? '' : 'max-w-lg'} relative z-10`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              opacity: { duration: 0.2 }
            }}
            className="w-full"
          >
            <CurrentStepComponent
              onNext={handleNext}
              onBack={previousStep}
              onSkip={skip}
              isFirst={isFirst}
              isLast={isLast}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
