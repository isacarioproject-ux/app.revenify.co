import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthFormMinimal } from '@/components/auth-form-minimal'
import { toast } from 'sonner'

export default function AuthPage() {
  const navigate = useNavigate()

  const handleSuccess = async (userData: { email: string; name?: string }) => {
    try {
      // Get current user from Supabase
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Verificar se é novo usuário (criado nos últimos 5 minutos)
        const userCreatedAt = new Date(user.created_at)
        const now = new Date()
        const diffMinutes = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60)
        const isNewUser = diffMinutes < 5
        
        if (isNewUser) {
          console.log('✨ [Auth] Novo usuário detectado, redirecionando para onboarding...')
          toast.success('Conta criada! Vamos começar o setup.')
          
          // Redirecionar para onboarding
          setTimeout(() => {
            navigate('/onboarding')
          }, 500)
        } else {
          console.log('👤 [Auth] Usuário existente, redirecionando para dashboard...')
          toast.success('Login realizado com sucesso!')
          
          // Redirecionar para dashboard
          setTimeout(() => {
            navigate('/dashboard')
          }, 500)
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      toast.error('Erro ao autenticar. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Top right controls */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Auth Form */}
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl shadow-lg">
          <AuthFormMinimal
            onSuccess={handleSuccess}
            initialMode="login"
          />
        </div>
      </div>
    </div>
  )
}
