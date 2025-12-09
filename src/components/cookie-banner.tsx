import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Cookie, Shield, X } from 'lucide-react'

const CONSENT_KEY = 'rv_consent'

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Verificar se já tem consent salvo
    const consent = localStorage.getItem(CONSENT_KEY)
    if (consent === null) {
      // Mostrar banner após 1 segundo
      const timer = setTimeout(() => setShow(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true')
    setShow(false)
    
    // Notificar pixel se existir
    if (window.revenify?.setConsent) {
      window.revenify.setConsent(true)
    }
  }

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'false')
    setShow(false)
    
    // Notificar pixel se existir
    if (window.revenify?.setConsent) {
      window.revenify.setConsent(false)
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <Card className="border-2 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Cookie className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">Privacidade & Cookies</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Usamos cookies para melhorar sua experiência e analisar o tráfego. 
                      Seus dados são protegidos conforme LGPD/GDPR.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleAccept}
                      className="flex-1"
                    >
                      Aceitar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleDecline}
                      className="flex-1"
                    >
                      Recusar
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>Dados anonimizados e criptografados</span>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 shrink-0"
                  onClick={handleDecline}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Declarar tipo global para window.revenify
declare global {
  interface Window {
    revenify?: {
      setConsent?: (given: boolean) => void
      hasConsent?: () => boolean | 'pending'
      trackLead?: (data: { email: string; name?: string }) => void
      trackPurchase?: (data: { amount: number; currency?: string; email?: string }) => void
      track?: (eventName: string, data?: Record<string, unknown>) => void
      getSessionId?: () => string
      getVisitorId?: () => string
    }
  }
}
