import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: Error | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Buscar usuário inicial
    const getInitialUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          // Silenciar erros de rede retryable
          if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
            // Tentar novamente após 2 segundos
            setTimeout(() => getInitialUser(), 2000)
            return
          }
        }
        const initialUser = session?.user ?? null
        setUser(initialUser)
        setLoading(false)
      } catch (err: any) {
        // Silenciar erros de rede
        if (err?.name === 'AuthRetryableFetchError' || err?.status === 0) {
          setTimeout(() => getInitialUser(), 2000)
          return
        }
        setError(err instanceof Error ? err : new Error('Erro de autenticação'))
        setLoading(false)
      }
    }

    getInitialUser()

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Limpar erro anterior
        setError(null)
        
        // Atualizar usuário
        setUser(session?.user ?? null)
        setLoading(false)
        
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Redirecionar para onboarding se necessário
  useEffect(() => {
    if (!user || loading) {
      return
    }
    
    // Rotas públicas que não precisam de autenticação
    const publicPaths = ['/auth', '/auth/callback', '/invite', '/privacy-policy', '/terms-of-service']
    const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path))
    
    if (isPublicPath) {
      return
    }

    // Verificar onboarding via localStorage (simples e funcional)
    const onboardingKey = `onboarding_completed_${user.id}`
    const onboardingCompleted = localStorage.getItem(onboardingKey) === 'true'

    if (!onboardingCompleted && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true })
    } else if (onboardingCompleted && location.pathname === '/onboarding') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, location.pathname, navigate])

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

