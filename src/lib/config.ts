// Configurações centralizadas do Revenify

// Supabase - from environment variables
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''

// =============================================
// DOMÍNIOS REVENIFY
// =============================================
export const DOMAINS = {
  app: 'https://app.revenify.co',      // Dashboard
  api: 'https://api.revenify.co',      // API REST
  cdn: 'https://cdn.revenify.co',      // Pixel JS
  main: 'https://revenify.co',         // Landing page
} as const

// API Endpoints (via Supabase Edge Functions)
export const API_ENDPOINTS = {
  trackEvent: `${SUPABASE_URL}/functions/v1/track-event`,
  apiEvents: `${SUPABASE_URL}/functions/v1/api-events`,
  apiLeads: `${SUPABASE_URL}/functions/v1/api-leads`,
  webhookTest: `${SUPABASE_URL}/functions/v1/webhook-dispatcher`,
  stripeConnect: `${SUPABASE_URL}/functions/v1/stripe-connect`,
  stripeWebhook: `${SUPABASE_URL}/functions/v1/stripe-webhook`,
  aiChat: `${SUPABASE_URL}/functions/v1/ai-chat`,
} as const

// =============================================
// SHORT LINKS CONFIGURATION
// =============================================

// Domínio padrão do Revenify (quando comprar, mudar DOMAIN_CONFIGURED para true)
export const DEFAULT_SHORT_DOMAIN = 'revenify.co'

// IMPORTANTE: Mude para true quando o domínio estiver configurado com proxy para Edge Function
// O domínio revenify.co precisa redirecionar /{code} para a Edge Function redirect-short-link
export const DOMAIN_CONFIGURED = true

// URL da Edge Function (fallback enquanto domínio não está configurado)
export const SHORT_LINK_REDIRECT_URL = `${SUPABASE_URL}/functions/v1/redirect-short-link`

/**
 * Gera URL funcional do short link
 * - Se domínio configurado: https://revenify.co/abc123
 * - Se não configurado: URL da Edge Function (funciona, mas é grande)
 */
export function getShortLinkUrl(shortCode: string, customDomain?: string | null): string {
  // Usuário Pro+ com domínio próprio
  if (customDomain) {
    return `https://${customDomain}/${shortCode}`
  }
  
  // Domínio padrão configurado
  if (DOMAIN_CONFIGURED) {
    return `https://${DEFAULT_SHORT_DOMAIN}/${shortCode}`
  }
  
  // Fallback: Edge Function do Supabase
  return `${SHORT_LINK_REDIRECT_URL}?code=${shortCode}`
}

/**
 * URL para exibir na UI (sempre bonita)
 */
export function getShortLinkDisplayUrl(shortCode: string, customDomain?: string | null): string {
  if (customDomain) {
    return `${customDomain}/${shortCode}`
  }
  return `${DEFAULT_SHORT_DOMAIN}/${shortCode}`
}

/**
 * Verifica se usuário pode usar domínio customizado (Pro+)
 */
export function canUseCustomDomain(plan: string): boolean {
  return ['pro', 'business', 'enterprise'].includes(plan?.toLowerCase() || '')
}

/**
 * Verifica se o sistema de short links está totalmente operacional
 */
export function isShortLinkSystemReady(): boolean {
  return DOMAIN_CONFIGURED
}
