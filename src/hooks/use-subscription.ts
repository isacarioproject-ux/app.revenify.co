import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface SubscriptionLimits {
  projects_limit: number
  whiteboards_per_project_limit: number
  members_limit: number
  invited_members_limit: number
  storage_limit_gb: number
}

export interface SubscriptionUsage {
  projects_used: number
  whiteboards_used: number
  members_used: number
  storage_used_gb: number
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: 'free' | 'pro' | 'business' | 'enterprise'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  billing_period: 'monthly' | 'yearly'
  amount: number
  next_billing_date: string | null
  limits: SubscriptionLimits
  usage: SubscriptionUsage
  created_at: string
  updated_at: string
}

interface UseSubscriptionReturn {
  subscription: Subscription | null
  loading: boolean
  error: Error | null
  canCreateProject: () => boolean
  canCreateWhiteboard: (projectId: string) => Promise<boolean>
  canInviteMember: () => boolean
  checkStorageLimit: (sizeInBytes: number) => boolean
  refetch: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSubscription(null)
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (fetchError) {
        console.error('Erro ao buscar subscription:', fetchError)
        // Não bloquear a UI, apenas logar o erro
        setError(fetchError as Error)
        setLoading(false)
        return
      }

      // Se não tem subscription, criar uma FREE
      if (!data) {
        const { data: newSub, error: createError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: 'free',
            projects_limit: 1,
            whiteboards_per_project_limit: 3,
            members_limit: 2,
            invited_members_limit: 1,
            storage_limit_gb: 1,
          })
          .select()
          .single()

        if (createError) {
          console.error('Erro ao criar subscription:', createError)
          setError(createError as Error)
          setLoading(false)
          return
        }

        setSubscription({
          ...newSub,
          limits: {
            projects_limit: newSub.projects_limit,
            whiteboards_per_project_limit: newSub.whiteboards_per_project_limit,
            members_limit: newSub.members_limit,
            invited_members_limit: newSub.invited_members_limit,
            storage_limit_gb: newSub.storage_limit_gb,
          },
          usage: {
            projects_used: newSub.projects_used,
            whiteboards_used: newSub.whiteboards_used,
            members_used: newSub.members_used,
            storage_used_gb: newSub.storage_used_gb,
          },
        })
      } else {
        setSubscription({
          ...data,
          limits: {
            projects_limit: data.projects_limit,
            whiteboards_per_project_limit: data.whiteboards_per_project_limit,
            members_limit: data.members_limit,
            invited_members_limit: data.invited_members_limit,
            storage_limit_gb: data.storage_limit_gb,
          },
          usage: {
            projects_used: data.projects_used,
            whiteboards_used: data.whiteboards_used,
            members_used: data.members_used,
            storage_used_gb: data.storage_used_gb,
          },
        })
      }
    } catch (err) {
      console.error('Erro ao buscar subscription:', err)
      setError(err instanceof Error ? err : new Error('Erro ao buscar assinatura'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Verificar se pode criar projeto
  const canCreateProject = useCallback(() => {
    if (!subscription) return false
    
    const limit = subscription.limits.projects_limit
    const used = subscription.usage.projects_used

    // -1 significa ilimitado
    if (limit === -1) return true

    if (used >= limit) {
      toast.error('Limite de projetos atingido', {
        description: `Você atingiu o limite de ${limit} projeto(s) do plano ${subscription.plan_id.toUpperCase()}. Faça upgrade para criar mais.`,
      })
      return false
    }

    return true
  }, [subscription])

  // Verificar se pode criar whiteboard em um projeto
  const canCreateWhiteboard = useCallback(async (projectId: string) => {
    if (!subscription) return false

    const limit = subscription.limits.whiteboards_per_project_limit

    // -1 significa ilimitado
    if (limit === -1) return true

    // Contar whiteboards do projeto
    const { count, error } = await supabase
      .from('whiteboards')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    if (error) {
      console.error('Erro ao contar whiteboards:', error)
      return false
    }

    if ((count || 0) >= limit) {
      toast.error('Limite de whiteboards atingido', {
        description: `Você atingiu o limite de ${limit} whiteboard(s) por projeto do plano ${subscription.plan_id.toUpperCase()}. Faça upgrade para criar mais.`,
      })
      return false
    }

    return true
  }, [subscription])

  // Verificar se pode convidar membro
  const canInviteMember = useCallback(() => {
    if (!subscription) return false

    const limit = subscription.limits.members_limit
    const used = subscription.usage.members_used

    // -1 significa ilimitado
    if (limit === -1) return true

    if (used >= limit) {
      toast.error('Limite de membros atingido', {
        description: `Você atingiu o limite de ${limit} membro(s) do plano ${subscription.plan_id.toUpperCase()}. Faça upgrade para adicionar mais.`,
      })
      return false
    }

    return true
  }, [subscription])

  // Verificar limite de armazenamento
  const checkStorageLimit = useCallback((sizeInBytes: number) => {
    if (!subscription) return false

    const limit = subscription.limits.storage_limit_gb
    const used = subscription.usage.storage_used_gb
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024)

    // -1 significa ilimitado
    if (limit === -1) return true

    if (used + sizeInGB > limit) {
      toast.error('Limite de armazenamento atingido', {
        description: `Você atingiu o limite de ${limit} GB do plano ${subscription.plan_id.toUpperCase()}. Faça upgrade para mais espaço.`,
      })
      return false
    }

    return true
  }, [subscription])

  return {
    subscription,
    loading,
    error,
    canCreateProject,
    canCreateWhiteboard,
    canInviteMember,
    checkStorageLimit,
    refetch: fetchSubscription,
  }
}
