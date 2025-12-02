import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/contexts/workspace-context'
import { GoogleAuthService } from '@/services/google/google-auth.service'
import { toast } from 'sonner'

interface GoogleIntegration {
  id: string
  google_email: string
  is_active: boolean
  scopes: string[]
  token_expires_at?: string
  settings: {
    gmail: { enabled: boolean; auto_import: boolean }
    calendar: { enabled: boolean; sync_tasks: boolean }
    sheets: { enabled: boolean }
  }
  created_at: string
}

// Função auxiliar para salvar integração
const saveGoogleIntegration = async (accessToken: string, user: any) => {
  console.log('📝 saveGoogleIntegration chamada', {
    hasToken: !!accessToken,
    tokenLength: accessToken?.length,
    userId: user?.id
  })

  try {
    // Buscar email do Google
    console.log('📧 Buscando info do Google...')
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!userInfoResponse.ok) {
      throw new Error(`Erro ao buscar info do Google: ${userInfoResponse.status}`)
    }
    
    const userInfo = await userInfoResponse.json()
    console.log('✅ Info do Google obtida:', userInfo.email)

    // Testar escopo do Drive (opcional - não falha se não tiver permissão)
    let hasDriveAccess = false
    try {
      const testResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      hasDriveAccess = testResponse.ok
      console.log(hasDriveAccess ? '✅ Acesso ao Drive confirmado' : '⚠️ Sem acesso ao Drive (escopo não autorizado)')
    } catch (e) {
      console.log('⚠️ Erro ao testar Drive (não crítico)')
    }

    // Salvar na tabela
    console.log('💾 Salvando na tabela google_integrations...')
    
    // Token do Google expira em 1 hora (3600 segundos)
    const tokenExpiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
    
    const dataToInsert = {
      user_id: user.id,
      workspace_id: null, // Pode ser atualizado depois
      google_email: userInfo.email,
      google_id: userInfo.id,
      access_token: accessToken,
      token_expires_at: tokenExpiresAt,
      is_active: true,
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/spreadsheets',
        ...(hasDriveAccess ? [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/documents'
        ] : [])
      ],
      settings: {
        gmail: { enabled: true, auto_import: true },
        calendar: { enabled: true, sync_tasks: true },
        sheets: { enabled: true },
        drive: { enabled: hasDriveAccess },
        docs: { enabled: hasDriveAccess }
      }
    }

    console.log('📊 Dados a inserir:', {
      user_id: dataToInsert.user_id,
      email: dataToInsert.google_email,
      scopes: dataToInsert.scopes.length
    })

    const { data, error } = await supabase
      .from('google_integrations')
      .upsert(dataToInsert, {
        onConflict: 'user_id'
      })
      .select()

    if (error) {
      console.error('❌ Erro do Supabase:', error)
      throw error
    }

    console.log('✅ Google integration saved:', userInfo.email, data)
  } catch (error) {
    console.error('❌ Erro ao salvar integração Google:', error)
    throw error // Re-throw para o caller ver
  }
}

export function useGoogleIntegration() {
  const { currentWorkspace } = useWorkspace()
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [tokenExpired, setTokenExpired] = useState(false)

  // Verificar se token expirou
  const checkTokenExpiration = (expiresAt?: string): boolean => {
    if (!expiresAt) return false
    const expirationTime = new Date(expiresAt).getTime()
    const now = Date.now()
    // Considerar expirado se faltam menos de 5 minutos
    return now >= expirationTime - (5 * 60 * 1000)
  }

  // Verificar se Google está conectado
  const checkConnection = useCallback(async () => {
    try {
      // Buscar user atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setChecking(false)
        return
      }

      // Buscar integração - primeiro tenta do workspace, depois pessoal
      let query = supabase
        .from('google_integrations')
        .select('*')
        .eq('is_active', true)

      if (currentWorkspace?.id) {
        // Se tem workspace, buscar integração do workspace
        query = query.eq('workspace_id', currentWorkspace.id)
      } else {
        // Se não tem workspace, buscar integração pessoal
        query = query.eq('user_id', user.id).is('workspace_id', null)
      }

      let { data, error } = await query.maybeSingle()

      // Se não encontrou no workspace, tentar buscar pessoal como fallback
      if (!data && currentWorkspace?.id) {
        const { data: personalData } = await supabase
          .from('google_integrations')
          .select('*')
          .eq('user_id', user.id)
          .is('workspace_id', null)
          .eq('is_active', true)
          .maybeSingle()
        
        data = personalData
      }

      if (error) throw error

      setIntegration(data)
      
      // Verificar se token expirou
      if (data?.token_expires_at) {
        const expired = checkTokenExpiration(data.token_expires_at)
        setTokenExpired(expired)
        if (expired) {
          console.warn('⚠️ Token do Google expirou. Reconexão necessária.')
        }
      }
    } catch (error) {
      console.error('Erro ao verificar integração Google:', error)
    } finally {
      setChecking(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // Listener separado para OAuth - SEM dependências para evitar loops
  useEffect(() => {
    // Flag para evitar processamento duplicado
    let processed = false
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Evitar processamento duplicado
      if (processed) return
      
      // Verificar se já foi processado nesta sessão
      const alreadyProcessed = sessionStorage.getItem('google_oauth_hook_processed')
      if (alreadyProcessed === 'true') {
        console.log('⏭️ OAuth já processado pelo hook, pulando...')
        return
      }

      console.log('🔔 Auth state changed:', event, {
        hasSession: !!session,
        hasProviderToken: !!session?.provider_token,
        provider: session?.user?.app_metadata?.provider
      })

      if (event === 'SIGNED_IN' && session?.provider_token) {
        // Marcar como processado IMEDIATAMENTE
        processed = true
        sessionStorage.setItem('google_oauth_hook_processed', 'true')
        
        console.log('✅ OAuth detectado, salvando integração...')
        try {
          // Usuário voltou do OAuth com provider_token
          await saveGoogleIntegration(session.provider_token, session.user)
          console.log('✅ Integração salva!')
          
          // Atualizar estado local diretamente (sem chamar checkConnection)
          const { data } = await supabase
            .from('google_integrations')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .maybeSingle()
          
          if (data) {
            setIntegration(data)
            setChecking(false)
          }
          
          toast.success('Google conectado com sucesso!')
          
          // Limpar flag após 5 segundos para permitir reconexões futuras
          setTimeout(() => {
            sessionStorage.removeItem('google_oauth_hook_processed')
          }, 5000)
        } catch (error) {
          console.error('❌ Erro no listener OAuth:', error)
          toast.error('Erro ao conectar Google')
          sessionStorage.removeItem('google_oauth_hook_processed')
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // SEM dependências - evita loops

  // Conectar Google (OAuth via Supabase Auth)
  const connect = useCallback(async () => {
    setLoading(true)
    console.log('🔗 Iniciando conexão Google...')

    try {
      const redirectUrl = `${window.location.origin}/settings/integrations`
      console.log('📍 Redirect URL:', redirectUrl)

      // Usar Supabase Auth Provider
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })

      console.log('📤 Resposta OAuth:', { data, error })

      if (error) {
        console.error('❌ Erro OAuth:', error)
        throw error
      }

      if (data?.url) {
        console.log('🚀 Redirecionando para:', data.url)
        toast.info('Redirecionando para Google...')
        // Forçar redirecionamento se não acontecer automaticamente
        window.location.href = data.url
      } else {
        console.warn('⚠️ Nenhuma URL de redirect retornada')
        toast.error('Erro: Não foi possível iniciar OAuth')
        setLoading(false)
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao conectar Google:', error)
      toast.error('Erro ao conectar: ' + (error.message || 'Erro desconhecido'))
      setLoading(false)
    }
  }, [])

  // Desconectar
  const disconnect = useCallback(async () => {
    if (!integration) return

    if (!confirm('Desconectar Google? Você precisará reconectar para usar as integrações.')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('google_integrations')
        .delete()
        .eq('id', integration.id)

      if (error) throw error

      // Limpar cache de tokens
      GoogleAuthService.clearCache()
      
      // Atualizar estado imediatamente (sem precisar recarregar)
      setIntegration(null)
      toast.success('Google desconectado')
      console.log('✅ Google desconectado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error)
      toast.error('Erro ao desconectar Google')
    } finally {
      setLoading(false)
    }
  }, [integration])

  // Atualizar configurações
  const updateSettings = useCallback(async (newSettings: Partial<GoogleIntegration['settings']>) => {
    if (!integration) return

    try {
      const { error } = await supabase
        .from('google_integrations')
        .update({
          settings: { ...integration.settings, ...newSettings }
        })
        .eq('id', integration.id)

      if (error) throw error

      setIntegration(prev => prev ? { ...prev, settings: { ...prev.settings, ...newSettings } } : null)
      toast.success('Configurações atualizadas')
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      toast.error('Erro ao atualizar configurações')
    }
  }, [integration])

  return {
    integration,
    isConnected: !!integration,
    tokenExpired,
    loading,
    checking,
    connect,
    disconnect,
    updateSettings,
    refresh: checkConnection,
    reconnect: connect // Alias para reconexão
  }
}
