import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { OnboardingStepProps } from '@/types/onboarding'
import { CheckSquare, DollarSign, Briefcase, BarChart, HelpCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

const GOALS = [
  {
    id: 'tasks',
    label: 'Gerenciar tarefas e projetos',
    description: 'Organizar trabalho e acompanhar progresso',
    icon: CheckSquare
  },
  {
    id: 'finance',
    label: 'Controlar finanças',
    description: 'Receitas, despesas e orçamento',
    icon: DollarSign
  },
  {
    id: 'projects',
    label: 'Gestão de projetos',
    description: 'Cronogramas, entregas e equipe',
    icon: Briefcase
  },
  {
    id: 'analytics',
    label: 'Acompanhar métricas',
    description: 'Dashboards e relatórios',
    icon: BarChart
  }
]

export function GoalsStep({ onNext }: OnboardingStepProps) {
  const [selected, setSelected] = useState<string[]>([])
  const { user } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const toggleGoal = (goalId: string) => {
    setSelected(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    )
  }

  const handleNext = () => {
    if (selected.length > 0) {
      onNext({
        primaryGoal: selected[0],
        secondaryGoals: selected.slice(1)
      })
    }
  }

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
          
          {/* Título e descrição - MENOR */}
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-gray-700">
              🎯 O que você quer fazer?
            </h2>
            <p className="text-xs text-gray-500">
              Selecione uma ou mais opções
            </p>
          </div>
        </div>

        {/* Opções de objetivos - SEM CARD */}
        <div className="space-y-1.5">
          {GOALS.map((goal) => {
            const Icon = goal.icon
            const isSelected = selected.includes(goal.id)
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`
                  w-full flex items-center gap-2.5 p-2.5 rounded-lg border-2 transition-all
                  hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-md hover:scale-[1.01]
                  ${ isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.01]' 
                    : 'border-gray-200 bg-white/60'
                  }
                `}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-all duration-300 ${isSelected ? 'text-blue-600 scale-110' : 'text-gray-400'}`} />
                <div className="flex-1 text-left">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {goal.label}
                  </p>
                  <p className="text-xs text-gray-500">{goal.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Botão Próximo - PRETO SEM ÍCONE */}
        <div className="mt-2">
          <Button 
            onClick={handleNext} 
            disabled={selected.length === 0}
            className="w-full h-10 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
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
