import { useSearchParams } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme-toggle'
import LoginPage from '@/components/login'
import SignUpPage from '@/components/sign-up'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')

  return (
    <div className="min-h-screen bg-background relative">
      {/* Top right controls */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Auth Form */}
      {mode === 'signup' ? <SignUpPage /> : <LoginPage />}
    </div>
  )
}
