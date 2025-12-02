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
          console.warn('⚠️ AuthContext: getSession retornou erro:', error.message)
        }
        const initialUser = session?.user ?? null
        console.log('👤 AuthContext: Usuário inicial:', initialUser?.id ? 'OK' : 'NULL')
        setUser(initialUser)
      } catch (err) {
        console.error('❌ AuthContext: Erro ao buscar usuário:', err)
        setError(err instanceof Error ? err : new Error('Erro de autenticação'))
      } finally {
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

  // Redirecionar para onboarding se necessário e BLOQUEAR acesso até completar
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

    const checkOnboarding = async () => {
      try {
        console.log('🔍 Verificando onboarding para:', user.id)
        
        // Verificar se usuário completou onboarding
        const { data: analytics, error } = await supabase
          .from('onboarding_analytics')
          .select('completed, skipped')
          .eq('user_id', user.id)
          .maybeSingle()

        console.log('📊 Analytics resultado:', { analytics, error })

        // Se não existe registro OU não completou = precisa fazer onboarding
        const needsOnboarding = !analytics || (!analytics.completed && !analytics.skipped)

        if (needsOnboarding) {
          console.log('🚫 ONBOARDING NECESSÁRIO - Bloqueando acesso ao dashboard')
          console.log('📊 Motivo:', !analytics ? 'Sem registro' : 'Não completou')
          if (location.pathname !== '/onboarding') {
            console.log('🎯 Redirecionando para /onboarding...')
            navigate('/onboarding', { replace: true })
          }
        } else {
          console.log('✅ Onboarding completo, acesso liberado')
          // Se está na raiz ou onboarding já completo, ir para dashboard
          if (location.pathname === '/' || location.pathname === '/onboarding') {
            console.log('🎯 Redirecionando para /dashboard...')
            navigate('/dashboard', { replace: true })
          }
        }
      } catch (error) {
        console.error('❌ Erro ao verificar onboarding:', error)
        // Em caso de erro, redirecionar para onboarding por segurança
        console.log('⚠️ Erro ao verificar onboarding, redirecionando para onboarding')
        if (location.pathname !== '/onboarding') {
          navigate('/onboarding', { replace: true })
        }
      }
    }

    // Pequeno delay para garantir que a sessão está estável
    const timer = setTimeout(() => {
      checkOnboarding()
    }, 500)

    return () => clearTimeout(timer)
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

