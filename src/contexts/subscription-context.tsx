import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { PLANS, getPlanLimits } from '@/lib/stripe/plans'
import { Subscription, DEFAULT_SUBSCRIPTION, createTempSubscription } from '@/types/subscription'

export type { Subscription } from '@/types/subscription'

interface SubscriptionContextType {
  subscription: Subscription | null
  loading: boolean
  error: Error | null
  canCreateProject: () => boolean
  canTrackEvent: () => boolean
  refetch: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const hasLoadedOnce = useRef(false)

  const fetchSubscription = useCallback(async () => {
    if (authLoading) return
    
    try {
      // Só mostrar loading no primeiro carregamento
      if (!hasLoadedOnce.current) {
        setLoading(true)
      }
      setError(null)

      if (!user) {
        setSubscription(null)
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Silenciar erros de rede
        console.warn('Subscription context: fetch warning', fetchError.message)
      }

      if (data) {
        setSubscription(data as Subscription)
      } else {
        // Criar subscription default em memória (trigger no banco cria automaticamente)
        setSubscription(createTempSubscription(user.id))
      }
      hasLoadedOnce.current = true
    } catch (err: any) {
      // Silenciar erros de rede
      if (err?.name === 'AuthRetryableFetchError' || err?.status === 0) {
        console.warn('Subscription context: network error')
      } else {
        console.warn('Subscription context: error', err?.message)
      }
      setError(err instanceof Error ? err : new Error('Erro ao buscar assinatura'))
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const canCreateProject = useCallback(() => {
    if (!subscription) return true // Permitir se não carregou ainda
    
    const limits = getPlanLimits(subscription.plan)
    if (limits.max_domains === -1) return true
    
    // TODO: Verificar quantidade atual de projetos
    return true
  }, [subscription])

  const canTrackEvent = useCallback(() => {
    if (!subscription) return true
    
    if (subscription.current_monthly_events >= subscription.max_monthly_events) {
      toast.error('Limite de eventos atingido', {
        description: `Você atingiu o limite de ${subscription.max_monthly_events.toLocaleString()} eventos do plano ${subscription.plan.toUpperCase()}. Faça upgrade para continuar rastreando.`,
      })
      return false
    }
    
    return true
  }, [subscription])

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        error,
        canCreateProject,
        canTrackEvent,
        refetch: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

// Default context for when provider is not available
const defaultContext: SubscriptionContextType = {
  subscription: null,
  loading: true,
  error: null,
  canCreateProject: () => false,
  canTrackEvent: () => false,
  refetch: async () => {},
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  // Return default context instead of throwing error
  // This allows components to render safely before provider is mounted
  if (context === undefined) {
    return defaultContext
  }
  return context
}
