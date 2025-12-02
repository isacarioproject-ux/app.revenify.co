import { supabase } from '@/lib/supabase'

interface GoogleIntegrationData {
  id: string
  user_id: string
  workspace_id: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  is_active: boolean
  google_email: string
}

/**
 * 🔐 Google Auth Service
 * Gerencia autenticação, tokens e refresh automático
 */
export class GoogleAuthService {
  // Cache do token para evitar múltiplas chamadas
  private static tokenCache: Map<string, { token: string; expiresAt: number }> = new Map()
  
  // Margem de segurança: refresh 5 minutos antes de expirar
  private static readonly REFRESH_MARGIN_MS = 5 * 60 * 1000

  /**
   * Obter access token válido (com refresh automático se expirado)
   */
  static async getAccessToken(workspaceId?: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const cacheKey = workspaceId || user.id

      // Verificar cache primeiro
      const cached = this.tokenCache.get(cacheKey)
      if (cached && Date.now() < cached.expiresAt) {
        console.log('🔐 Token do cache (ainda válido)')
        return cached.token
      }

      // Buscar integração
      let query = supabase
        .from('google_integrations')
        .select('*')
        .eq('is_active', true)

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      } else {
        query = query.eq('user_id', user.id).is('workspace_id', null)
      }

      const { data: integration, error } = await query.maybeSingle() as { 
        data: GoogleIntegrationData | null
        error: any 
      }

      if (error || !integration) {
        console.warn('⚠️ Integração Google não encontrada')
        return null
      }

      // Verificar se token expirou ou vai expirar em breve
      const needsRefresh = this.isTokenExpired(integration.token_expires_at)
      
      if (needsRefresh) {
        console.log('⚠️ Token expirado ou próximo de expirar')
        console.log('ℹ️ O usuário precisa reconectar o Google nas configurações')
        
        // Limpar cache
        this.tokenCache.delete(cacheKey)
        
        // Retornar null para sinalizar que precisa reconectar
        // Os componentes vão exibir mensagem apropriada
        throw new Error('Token de acesso expirado. Reconecte o Google nas configurações.')
      }

      // Token ainda válido, cachear e retornar
      const expiresAt = integration.token_expires_at 
        ? new Date(integration.token_expires_at).getTime() - this.REFRESH_MARGIN_MS
        : Date.now() + 55 * 60 * 1000
      
      this.tokenCache.set(cacheKey, {
        token: integration.access_token,
        expiresAt
      })

      return integration.access_token
    } catch (error) {
      console.error('Erro ao obter access token:', error)
      return null
    }
  }

  /**
   * Verificar se token expirou ou vai expirar em breve
   */
  private static isTokenExpired(expiresAt: string | null): boolean {
    if (!expiresAt) {
      // Se não tem data de expiração, assumir que token ainda é válido
      // Isso evita quebrar integrações antigas sem token_expires_at
      return false
    }
    
    const expirationTime = new Date(expiresAt).getTime()
    const now = Date.now()
    
    // Refresh se faltam menos de 5 minutos
    return now >= expirationTime - this.REFRESH_MARGIN_MS
  }

  /**
   * Refresh token - Edge Function não disponível
   * Retorna false para forçar reconexão do usuário
   */
  static async refreshToken(integrationId: string): Promise<boolean> {
    console.log('⚠️ Token expirado. Refresh automático não disponível.')
    console.log('ℹ️ O usuário precisa reconectar o Google.')
    
    // Marcar integração como expirada para mostrar aviso
    try {
      await supabase
        .from('google_integrations')
        .update({ token_expired: true })
        .eq('id', integrationId)
    } catch (e) {
      // Ignorar erro se coluna não existir
    }
    
    return false
  }

  /**
   * Verificar se precisa reconectar (token expirado)
   */
  static async needsReconnection(workspaceId?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return true

      let query = supabase
        .from('google_integrations')
        .select('token_expires_at, is_active')
        .eq('is_active', true)

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      } else {
        query = query.eq('user_id', user.id).is('workspace_id', null)
      }

      const { data } = await query.maybeSingle()
      
      if (!data) return true
      
      return this.isTokenExpired(data.token_expires_at)
    } catch {
      return true
    }
  }

  /**
   * Limpar cache de tokens (útil ao desconectar)
   */
  static clearCache() {
    this.tokenCache.clear()
    console.log('🗑️ Cache de tokens limpo')
  }

  /**
   * Verificar se integração está ativa e token válido
   */
  static async isConnected(workspaceId?: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken(workspaceId)
      return !!token
    } catch {
      return false
    }
  }

  /**
   * Testar se o token atual é válido fazendo uma request simples
   */
  static async testConnection(workspaceId?: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken(workspaceId)
      if (!token) return false

      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { Authorization: `Bearer ${token}` }
      })

      return response.ok
    } catch {
      return false
    }
  }
}
