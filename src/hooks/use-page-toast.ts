import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface PageToastOptions {
  id: string
  title: string
  description?: string
  type?: 'info' | 'warning' | 'success' | 'error'
  duration?: number
}

/**
 * Hook para mostrar um toast quando o usuário entra na página
 * O toast aparece uma vez por sessão de página (reaparece se o usuário sair e voltar)
 * Toast usa tema neutro (sem cores) para seguir o tema dark/light
 */
export function usePageToast(options: PageToastOptions | null) {
  const hasShown = useRef(false)

  useEffect(() => {
    if (!options || hasShown.current) return

    // Pequeno delay para não aparecer imediatamente
    const timer = setTimeout(() => {
      // Usar toast padrão (neutro) para seguir o tema dark/light
      toast(options.title, {
        description: options.description,
        duration: options.duration || 5000,
        id: options.id,
      })

      hasShown.current = true
    }, 500)

    return () => clearTimeout(timer)
  }, [options])

  // Reset quando o componente é desmontado (usuário sai da página)
  useEffect(() => {
    return () => {
      hasShown.current = false
    }
  }, [])
}

export default usePageToast
