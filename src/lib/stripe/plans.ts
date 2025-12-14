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
    name: 'Grátis',
    description: 'Perfeito para testes e projetos pequenos',
    price: {
      monthly: 0,
      yearly: 0,
    },
    limits: {
      max_projects: 1,
      max_sources: 3,
      max_monthly_events: 1000,
      max_short_links: 10,
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
      '1.000 eventos por mês',
      '1 projeto',
      'Retenção de dados em 7 dias',
      'Painel básico de análise',
      'Apoio da comunidade',
    ],
  },
  
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Para negócios em crescimento',
    price: {
      monthly: 49,
      yearly: 470,
    },
    limits: {
      max_projects: 3,
      max_sources: -1, // unlimited
      max_monthly_events: 10000,
      max_short_links: 30,
      max_ai_messages: 50,
      max_domains: 1,
      data_retention_days: 90,
      revenue_tracking_enabled: true,
      api_access_enabled: true,
      webhooks_enabled: false,
      white_label_enabled: false,
      custom_domain_enabled: true,
    },
    features: [
      '10.000 eventos/mês',
      '3 projetos',
      'Retenção de dados em 90 dias',
      'Análise avançada',
      'Suporte por e-mail',
      'Domínios personalizados',
      'Acesso à API',
    ],
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para empresas de escalabilidade',
    price: {
      monthly: 99,
      yearly: 950,
    },
    limits: {
      max_projects: 10,
      max_sources: -1,
      max_monthly_events: 50000,
      max_short_links: -1, // unlimited
      max_ai_messages: 200,
      max_domains: 3,
      data_retention_days: 365,
      revenue_tracking_enabled: true,
      api_access_enabled: true,
      webhooks_enabled: true,
      white_label_enabled: true,
      custom_domain_enabled: true,
    },
    features: [
      '50.000 eventos/mês',
      '10 projetos',
      'Retenção de dados por 1 ano',
      'Atribuição multi-toque',
      'Suporte prioritário',
      'Acesso avançado à API',
      'Webhooks',
      'Integrações personalizadas',
      'Relatórios de marca branca',
    ],
    popular: true,
  },
  
  business: {
    id: 'business',
    name: 'Business',
    description: 'Para empresas',
    price: {
      monthly: 249,
      yearly: 2390,
    },
    limits: {
      max_projects: -1, // unlimited
      max_sources: -1,
      max_monthly_events: 200000,
      max_short_links: -1, // unlimited
      max_ai_messages: 1000,
      max_domains: -1, // unlimited
      data_retention_days: -1, // unlimited
      revenue_tracking_enabled: true,
      api_access_enabled: true,
      webhooks_enabled: true,
      white_label_enabled: true,
      custom_domain_enabled: true,
    },
    features: [
      '200.000 eventos/mês',
      'Projetos ilimitados',
      'Retenção ilimitada de dados',
      'Opções de marca branca',
      'Suporte dedicado',
      'Garantia SLA',
      'Contratos personalizados',
      'SSO (SAML)',
      'Segurança avançada',
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
