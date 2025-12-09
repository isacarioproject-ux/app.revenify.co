export interface PlanLimits {
  max_projects: number
  max_sources: number
  max_monthly_events: number
  max_short_links: number
  max_ai_messages: number
  max_domains: number
  data_retention_days: number
  revenue_tracking_enabled: boolean
  api_access_enabled: boolean
  webhooks_enabled: boolean
  white_label_enabled: boolean
  custom_domain_enabled: boolean
}

export interface Plan {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
  }
  limits: PlanLimits
  features: string[]
  popular?: boolean
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Para experimentar o Revenify',
    price: {
      monthly: 0,
      yearly: 0,
    },
    limits: {
      max_projects: 1,
      max_sources: 3,
      max_monthly_events: 10000,
      max_short_links: 30,
      max_ai_messages: 10,
      max_domains: 0,
      data_retention_days: 30,
      revenue_tracking_enabled: false,
      api_access_enabled: false,
      webhooks_enabled: false,
      white_label_enabled: false,
      custom_domain_enabled: false,
    },
    features: [
      '1 projeto',
      '3 fontes de tráfego',
      '10.000 eventos/mês',
      '30 links curtos',
      '10 mensagens IA/mês',
      '30 dias de retenção',
    ],
  },
  
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Para pequenos projetos',
    price: {
      monthly: 49,
      yearly: 490,
    },
    limits: {
      max_projects: 3,
      max_sources: -1, // unlimited
      max_monthly_events: 100000,
      max_short_links: 100,
      max_ai_messages: 50,
      max_domains: 1,
      data_retention_days: 90,
      revenue_tracking_enabled: true,
      api_access_enabled: false,
      webhooks_enabled: false,
      white_label_enabled: false,
      custom_domain_enabled: false,
    },
    features: [
      '3 projetos',
      'Fontes ilimitadas',
      '100.000 eventos/mês',
      '100 links curtos',
      '50 mensagens IA/mês',
      '90 dias de retenção',
      'Rastreamento de receita',
      'Integração Stripe',
    ],
    popular: true,
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para negócios em crescimento',
    price: {
      monthly: 149,
      yearly: 1490,
    },
    limits: {
      max_projects: 10,
      max_sources: -1,
      max_monthly_events: 500000,
      max_short_links: -1, // unlimited
      max_ai_messages: 200,
      max_domains: 3,
      data_retention_days: 365,
      revenue_tracking_enabled: true,
      api_access_enabled: true,
      webhooks_enabled: true,
      white_label_enabled: false,
      custom_domain_enabled: true,
    },
    features: [
      '10 projetos',
      'Fontes ilimitadas',
      '500.000 eventos/mês',
      'Links curtos ilimitados',
      '200 mensagens IA/mês',
      '1 ano de retenção',
      'Domínio customizado',
      'Acesso à API',
      'Webhooks',
      'Suporte prioritário',
    ],
  },
  
  business: {
    id: 'business',
    name: 'Business',
    description: 'Para empresas em expansão',
    price: {
      monthly: 399,
      yearly: 3990,
    },
    limits: {
      max_projects: 50,
      max_sources: -1,
      max_monthly_events: 2000000,
      max_short_links: -1, // unlimited
      max_ai_messages: 1000,
      max_domains: 10,
      data_retention_days: 730,
      revenue_tracking_enabled: true,
      api_access_enabled: true,
      webhooks_enabled: true,
      white_label_enabled: true,
      custom_domain_enabled: true,
    },
    features: [
      '50 projetos',
      'Fontes ilimitadas',
      '2.000.000 eventos/mês',
      'Links curtos ilimitados',
      '1.000 mensagens IA/mês',
      '2 anos de retenção',
      'Domínio customizado',
      'White label',
      'Acesso à API',
      'Webhooks',
      'Suporte dedicado',
    ],
  },
}

export function getPlanById(planId: string): Plan | null {
  return PLANS[planId] || null
}

export function getPlanLimits(planId: string): PlanLimits {
  return PLANS[planId]?.limits || PLANS.free.limits
}

export function canCreateSource(plan: string, currentSources: number): boolean {
  const limits = getPlanLimits(plan)
  return limits.max_sources === -1 || currentSources < limits.max_sources
}

export function canTrackEvent(plan: string, currentEvents: number): boolean {
  const limits = getPlanLimits(plan)
  return currentEvents < limits.max_monthly_events
}

export function formatPlanPrice(plan: Plan, interval: 'monthly' | 'yearly'): string {
  const price = plan.price[interval]
  if (price === 0) return 'Grátis'
  return `R$ ${price}`
}
