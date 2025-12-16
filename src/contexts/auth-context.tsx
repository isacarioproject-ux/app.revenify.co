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
    console.log('🔐 AuthContext: Inicializando...')
    
    // Buscar usuário inicial
    const getInitialUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          // Silenciar erros de rede retryable
          if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
            console.warn('⚠️ AuthContext: Erro de rede temporário, tentando novamente...')
            // Tentar novamente após 2 segundos
            setTimeout(() => getInitialUser(), 2000)
            return
          }
          console.warn('⚠️ AuthContext: getSession retornou erro:', error.message)
        }
        const initialUser = session?.user ?? null
        console.log('👤 AuthContext: Usuário inicial:', initialUser?.id ? 'OK' : 'NULL')
        setUser(initialUser)
        setLoading(false)
      } catch (err: any) {
        // Silenciar erros de rede
        if (err?.name === 'AuthRetryableFetchError' || err?.status === 0) {
          console.warn('⚠️ AuthContext: Erro de rede, aguardando conexão...')
          setTimeout(() => getInitialUser(), 2000)
          return
        }
        console.error('❌ AuthContext: Erro ao buscar usuário:', err)
        setError(err instanceof Error ? err : new Error('Erro de autenticação'))
        setLoading(false)
      }
    }

    getInitialUser()

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthContext: Auth state changed:', event, session?.user?.email)
        
        // Limpar erro anterior
        setError(null)
        
        // Atualizar usuário
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Se for SIGNED_IN (login social ou email), garantir redirecionamento
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Usuário autenticado via', session.user.app_metadata.provider)
        }
        
        // Se for erro de autenticação
        if (event === 'USER_UPDATED' && !session) {
          console.error('❌ Erro na autenticação, sessão perdida')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Redirecionar para onboarding se necessário
  useEffect(() => {
    console.log('🔄 AuthContext: useEffect onboarding check', { 
      hasUser: !!user, 
      loading, 
      pathname: location.pathname 
    })
    
    if (!user || loading) {
      console.log('⏸️ AuthContext: Aguardando user/loading...')
      return
    }
    
    // Rotas públicas que não precisam de autenticação
    const publicPaths = ['/auth', '/auth/callback', '/invite', '/privacy-policy', '/terms-of-service']
    const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path))
    
    if (isPublicPath) {
      console.log('🌐 Rota pública, não verificar onboarding:', location.pathname)
      return
    }

    // Verificar onboarding via localStorage (simples e funcional)
    const onboardingKey = `onboarding_completed_${user.id}`
    const onboardingCompleted = localStorage.getItem(onboardingKey) === 'true'
    
    console.log('📊 Onboarding status:', { onboardingCompleted, userId: user.id })

    if (!onboardingCompleted && location.pathname !== '/onboarding') {
      console.log('🎯 Redirecionando para /onboarding...')
      navigate('/onboarding', { replace: true })
    } else if (onboardingCompleted && location.pathname === '/onboarding') {
      console.log('🎯 Onboarding já completo, redirecionando para /dashboard...')
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

