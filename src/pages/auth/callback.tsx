import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { XCircle, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

// Função para rastrear eventos no Revenify
const trackRevenifyEvent = (eventType: string, data: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && (window as any).revenify) {
    if (eventType === 'signup') {
      (window as any).revenify.trackLead(data)
    } else {
      (window as any).revenify.track(eventType, data)
    }
  }
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Autenticando...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Verificar tokens na URL (hash ou search params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const searchParams = new URLSearchParams(window.location.search)
        
        // Verificar se há erro na URL (OTP expirado, etc)
        const errorCode = hashParams.get('error') || searchParams.get('error')
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description')
        
        if (errorCode) {
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
        
        let session = null
        let error = null
        
        if (accessToken && refreshToken) {
          // Definir sessão a partir dos tokens
          const result = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          session = result.data.session
          error = result.error
        } else {
          // Tentar obter sessão existente (pode ter sido setada pelo Supabase automaticamente)
          const result = await supabase.auth.getSession()
          session = result.data.session
          error = result.error
        }
        
        if (error) {
          throw error
        }

        if (session) {
          // Verificar se é novo usuário (criado nos últimos 5 minutos)
          const userCreatedAt = new Date(session.user.created_at)
          const now = new Date()
          const diffMinutes = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60)
          const isNewUser = diffMinutes < 5
          
          if (isNewUser) {
            // Rastrear novo cadastro (signup)
            trackRevenifyEvent('signup', {
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
              provider: session.user.app_metadata?.provider || 'email'
            })
            
            setStatus('success')
            setMessage('Conta criada! Vamos começar o setup.')
            
            setTimeout(() => {
              navigate('/onboarding', { replace: true })
            }, 1500)
          } else {
            setStatus('success')
            setMessage('Login realizado com sucesso!')
            
            setTimeout(() => {
              navigate('/dashboard', { replace: true })
            }, 1500)
          }
        } else {
          setStatus('error')
          setMessage('Nenhuma sessão encontrada. Verifique as configurações do Google OAuth.')
          
          setTimeout(() => {
            navigate('/auth', { replace: true })
          }, 3000)
        }
      } catch (error: any) {
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center space-y-6"
      >
        {/* Preloader minimalista */}
        <div className="flex justify-center">
          {status === 'loading' && (
            <div className="relative">
              {/* Logo ou ícone central */}
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-2xl font-bold text-primary">R</span>
              </motion.div>
              {/* Barra de progresso circular */}
              <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary/20"
                />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="text-primary"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ strokeDasharray: '176', strokeDashoffset: '0' }}
                />
              </svg>
            </div>
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center"
            >
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center"
            >
              <XCircle className="h-8 w-8 text-destructive" />
            </motion.div>
          )}
        </div>

        {/* Mensagem */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="space-y-1"
        >
          <p className="text-base font-medium text-foreground">{message}</p>
          {status === 'error' && (
            <p className="text-sm text-muted-foreground">
              Redirecionando para a página de login...
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
