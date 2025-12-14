import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

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

interface UsageData {
  usage: Usage
  limits: Limits
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useUsage(projectId: string | null): UsageData {
  const [usage, setUsage] = useState<Usage>({ events: 0, shortLinks: 0, projects: 0 })
  const [limits, setLimits] = useState<Limits>({ plan: 'free', events: 1000, shortLinks: 10, projects: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const hasLoadedOnce = useRef(false)

  const fetchUsage = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false)
      return
    }

    try {
      // Só mostrar loading no primeiro carregamento
      if (!hasLoadedOnce.current) {
        setIsLoading(true)
      }
      setError(null)

      const { data, error: rpcError } = await supabase
        .rpc('check_usage_limits', { p_project_id: projectId })

      if (rpcError) throw rpcError

      if (data) {
        setUsage({
          events: data.events?.used || 0,
          shortLinks: data.short_links?.used || 0,
          projects: data.projects?.used || 0,
        })
        setLimits({
          plan: data.plan || 'free',
          events: data.events?.limit || 10000,
          shortLinks: data.short_links?.limit || 25,
          projects: data.projects?.limit || 1,
        })
        hasLoadedOnce.current = true
      }
    } catch (err) {
      console.error('Error fetching usage:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

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

  return { usage, limits, isLoading, error, refetch: fetchUsage }
}

// Limites por plano (sincronizado com banco e site)
export const PLAN_LIMITS = {
  free: {
    name: 'Free',
    price: 0,
    events: 1000,
    links: 10,
    projects: 1,
    aiMessages: 10,
    dataRetentionDays: 7,
  },
  starter: {
    name: 'Starter',
    price: 49,
    events: 10000,
    links: 30,
    projects: 3,
    aiMessages: 50,
    dataRetentionDays: 90,
  },
  pro: {
    name: 'Pro',
    price: 99,
    events: 50000,
    links: -1, // Ilimitado
    projects: 10,
    aiMessages: 200,
    dataRetentionDays: 365,
  },
  business: {
    name: 'Business',
    price: 249,
    events: 200000,
    links: -1, // Ilimitado
    projects: -1, // Ilimitado
    aiMessages: 1000,
    dataRetentionDays: -1, // Ilimitado
  },
}

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
