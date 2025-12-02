import { useState } from 'react'
import { Button } from '@/components/ui/button'
// Removed unused import HelpCircle
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { PricingSection } from '@/components/ui/pricing-section'

interface PricingStepProps {
  onNext: () => void
}

const plans = [
  {
    name: "Grátis",
    info: "Perfeito para começar",
    price: {
      mensal: "Personalizado",
      anual: "Personalizado",
    },
    features: [
      { text: "1 projeto" },
      { text: "3 whiteboards por projeto" },
      { text: "Até 2 membros (você + 1 convidado)" },
      { text: "1 GB de armazenamento" },
      { text: "Documentos ilimitados" },
      { text: "Suporte por email" },
    ],
    highlighted: false,
    id: 'free' as const,
  },
  {
    name: "Pro",
    info: "Para equipes pequenas",
    price: {
      mensal: 65,
      anual: 624,
    },
    originalPrice: 780,
    discount: 20,
    features: [
      { text: "Até 5 projetos" },
      { text: "Whiteboards ilimitados" },
      { text: "Até 10 membros (5 free + 5 pro)" },
      { text: "50 GB de armazenamento" },
      { text: "Documentos ilimitados" },
      { text: "Analytics avançado" },
      { text: "Exportação CSV/JSON" },
      { text: "Suporte prioritário" },
    ],
    highlighted: true,
    id: 'pro' as const,
  },
  {
    name: "Business",
    info: "Para empresas em crescimento",
    price: {
      mensal: 197,
      anual: 1891,
    },
    originalPrice: 2364,
    discount: 20,
    features: [
      { text: "Projetos ilimitados" },
      { text: "Whiteboards ilimitados" },
      { text: "Membros ilimitados" },
      { text: "200 GB de armazenamento" },
      { text: "Documentos ilimitados" },
      { text: "Branding customizado" },
      { text: "SSO (Single Sign-On)" },
      { text: "Backup automático" },
      { text: "Suporte 24/7" },
    ],
    highlighted: false,
    id: 'business' as const,
  },
  {
    name: "Enterprise",
    info: "Para grandes organizações",
    price: {
      mensal: "Personalizado",
      anual: "Personalizado",
    },
    features: [
      { text: "Tudo do Business +" },
      { text: "Armazenamento ilimitado" },
      { text: "On-premise deployment" },
      { text: "SLA 99.9%" },
      { text: "Auditoria de segurança" },
      { text: "Treinamento personalizado" },
      { text: "Integrações customizadas" },
      { text: "Contrato anual" },
    ],
    highlighted: false,
    id: 'enterprise' as const,
  },
]

export const PricingStep = ({ onNext }: PricingStepProps) => {
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'business' | 'enterprise'>('pro')
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleSelectPlan = async (planId: 'free' | 'pro' | 'business' | 'enterprise') => {
    setLoading(true)
    try {
      // Buscar workspace do usuário
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user?.id)
        .eq('role', 'owner')
        .single()

      if (membership?.workspace_id) {
        // Atualizar plano do workspace
        const trialEndsAt = planId === 'free' 
          ? null 
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 dias trial

        const maxMembers = planId === 'free' ? 2 : planId === 'pro' ? 10 : 999

        await supabase
          .from('workspaces')
          .update({
            plan_type: planId,
            trial_ends_at: trialEndsAt,
            max_members: maxMembers,
          })
          .eq('id', membership.workspace_id)

        const planNames = {
          free: 'Grátis',
          pro: 'Pro',
          business: 'Business',
          enterprise: 'Enterprise'
        }

        toast.success(`Plano ${planNames[planId]} selecionado!`)
      }

      onNext()
    } catch (error: any) {
      console.error('Erro ao selecionar plano:', error)
      toast.error('Erro ao selecionar plano')
    } finally {
      setLoading(false)
    }
  }

  // Adicionar onClick e selected aos planos
  const plansWithActions = plans.map(plan => ({
    ...plan,
    onClick: () => setSelectedPlan(plan.id),
    selected: selectedPlan === plan.id,
    // Não adicionar botão no plano free
    btn: plan.id === 'free' ? undefined : {
      text: loading ? 'Processando...' : 'Selecionar Plano',
      onClick: () => handleSelectPlan(plan.id),
    }
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center py-8 px-4">
      {/* PricingSection da landing page */}
      <div className="w-full">
        <PricingSection
          plans={plansWithActions}
        />
      </div>

      {/* Link "Comece de graça" */}
      <div className="w-full flex justify-center mt-4 pb-20 sm:pb-4">
        <button
          onClick={onNext}
          disabled={loading}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
        >
          Comece de graça: escolha um plano mais tarde
        </button>
      </div>

      {/* Info do usuário no canto inferior esquerdo */}
      <div className="fixed bottom-4 left-4 text-sm text-gray-600 dark:text-gray-400 space-y-2 z-20">
        <p className="text-xs">Você está conectado como <span className="font-medium">{user?.email}</span></p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Entrar com outro usuário
        </Button>
      </div>
    </div>
  )
}
