import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { InitialPreload } from '@/components/loading-skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Componente que protege rotas privadas
 * Redireciona para /auth se usuário não estiver autenticado
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Enquanto carrega, mostra skeleton
  if (loading) {
    return <InitialPreload />
  }

  // Se não tem usuário, redireciona para login
  if (!user) {
    console.warn('🔒 ProtectedRoute: Usuário não autenticado, redirecionando para /auth')
    return <Navigate to="/auth" replace />
  }

  // Usuário autenticado, renderiza conteúdo
  return <>{children}</>
}
