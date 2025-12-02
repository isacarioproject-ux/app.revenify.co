import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detectar se é iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Detectar se é mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(mobile)

    // Verificar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInStandaloneMode = (window.navigator as any).standalone === true
    setIsInstalled(isStandalone || isInStandaloneMode)

    // Escutar evento de instalação
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Escutar quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      // Se não tem prompt, mas é iOS, mostrar instruções
      if (isIOS) {
        return { success: false, reason: 'ios' as const }
      }
      return { success: false, reason: 'no-prompt' as const }
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstallable(false)
        return { success: true, reason: 'accepted' as const }
      }
      
      return { success: false, reason: 'dismissed' as const }
    } catch (error) {
      console.error('Erro ao instalar PWA:', error)
      return { success: false, reason: 'error' as const }
    }
  }, [deferredPrompt, isIOS])

  return {
    isInstallable: isInstallable || isIOS, // iOS sempre mostra (com instruções)
    isInstalled,
    isIOS,
    isMobile,
    installPWA,
  }
}
