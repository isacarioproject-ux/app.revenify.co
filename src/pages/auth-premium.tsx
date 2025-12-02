import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthForm } from '@/components/ui/premium-auth'
import { toast } from 'sonner'

export default function AuthPagePremium() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLDivElement>(null)

  const handleSuccess = (userData: { email: string; name?: string }) => {
    console.log('Authentication successful:', userData)
    toast.success('Autenticação bem-sucedida!')

    // Redirecionar para dashboard
    setTimeout(() => {
      navigate('/dashboard')
    }, 1000)
  }

  // Interceptar submissões do formulário e substituir pela lógica Supabase
  useEffect(() => {
    const formElement = formRef.current
    if (!formElement) return

    const handleFormSubmit = async (event: Event) => {
      const target = event.target as HTMLFormElement
      if (target.tagName !== 'FORM') return

      event.preventDefault()
      event.stopPropagation()

      // Extrair dados do formulário
      const formData = new FormData(target)
      const email = (target.querySelector('input[type="email"]') as HTMLInputElement)?.value
      const password = (target.querySelector('input[type="password"]') as HTMLInputElement)?.value
      const name = (target.querySelector('input[placeholder="Full Name"]') as HTMLInputElement)?.value
      const rememberMe = (target.querySelector('input[type="checkbox"][aria-label="Remember me"]') as HTMLInputElement)?.checked
      const agreeToTerms = (target.querySelector('input[type="checkbox"][aria-describedby]') as HTMLInputElement)?.checked

      // Determinar modo baseado no estado do formulário
      const isLoginMode = target.querySelector('[placeholder="Full Name"]') === null
      const isResetMode = target.querySelector('[placeholder="Enter 6-digit code"]') !== null ||
                         (target.querySelector('button')?.textContent?.includes('Send Reset Link'))

      try {
        if (isResetMode && email && !password) {
          // Password reset
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset`,
          })

          if (error) throw error
          toast.success('Email de recuperação enviado!')

        } else if (isLoginMode && email && password) {
          // Login
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) throw error
          if (!data.session) throw new Error('Não foi possível iniciar a sessão')

          if (rememberMe) {
            localStorage.setItem('isacar:last-email', email)
          } else {
            localStorage.removeItem('isacar:last-email')
          }

          handleSuccess({ email })

        } else if (!isLoginMode && email && password && name) {
          // Signup
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              },
            },
          })

          if (error) throw error

          if (data.user && !data.session) {
            toast.success('Conta criada! Verifique seu email para confirmar o cadastro.')
            return
          }

          handleSuccess({ email, name })
        }
      } catch (err: any) {
        toast.error('Erro na autenticação', {
          description: err.message
        })
      }
    }

    // Adicionar listener com capture para interceptar antes do handler interno
    formElement.addEventListener('submit', handleFormSubmit, true)

    return () => {
      formElement.removeEventListener('submit', handleFormSubmit, true)
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <div className="pt-6 px-6">
          <Logo className="mx-auto mb-4" />
        </div>
        <CardContent className="pb-6" ref={formRef}>
          <AuthForm
            onSuccess={handleSuccess}
            onClose={() => navigate('/dashboard')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
