import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Crown, Plus, X, Mail, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface TeamInviteStepProps {
  onNext: () => void
}

interface Invite {
  id: string
  email: string
  role: 'member' | 'admin'
}

export const TeamInviteStep = ({ onNext }: TeamInviteStepProps) => {
  const { user } = useAuth()
  const [invites, setInvites] = useState<Invite[]>([])
  const [currentEmail, setCurrentEmail] = useState('')
  const [currentRole, setCurrentRole] = useState<'member' | 'admin'>('member')
  const [loading, setLoading] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [planType, setPlanType] = useState<'free' | 'trial' | 'paid' | 'business'>('trial') // Novo usuário começa com trial
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)

  // Buscar workspace do usuário
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!user?.id) return

      const { data } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .limit(1)
        .maybeSingle()

      if (data) {
        setWorkspaceId(data.workspace_id)
        
        // Definir trial de 14 dias
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 14)
        setTrialEndsAt(trialEnd.toISOString())
      }
    }

    fetchWorkspace()
  }, [user?.id])

  // Limites por plano
  const MAX_INVITES = {
    free: 1,
    trial: 5,
    paid: 5,
    business: 999, // Ilimitado
  }

  const canAddMore = invites.length < MAX_INVITES[planType]
  // Tag de aviso aparece quando adicionar MAIS DE 1 convite (2 ou mais)
  // Isso avisa que no plano grátis só pode 1 convite
  const showUpgradeWarning = invites.length > 1

  const handleAddInvite = () => {
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(currentEmail)) {
      toast.error('Digite um email válido')
      return
    }

    // Verificar duplicatas
    if (invites.some(inv => inv.email.toLowerCase() === currentEmail.toLowerCase())) {
      toast.error('Este email já foi adicionado')
      return
    }

    // Verificar limite
    if (!canAddMore) {
      toast.error(`Limite de ${MAX_INVITES[planType]} convites atingido`)
      return
    }

    // Adicionar convite
    const newInvite: Invite = {
      id: Math.random().toString(36).substr(2, 9),
      email: currentEmail.trim(),
      role: currentRole,
    }

    setInvites(prev => [...prev, newInvite])
    setCurrentEmail('')
    setCurrentRole('member')
    
    toast.success('Email adicionado')
  }

  const handleRemoveInvite = (id: string) => {
    setInvites(prev => prev.filter(inv => inv.id !== id))
  }

  const handleContinue = async () => {
    if (!workspaceId) {
      toast.error('Workspace não encontrado')
      return
    }

    setLoading(true)

    try {
      // Salvar convites no Supabase
      if (invites.length > 0) {
        const invitesData = invites.map(invite => ({
          workspace_id: workspaceId,
          email: invite.email,
          role: invite.role,
          invited_by: user?.id,
          token: crypto.randomUUID(), // Gerar token único para cada convite
          status: 'pending' as const,
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias
        }))

        const { error } = await supabase
          .from('workspace_invites')
          .insert(invitesData)

        if (error) {
          console.error('❌ Erro ao inserir convites:', error)
          
          // Tratar erro de duplicação
          if (error.code === '23505' || error.message.includes('duplicate key')) {
            toast.warning('Alguns convites já foram enviados anteriormente')
            // Continuar mesmo com duplicação
          } else {
            throw error
          }
        }

        // Atualizar workspace com informações de plano
        await supabase
          .from('workspaces')
          .update({
            plan_type: planType,
            trial_ends_at: trialEndsAt,
          })
          .eq('id', workspaceId)

        toast.success(`${invites.length} convite(s) enviado(s) com sucesso`)
      }

      // Próximo passo
      onNext()
    } catch (error: any) {
      console.error('❌ Erro ao processar convites:', error)
      
      // Mensagem de erro mais específica
      if (error.code === '23505') {
        toast.error('Alguns emails já foram convidados. Tente continuar mesmo assim.')
      } else if (error.message) {
        toast.error(`Erro: ${error.message}`)
      } else {
        toast.error('Erro ao processar convites. Tente pular este passo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onNext()
  }

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
        </div>

        {/* Badge de Plano Pago - Aparece quando adicionar mais de 1 convite no plano grátis */}
        {showUpgradeWarning && (
          <div className="flex items-center justify-center gap-1.5 px-4">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1">
              <Crown className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs text-gray-600 font-medium">Plano pago necessário</span>
            </div>
          </div>
        )}

        {/* Título e Descrição */}
        <div className="text-center space-y-2 px-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Convide colegas de equipe
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Convide colegas de equipe para participar do seu espaço de trabalho.
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2 sm:px-3 py-1">
              <Clock className="h-3 w-3 text-blue-600 shrink-0" />
              <span className="text-[10px] sm:text-xs text-blue-700 whitespace-nowrap">Válidos por 14 dias</span>
            </div>
          </div>
        </div>

        {/* Formulário de Convite */}
        <div className="space-y-4 px-4">
          {/* Input de Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="joao@isacar.dev"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddInvite()
                  }
                }}
                className="flex-1"
              />
              <Select value={currentRole} onValueChange={(value: 'member' | 'admin') => setCurrentRole(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Link Adicionar Email - Inline Clicável */}
          <button
            onClick={handleAddInvite}
            disabled={!currentEmail.trim() || !canAddMore}
            className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar e-mail</span>
          </button>

          {/* Lista de Convites Adicionados */}
          {invites.length > 0 && (
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 sm:p-3"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-blue-100 shrink-0">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{invite.email}</p>
                      <p className="text-[10px] sm:text-xs text-gray-600 capitalize">{invite.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveInvite(invite.id)}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão Continuar + Link Pular */}
        <div className="flex flex-col items-center gap-3 px-4 pb-20 sm:pb-4">
          <Button
            onClick={handleContinue}
            disabled={loading}
            className="w-full sm:w-96 h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg"
          >
            {loading ? 'Enviando...' : 'Continuar'}
          </Button>
          
          <button
            onClick={handleSkip}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Eu farei isso mais tarde
          </button>
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
    </div>
  )
}
