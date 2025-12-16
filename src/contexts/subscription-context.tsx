import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { PLANS, getPlanLimits } from '@/lib/stripe/plans'

export interface Subscription {
  id: string
  user_id: string
  plan: 'free' | 'starter' | 'pro' | 'business'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  max_monthly_events: number
  current_monthly_events: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  custom_short_domain: string | null
  is_trial: boolean
  trial_started_at: string | null
  trial_ends_at: string | null
  max_projects: number
  max_short_links: number
  created_at: string
  updated_at: string
}

interface SubscriptionContextType {
  subscription: Subscription | null
  loading: boolean
  error: Error | null
  canCreateProject: () => boolean
  canTrackEvent: () => boolean
  refetch: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

// Subscription padrão para usuários sem subscription no banco
const DEFAULT_SUBSCRIPTION: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  plan: 'free',
  status: 'active',
  max_monthly_events: 1000,
  current_monthly_events: 0,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  custom_short_domain: null,
  is_trial: false,
  trial_started_at: null,
  trial_ends_at: null,
  max_projects: 1,
  max_short_links: 25,
}

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
        setSubscription({
          id: 'temp',
          user_id: user.id,
          ...DEFAULT_SUBSCRIPTION,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
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
