import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { OnboardingStepProps, UserType } from '@/types/onboarding'
import { User, Users, Building, Home } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

const USER_TYPES = [
  {
    value: 'freelancer' as UserType,
    label: 'Freelancer / Autônomo',
    description: 'Trabalho por conta própria',
    icon: User
  },
  {
    value: 'small_business' as UserType,
    label: 'Pequena Empresa',
    description: '2-10 pessoas',
    icon: Users
  },
  {
    value: 'enterprise' as UserType,
    label: 'Empresa',
    description: 'Mais de 10 pessoas',
    icon: Building
  },
  {
    value: 'personal' as UserType,
    label: 'Uso Pessoal',
    description: 'Projetos pessoais',
    icon: Home
  }
]

export function UserTypeStep({ onNext }: OnboardingStepProps) {
  const [selected, setSelected] = useState<UserType>()
  const { user } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleNext = () => {
    if (selected) {
      onNext({ userType: selected })
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
              👤 Quem é você?
            </h2>
            <p className="text-xs text-gray-500">
              Isso nos ajuda a personalizar sua experiência
            </p>
          </div>
        </div>

        {/* Opções de tipo de usuário - SEM CARD */}
        <div className="space-y-1.5">
          {USER_TYPES.map((type) => {
            const Icon = type.icon
            const isSelected = selected === type.value
            return (
              <button
                key={type.value}
                onClick={() => setSelected(type.value)}
                className={`
                  w-full flex items-center gap-2.5 p-2.5 rounded-lg border-2 transition-all
                  hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-md hover:scale-[1.01]
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.01]' 
                    : 'border-gray-200 bg-white/60'
                  }
                `}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-all duration-300 ${isSelected ? 'text-blue-600 scale-110' : 'text-gray-400'}`} />
                <div className="flex-1 text-left">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Botão Próximo - PRETO SEM ÍCONE */}
        <div className="mt-2">
          <Button 
            onClick={handleNext} 
            disabled={!selected}
            className="w-full h-10 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </Button>
        </div>
      </div>

      {/* Info do usuário no canto inferior esquerdo */}
      <div className="fixed bottom-8 left-4 text-sm text-gray-600 space-y-2 z-20">
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

    </div>
  )
}
