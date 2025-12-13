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
    description: 'Perfect for testing and small projects',
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
      '1,000 events/month',
      '1 project',
      '10 short links',
      '7-day data retention',
      'Basic analytics dashboard',
      'Community support',
    ],
  },
  
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For growing businesses',
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
      custom_domain_enabled: false,
    },
    features: [
      '10,000 events/month',
      '3 projects',
      '30 short links',
      '90-day data retention',
      'Advanced analytics',
      'Email support',
      'Custom domains',
      'API access',
    ],
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For scaling companies',
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
      white_label_enabled: false,
      custom_domain_enabled: true,
    },
    features: [
      '50,000 events/month',
      '10 projects',
      'Unlimited short links',
      'Custom short link domain',
      '1-year data retention',
      'Multi-touch attribution',
      'Priority support',
      'Advanced API access',
      'Webhooks',
      'Custom integrations',
      'White-label reports',
    ],
    popular: true,
  },
  
  business: {
    id: 'business',
    name: 'Business',
    description: 'For enterprises',
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
      '200,000 events/month',
      'Unlimited projects',
      'Unlimited short links',
      'Custom short link domain',
      'Unlimited data retention',
      'White-label options',
      'Dedicated support',
      'SLA guarantee',
      'Custom contracts',
      'SSO (SAML)',
      'Advanced security',
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
