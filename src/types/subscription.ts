/**
 * Tipos unificados para Subscription
 * Centraliza todas as definições de tipos relacionados a assinaturas
 */

export type PlanId = 'free' | 'starter' | 'pro' | 'business'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

/**
 * Interface principal de Subscription
 * Usada em todo o frontend para consistência
 */
export interface Subscription {
  id: string
  user_id: string
  plan: PlanId
  status: SubscriptionStatus
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

/**
 * Subscription padrão para usuários sem subscription no banco
 */
export const DEFAULT_SUBSCRIPTION: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
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

/**
 * Cria uma subscription temporária em memória
 */
export function createTempSubscription(userId: string): Subscription {
  return {
    id: 'temp',
    user_id: userId,
    ...DEFAULT_SUBSCRIPTION,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
