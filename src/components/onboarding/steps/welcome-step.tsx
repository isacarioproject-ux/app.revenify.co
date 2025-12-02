import { Button } from '@/components/ui/button'
import type { OnboardingStepProps } from '@/types/onboarding'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { HelpCircle } from 'lucide-react'

export function WelcomeStep({ onNext }: OnboardingStepProps) {
  const { user } = useAuth()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Gradiente branco de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-white/60 pointer-events-none" />
      
      <div className="relative w-full max-w-lg space-y-6 sm:space-y-8">
        {/* Logo com gradiente colorido de fundo */}
        <div className="text-center space-y-4 sm:space-y-6 px-4">
          <div className="relative inline-block">
            {/* Gradiente colorido atrás do logo */}
            <div className="absolute inset-0 blur-2xl sm:blur-3xl opacity-40">
              <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-400 rounded-full"></div>
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-0 left-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-yellow-400 rounded-full"></div>
              <div className="absolute bottom-0 right-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-red-400 rounded-full"></div>
            </div>
            
            {/* Logo */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 relative z-10" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Isacar.dev
            </h1>
          </div>
          
          {/* Título */}
          <h2 className="text-lg sm:text-xl text-gray-600 font-medium">
            Bem-vindos ao Isacar.dev
          </h2>
        </div>

        {/* Lista de passos centralizada */}
        <div className="max-w-md mx-auto space-y-4 sm:space-y-6 text-center px-4">
          <div>
            <p className="font-semibold text-gray-900 text-base sm:text-lg">Conte-nos sobre você</p>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Para personalizar sua experiência</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-base sm:text-lg">Configure seu workspace</p>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Crie seu espaço de trabalho</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-base sm:text-lg">Experimente as funcionalidades</p>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Crie sua primeira tarefa, transação e projeto</p>
          </div>
        </div>

      {/* Botão começar - estilo preto como na imagem */}
      <div className="flex justify-center pt-2 sm:pt-4 px-4">
        <Button 
          onClick={() => onNext()} 
          className="w-full sm:w-64 h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg"
        >
          Começar
        </Button>
      </div>
      </div>

      {/* Info do usuário no canto inferior esquerdo */}
      <div className="fixed bottom-4 left-4 text-sm text-gray-600 space-y-1 z-20">
        <p className="text-xs">Você está conectado como <span className="font-medium">{user?.email}</span></p>
        <button 
          onClick={handleLogout}
          className="text-gray-500 hover:text-gray-700 underline text-xs block"
        >
          Entrar como outro usuário
        </button>
      </div>
    </div>
  )
}
