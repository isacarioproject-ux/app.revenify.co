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
    description: 'Perfeito para testes e projetos pequenos',
    price: {
      monthly: 0,
      yearly: 0,
    },
    limits: {
      max_projects: 1,
      max_sources: 3,
      max_monthly_events: 1000,
      max_short_links: 25,
      max_ai_messages: 10,
      max_domains: 0,
      data_retention_days: 7,
      revenue_tracking_enabled: false,
      api_access_enabled: false,
      webhooks_enabled: false,
      white_label_enabled: false,
      custom_domain_enabled: false,
    },
    features: [
      '1.000 eventos/mês',
      '1 projeto',
      '25 short links',
      'Retenção de 7 dias',
      'Painel básico',
      'Suporte comunidade',
    ],
  },
  
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Para negócios em crescimento',
    price: {
      monthly: 8,
      yearly: 72,
    },
    limits: {
      max_projects: 3,
      max_sources: -1, // unlimited
      max_monthly_events: 5000,
      max_short_links: 100,
      max_ai_messages: 50,
      max_domains: 1,
      data_retention_days: 30,
      revenue_tracking_enabled: true,
      api_access_enabled: true,
      webhooks_enabled: false,
      white_label_enabled: false,
      custom_domain_enabled: true,
    },
    features: [
      '5.000 eventos/mês',
      '3 projetos',
      '100 short links',
      'Retenção de 30 dias',
      'Análise avançada',
      'Suporte por e-mail',
      'Acesso à API',
    ],
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para empresas em escala',
    price: {
      monthly: 20,
      yearly: 192,
    },
    limits: {
      max_projects: 10,
      max_sources: -1,
      max_monthly_events: 200000,
      max_short_links: 1000,
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
      '200.000 eventos/mês',
      '10 projetos',
      '1.000 short links',
      'Retenção de 1 ano',
      'Atribuição multi-toque',
      'Suporte prioritário',
      'Webhooks',
      'Integrações personalizadas',
    ],
    popular: true,
  },
  
  business: {
    id: 'business',
    name: 'Business',
    description: 'Para grandes empresas',
    price: {
      monthly: 50,
      yearly: 480,
    },
    limits: {
      max_projects: -1, // unlimited
      max_sources: -1,
      max_monthly_events: 500000,
      max_short_links: -1, // unlimited
      max_ai_messages: 1000,
      max_domains: -1, // unlimited
      data_retention_days: 1095, // 3 anos
      revenue_tracking_enabled: true,
      api_access_enabled: true,
      webhooks_enabled: true,
      white_label_enabled: true,
      custom_domain_enabled: true,
    },
    features: [
      '500.000 eventos/mês',
      'Projetos ilimitados',
      'Short links ilimitados',
      'Retenção de 3 anos',
      'White-label',
      'Suporte dedicado',
      'SLA garantido',
      'SSO (SAML)',
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
  if (price === 0) return 'Free'
  return `$${price}`
}
