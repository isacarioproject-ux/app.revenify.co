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
  // Advanced Link Features
  ab_testing_enabled: boolean
  max_ab_tests: number
  geo_targeting_enabled: boolean
  max_geo_rules: number
  device_targeting_enabled: boolean
  deep_links_enabled: boolean
  link_cloaking_enabled: boolean
  password_protection_enabled: boolean
  link_expiration_enabled: boolean
  // Enterprise
  sso_enabled: boolean
  advanced_attribution_enabled: boolean
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

// Trial plan - 14 days with Pro features limited
export const TRIAL_PLAN: Plan = {
  id: 'trial',
  name: 'Trial',
  description: 'Experimente o Pro por 14 dias',
  price: {
    monthly: 0,
    yearly: 0,
  },
  limits: {
    max_projects: 3,
    max_sources: -1,
    max_monthly_events: 2000,
    max_short_links: 50,
    max_ai_messages: 30,
    max_domains: 1,
    data_retention_days: 14,
    revenue_tracking_enabled: true,
    api_access_enabled: true,
    webhooks_enabled: true, // Key feature to create dependency
    white_label_enabled: false,
    custom_domain_enabled: true,
    // Advanced Link Features - Limited to create desire
    ab_testing_enabled: true,
    max_ab_tests: 2,
    geo_targeting_enabled: true,
    max_geo_rules: 3,
    device_targeting_enabled: true,
    deep_links_enabled: true,
    link_cloaking_enabled: true, // Show value
    password_protection_enabled: true,
    link_expiration_enabled: true,
    // Enterprise
    sso_enabled: false,
    advanced_attribution_enabled: true,
  },
  features: [
    '14 dias grátis',
    '2.000 eventos/mês',
    '50 short links',
    'Custom Domain',
    'A/B Testing (2 testes)',
    'Geo Targeting (3 regras)',
    'Device Targeting',
    'Deep Links',
    'Link Cloaking',
    'Webhooks',
    'Atribuição multi-toque',
  ],
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
      // Advanced Link Features - Limited
      ab_testing_enabled: false,
      max_ab_tests: 0,
      geo_targeting_enabled: false,
      max_geo_rules: 0,
      device_targeting_enabled: false,
      deep_links_enabled: false,
      link_cloaking_enabled: false,
      password_protection_enabled: true, // Basic security
      link_expiration_enabled: true, // Basic feature
      // Enterprise
      sso_enabled: false,
      advanced_attribution_enabled: false,
    },
    features: [
      '1.000 eventos/mês',
      '1 projeto',
      '25 short links',
      'Retenção de 7 dias',
      'Painel básico',
      'Password Protection',
      'Link Expiration',
    ],
  },
  
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Para negócios em crescimento',
    price: {
      monthly: 39,
      yearly: 349,
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
      // Advanced Link Features
      ab_testing_enabled: true,
      max_ab_tests: 3,
      geo_targeting_enabled: true,
      max_geo_rules: 5,
      device_targeting_enabled: true,
      deep_links_enabled: true,
      link_cloaking_enabled: false, // Pro+
      password_protection_enabled: true,
      link_expiration_enabled: true,
      // Enterprise
      sso_enabled: false,
      advanced_attribution_enabled: false,
    },
    features: [
      '5.000 eventos/mês',
      '3 projetos',
      '100 short links',
      'Retenção de 30 dias',
      'Custom Domain',
      'A/B Testing (3 testes)',
      'Geo Targeting (5 regras)',
      'Device Targeting',
      'Deep Links',
      'Acesso à API',
      'Suporte por e-mail',
    ],
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para empresas em escala',
    price: {
      monthly: 99,
      yearly: 949,
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
      // Advanced Link Features
      ab_testing_enabled: true,
      max_ab_tests: -1, // unlimited
      geo_targeting_enabled: true,
      max_geo_rules: -1, // unlimited
      device_targeting_enabled: true,
      deep_links_enabled: true,
      link_cloaking_enabled: true,
      password_protection_enabled: true,
      link_expiration_enabled: true,
      // Enterprise
      sso_enabled: false,
      advanced_attribution_enabled: true,
    },
    features: [
      '200.000 eventos/mês',
      '10 projetos',
      '1.000 short links',
      'Retenção de 1 ano',
      'A/B Testing ilimitado',
      'Geo Targeting ilimitado',
      'Device Targeting',
      'Deep Links',
      'Link Cloaking',
      'Atribuição multi-toque',
      'Webhooks',
      'Suporte prioritário',
    ],
    popular: true,
  },
  
  business: {
    id: 'business',
    name: 'Business',
    description: 'Para grandes empresas',
    price: {
      monthly: 249,
      yearly: 2390,
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
      // Advanced Link Features - All
      ab_testing_enabled: true,
      max_ab_tests: -1,
      geo_targeting_enabled: true,
      max_geo_rules: -1,
      device_targeting_enabled: true,
      deep_links_enabled: true,
      link_cloaking_enabled: true,
      password_protection_enabled: true,
      link_expiration_enabled: true,
      // Enterprise
      sso_enabled: true,
      advanced_attribution_enabled: true,
    },
    features: [
      '500.000 eventos/mês',
      'Projetos ilimitados',
      'Short links ilimitados',
      'Retenção de 3 anos',
      'Todas as features Pro',
      'SSO/SAML',
      'White-label',
      'Suporte dedicado',
      'SLA garantido',
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
  return `R$ ${price}`
}

// Stripe Price IDs - Production
export const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: 'price_1SeNTlGv40SOibxN3LFF9alH',
    yearly: 'price_1SeNWvGv40SOibxNQ4X9jiDg',
  },
  pro: {
    monthly: 'price_1SeNYPGv40SOibxNAUmjt7i4',
    yearly: 'price_1SeNaWGv40SOibxNP08riw0f',
  },
  business: {
    monthly: 'price_1SeNcsGv40SOibxNDeuginH2',
    yearly: 'price_1SeNeRGv40SOibxNgbyIZ1NI',
  },
}

export function getStripePriceId(planId: string, interval: 'monthly' | 'yearly'): string | null {
  const plan = STRIPE_PRICE_IDS[planId]
  if (!plan) return null
  return plan[interval]
}
