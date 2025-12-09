import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Autenticando...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔍 [AuthCallback] Processando callback...')
        console.log('🔍 [AuthCallback] URL:', window.location.href)
        
        // Verificar tokens na URL (hash ou search params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const searchParams = new URLSearchParams(window.location.search)
        
        // Verificar se há erro na URL (OTP expirado, etc)
        const errorCode = hashParams.get('error') || searchParams.get('error')
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description')
        
        if (errorCode) {
          console.error('❌ [AuthCallback] Erro na URL:', errorCode, errorDescription)
          
          let userMessage = 'Erro ao autenticar. Tente novamente.'
          
          if (errorCode === 'access_denied') {
            if (errorDescription?.includes('expired')) {
              userMessage = 'Link expirado. Solicite um novo link de acesso.'
            } else if (errorDescription?.includes('invalid')) {
              userMessage = 'Link inválido. Solicite um novo link de acesso.'
            }
          }
          
          setStatus('error')
          setMessage(userMessage)
          
          setTimeout(() => {
            navigate('/auth', { replace: true })
          }, 3000)
          return
        }
        
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')
        const tokenType = hashParams.get('type') || searchParams.get('type')
        
        console.log('🔍 [AuthCallback] Token type:', tokenType)
        console.log('🔍 [AuthCallback] Access token:', !!accessToken)
        console.log('🔍 [AuthCallback] Refresh token:', !!refreshToken)
        
        let session = null
        let error = null
        
        if (accessToken && refreshToken) {
          // Definir sessão a partir dos tokens
          console.log('🔄 [AuthCallback] Definindo sessão a partir dos tokens...')
          const result = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          session = result.data.session
          error = result.error
        } else {
          // Tentar obter sessão existente (pode ter sido setada pelo Supabase automaticamente)
          console.log('🔄 [AuthCallback] Verificando sessão existente...')
          const result = await supabase.auth.getSession()
          session = result.data.session
          error = result.error
        }
        
        if (error) {
          console.error('❌ [AuthCallback] Erro ao processar sessão:', error)
          throw error
        }

        if (session) {
          console.log('✅ [AuthCallback] Sessão obtida com sucesso!')
          console.log('✅ [AuthCallback] Usuário:', session.user.email)
          console.log('✅ [AuthCallback] Provider:', session.user.app_metadata.provider)
          
          // Verificar se é novo usuário (criado nos últimos 5 minutos)
          const userCreatedAt = new Date(session.user.created_at)
          const now = new Date()
          const diffMinutes = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60)
          const isNewUser = diffMinutes < 5
          
          if (isNewUser) {
            console.log('✨ [AuthCallback] Novo usuário detectado, redirecionando para onboarding...')
            setStatus('success')
            setMessage('Conta criada! Vamos começar o setup.')
            
            setTimeout(() => {
              navigate('/onboarding', { replace: true })
            }, 1500)
          } else {
            console.log('👤 [AuthCallback] Usuário existente, redirecionando para dashboard...')
            setStatus('success')
            setMessage('Login realizado com sucesso!')
            
            setTimeout(() => {
              navigate('/dashboard', { replace: true })
            }, 1500)
          }
        } else {
          console.warn('⚠️ [AuthCallback] Nenhuma sessão encontrada')
          console.warn('⚠️ [AuthCallback] Tokens no hash:', { accessToken: !!accessToken, refreshToken: !!refreshToken })
          
          setStatus('error')
          setMessage('Nenhuma sessão encontrada. Verifique as configurações do Google OAuth.')
          
          setTimeout(() => {
            navigate('/auth', { replace: true })
          }, 3000)
        }
      } catch (error: any) {
        console.error('❌ [AuthCallback] Erro no callback:', error)
        console.error('❌ [AuthCallback] Detalhes:', {
          message: error.message,
          status: error.status,
          name: error.name,
        })
        
        setStatus('error')
        setMessage(error.message || 'Erro ao autenticar. Tente novamente.')
        
        setTimeout(() => {
          navigate('/auth', { replace: true })
        }, 2500)
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-4"
      >
        {/* Ícone animado */}
        <div className="flex justify-center">
          {status === 'loading' && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              <XCircle className="h-12 w-12 text-red-500" />
            </motion.div>
          )}
        </div>

        {/* Mensagem */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-lg font-medium">{message}</p>
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground mt-2">
              Isso pode levar alguns segundos...
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-muted-foreground mt-2">
              Redirecionando para a página de login...
            </p>
          )}
        </motion.div>

        {/* Loading dots animados */}
        {status === 'loading' && (
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
