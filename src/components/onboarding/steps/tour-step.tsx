import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { OnboardingStepProps } from '@/types/onboarding'
import { 
  LayoutDashboard, 
  CheckSquare, 
  DollarSign, 
  Settings,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

const TOUR_STEPS = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Seu painel central com visão geral de tudo',
    features: ['Cards personalizáveis', 'Métricas em tempo real', 'Atalhos rápidos']
  },
  {
    icon: CheckSquare,
    title: 'Tasks',
    description: 'Gerencie tarefas, projetos e prazos',
    features: ['Kanban board', 'Prioridades', 'Colaboração']
  },
  {
    icon: DollarSign,
    title: 'Finance',
    description: 'Controle completo das suas finanças',
    features: ['Receitas e despesas', 'Orçamento', 'Relatórios']
  },
  {
    icon: Settings,
    title: 'Configurações',
    description: 'Personalize tudo do seu jeito',
    features: ['Integrações', 'Equipe', 'Preferências']
  }
]

export function TourStep({ onNext, onSkip }: OnboardingStepProps) {
  const [currentTourStep, setCurrentTourStep] = useState(0)
  const { user } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isLastTourStep = currentTourStep === TOUR_STEPS.length - 1

  const handleNext = () => {
    if (isLastTourStep) {
      onNext({ completedTour: true })
    } else {
      setCurrentTourStep(prev => prev + 1)
    }
  }

  const currentStep = TOUR_STEPS[currentTourStep]
  const Icon = currentStep.icon

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white/60 via-white/40 to-white/60 flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-lg space-y-2 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Logo com gradiente colorido de fundo */}
        <div className="text-center space-y-1">
          <div className="relative inline-block">
            {/* Gradiente colorido atrás do logo */}
            <div className="absolute inset-0 blur-2xl sm:blur-3xl opacity-40 overflow-visible">
              <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-400 rounded-full"></div>
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-0 left-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-yellow-400 rounded-full"></div>
              <div className="absolute bottom-0 right-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-red-400 rounded-full"></div>
            </div>
            
            {/* Logo */}
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 relative z-10" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Isacar.dev
            </h1>
          </div>
        </div>

        {/* Header do Tour - SEM ÍCONE */}
        <div className="text-center space-y-1">
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tour rápido • {currentTourStep + 1}/{TOUR_STEPS.length}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{currentStep.title}</h2>
            <p className="text-sm text-gray-600">{currentStep.description}</p>
          </div>
        </div>

        {/* Features - SEM CARD */}
        <div className="space-y-1.5">
          {currentStep.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2.5 p-2.5 bg-white/60 rounded-lg border border-gray-200">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <ArrowRight className="h-3 w-3 text-blue-600" />
              </div>
              <p className="text-sm text-gray-700">{feature}</p>
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-1">
          {TOUR_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentTourStep 
                  ? 'w-8 bg-blue-600' 
                  : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Botões de Navegação */}
        <div className="flex gap-2 pt-1">
          {currentTourStep === 0 ? (
            <Button 
              variant="outline" 
              onClick={onSkip}
              className="h-10 text-sm font-medium border-gray-300 hover:bg-gray-100 bg-white/60"
            >
              Pular tour
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setCurrentTourStep(prev => prev - 1)}
              className="h-10 text-sm font-medium border-gray-300 hover:bg-gray-100 bg-white/60"
            >
              ← Anterior
            </Button>
          )}
          
          <Button 
            onClick={handleNext} 
            className="flex-1 h-10 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
          >
            {isLastTourStep ? 'Finalizar' : 'Próximo'}
          </Button>
        </div>
      </div>

      {/* Info do usuário no canto inferior esquerdo */}
      <div className="fixed bottom-4 left-4 text-sm text-gray-600 space-y-2 z-20">
        <p className="text-xs">Você está conectado como <span className="font-medium">{user?.email}</span></p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Entrar com outro usuário
        </Button>
      </div>

      {/* Ícone de ajuda no canto inferior direito */}
      <div className="fixed bottom-4 right-4 z-20">
        <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <HelpCircle className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
