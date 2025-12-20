import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PLANS } from '@/lib/stripe/plans'

interface Usage {
  events: number
  shortLinks: number
  projects: number
}

interface Limits {
  plan: string
  events: number
  shortLinks: number
  projects: number
}

interface TrialInfo {
  isTrial: boolean
  trialEndsAt: Date | null
  trialDaysRemaining: number
  isBlocked: boolean
}

interface UsageData {
  usage: Usage
  limits: Limits
  trial: TrialInfo
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useUsage(projectId: string | null, userId?: string | null): UsageData {
  const [usage, setUsage] = useState<Usage>({ events: 0, shortLinks: 0, projects: 0 })
  const [limits, setLimits] = useState<Limits>({ plan: 'free', events: 1000, shortLinks: 25, projects: 1 })
  const [trial, setTrial] = useState<TrialInfo>({ isTrial: false, trialEndsAt: null, trialDaysRemaining: 0, isBlocked: false })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const hasLoadedOnce = useRef(false)

  const fetchUsage = useCallback(async () => {
    if (!projectId && !userId) {
      setIsLoading(false)
      return
    }

    try {
      // Só mostrar loading no primeiro carregamento
      if (!hasLoadedOnce.current) {
        setIsLoading(true)
      }
      setError(null)

      const effectiveUserId = (() => {
        if (userId) return userId
        return null
      })()

      const rpcUserId = await (async () => {
        if (effectiveUserId) return effectiveUserId
        if (!projectId) return null

        // Buscar user_id do projeto (fallback)
        const { data: project } = await supabase
          .from('projects')
          .select('user_id')
          .eq('id', projectId)
          .single()

        return project?.user_id || null
      })()

      if (!rpcUserId) throw new Error('User not found')

      // Chamar função RPC com user_id
      const { data, error: rpcError } = await supabase
        .rpc('check_usage_limits', { p_user_id: rpcUserId })

      if (rpcError) throw rpcError

      if (data && data.length > 0) {
        const result = data[0]
        setUsage({
          events: result.events_used || 0,
          shortLinks: result.short_links_used || 0,
          projects: result.projects_used || 0,
        })
        setLimits({
          plan: result.plan || 'free',
          events: result.events_limit || 1000,
          shortLinks: result.short_links_limit || 25,
          projects: result.projects_limit || 1,
        })
        setTrial({
          isTrial: result.is_trial || false,
          trialEndsAt: result.trial_ends_at ? new Date(result.trial_ends_at) : null,
          trialDaysRemaining: result.trial_days_remaining || 0,
          isBlocked: result.is_blocked || false,
        })
        hasLoadedOnce.current = true
      }
    } catch (err) {
      console.error('Error fetching usage:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, userId])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  // Real-time updates quando projeto muda
  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`usage-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        () => {
          fetchUsage()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, fetchUsage])

  return { usage, limits, trial, isLoading, error, refetch: fetchUsage }
}

// Limites por plano - Derivado de plans.ts para evitar duplicação
export const PLAN_LIMITS = Object.fromEntries(
  Object.entries(PLANS).map(([key, plan]) => [
    key,
    {
      name: plan.name,
      price: plan.price.monthly,
      events: plan.limits.max_monthly_events,
      links: plan.limits.max_short_links,
      projects: plan.limits.max_projects,
      aiMessages: plan.limits.max_ai_messages,
      dataRetentionDays: plan.limits.data_retention_days,
    },
  ])
) as Record<string, {
  name: string
  price: number
  events: number
  links: number
  projects: number
  aiMessages: number
  dataRetentionDays: number
}>

// Helper para determinar próximo plano
export function getNextPlan(currentPlan: string, metric: 'events' | 'links' | 'projects') {
  const upgradeMap: Record<string, keyof typeof PLAN_LIMITS | null> = {
    free: 'starter',
    starter: 'pro',
    pro: 'business',
    business: null, // Já está no máximo
  }

  const nextPlanKey = upgradeMap[currentPlan.toLowerCase()]
  if (!nextPlanKey) return undefined

  const nextPlan = PLAN_LIMITS[nextPlanKey]
  
  const metricMap: Record<string, 'events' | 'links' | 'projects'> = {
    events: 'events',
    links: 'links',
    projects: 'projects',
  }

  return {
    name: nextPlan.name,
    price: nextPlan.price,
    limit: nextPlan[metricMap[metric]],
  }
}
