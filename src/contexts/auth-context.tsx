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
    let isMounted = true

    // Buscar usuário inicial
    const getInitialUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          // Silenciar erros de rede retryable
          if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
            // Tentar novamente após 2 segundos
            if (isMounted) setTimeout(() => getInitialUser(), 2000)
            return
          }
        }
        if (!isMounted) return
        const initialUser = session?.user ?? null
        setUser(initialUser)
        setLoading(false)
      } catch (err: any) {
        // Silenciar erros de rede
        if (err?.name === 'AuthRetryableFetchError' || err?.status === 0) {
          if (isMounted) setTimeout(() => getInitialUser(), 2000)
          return
        }
        if (!isMounted) return
        setError(err instanceof Error ? err : new Error('Erro de autenticação'))
        setLoading(false)
      }
    }

    getInitialUser()

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        // Limpar erro anterior
        setError(null)

        // Atualizar usuário
        setUser(session?.user ?? null)
        setLoading(false)

      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
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

    // Verificar onboarding via Supabase (mais confiável)
    // Também verifica localStorage como fallback para melhor UX
    const checkOnboarding = async () => {
      const onboardingKey = `onboarding_completed_${user.id}`
      const localOnboardingCompleted = localStorage.getItem(onboardingKey) === 'true'

      // Se localStorage diz que está completo, confia (otimista)
      if (localOnboardingCompleted) {
        if (location.pathname === '/onboarding') {
          navigate('/dashboard', { replace: true })
        }
        return
      }

      // Se não, verifica no Supabase
      try {
        const { checkOnboardingStatus } = await import('@/lib/supabase/onboarding-queries')
        const isCompleted = await checkOnboardingStatus(user.id)

        if (isCompleted) {
          localStorage.setItem(onboardingKey, 'true')
          if (location.pathname === '/onboarding') {
            navigate('/dashboard', { replace: true })
          }
        } else if (!isCompleted && location.pathname !== '/onboarding') {
          navigate('/onboarding', { replace: true })
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // Em caso de erro, permite navegação normal
      }
    }

    checkOnboarding()
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

