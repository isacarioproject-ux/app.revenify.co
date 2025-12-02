import { Button } from '@/components/ui/button'
import type { OnboardingStepProps } from '@/types/onboarding'
import { PartyPopper, CheckCircle2, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

const achievements = [
  { icon: '👤', label: 'Perfil configurado' },
  { icon: '🏢', label: 'Workspace criado' },
  { icon: '✅', label: 'Tarefa criada' },
  { icon: '💰', label: 'Finanças experimentadas' },
  { icon: '📊', label: 'Projeto/Documento criado' },
  { icon: '💵', label: 'Orçamento configurado' },
]

export function CompletionStep({ onNext }: OnboardingStepProps) {
  const { user } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white/60 via-white/40 to-white/60 flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-lg space-y-3 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Header de Conclusão */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20 
            }}
            className="mx-auto w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center"
          >
            <PartyPopper className="h-6 w-6 text-white" />
          </motion.div>
          
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-gray-900">🎉 Tudo pronto!</h2>
            <p className="text-xs text-gray-600">
              Você completou o onboarding com sucesso
            </p>
          </div>
        </div>

        {/* Conteúdo - SEM CARD */}
        <div className="space-y-2">
        {/* Conquistas */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-center mb-1 text-gray-900">O que você conquistou:</p>
          {achievements.map((achievement, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm">{achievement.icon}</span>
              </div>
              <p className="text-xs font-medium flex-1">{achievement.label}</p>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </motion.div>
          ))}
        </div>

        {/* Botão de finalizar */}
        <Button 
          onClick={() => onNext()}
          className="w-full h-10 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
        >
          <PartyPopper className="mr-2 h-4 w-4" />
          Ir para o Dashboard
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
