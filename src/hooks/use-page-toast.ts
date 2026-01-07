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
 * O toast aparece uma vez por sessão de página e SOME quando o usuário sai da página
 */
export function usePageToast(options: PageToastOptions | null) {
  const hasShown = useRef(false)
  const toastIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!options || hasShown.current) return

    // Pequeno delay para não aparecer imediatamente
    const timer = setTimeout(() => {
      toastIdRef.current = options.id
      toast(options.title, {
        description: options.description,
        duration: options.duration || 8000,
        id: options.id,
      })

      hasShown.current = true
    }, 500)

    return () => clearTimeout(timer)
  }, [options])

  // Dismiss toast e reset quando o componente é desmontado (usuário sai da página)
  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
      }
      hasShown.current = false
      toastIdRef.current = null
    }
  }, [])
}

export default usePageToast
