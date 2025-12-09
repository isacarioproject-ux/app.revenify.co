// Configurações centralizadas do Revenify

// Supabase
export const SUPABASE_URL = 'https://gyqohtqfyzzifxjkuuiz.supabase.co'
export const SUPABASE_PROJECT_ID = 'gyqohtqfyzzifxjkuuiz'

// =============================================
// SHORT LINKS CONFIGURATION
// =============================================

// Domínio padrão do Revenify (quando comprar, mudar DOMAIN_CONFIGURED para true)
export const DEFAULT_SHORT_DOMAIN = 'revenify.co'

// IMPORTANTE: Mude para true quando o domínio estiver configurado
export const DOMAIN_CONFIGURED = false

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
