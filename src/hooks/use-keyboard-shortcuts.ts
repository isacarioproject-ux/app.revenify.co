import { useEffect } from 'react'

export const useKeyboardShortcuts = (handlers: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Ctrl/Cmd + K: Busca
      if (modKey && e.key === 'k') {
        e.preventDefault()
        handlers.search?.()
      }

      // Ctrl/Cmd + S: Salvar
      if (modKey && e.key === 's') {
        e.preventDefault()
        handlers.save?.()
      }

      // Ctrl/Cmd + /: Comentários
      if (modKey && e.key === '/') {
        e.preventDefault()
        handlers.comments?.()
      }

      // Ctrl/Cmd + B: Sidebar elementos
      if (modKey && e.key === 'b') {
        e.preventDefault()
        handlers.sidebar?.()
      }

      // ESC: Fechar
      if (e.key === 'Escape') {
        handlers.close?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
