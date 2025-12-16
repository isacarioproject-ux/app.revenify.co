import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '@/contexts/subscription-context'
import { useI18n } from '@/hooks/use-i18n'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  Sparkles, 
  Zap, 
  Target, 
  Globe, 
  Smartphone,
  Link2,
  Eye,
  BarChart3,
  Check,
  Crown
} from 'lucide-react'
import { differenceInDays, differenceInHours, parseISO } from 'date-fns'

const TRIAL_DURATION_DAYS = 14

export function TrialBanner() {
  const { t } = useI18n()
  const { subscription } = useSubscription()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null)

  useEffect(() => {
    if (!subscription || subscription.status !== 'trialing') {
      return
    }

    // Check if already dismissed in this session
    const dismissedInSession = sessionStorage.getItem('trial_banner_dismissed')
    if (dismissedInSession === 'true') {
      return
    }

    const calculateTimeLeft = () => {
      const trialEnd = subscription.trial_ends_at 
        ? new Date(subscription.trial_ends_at)
        : (() => {
            const createdAt = parseISO(subscription.created_at)
            const endDate = new Date(createdAt)
            endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS)
            return endDate
          })()
      
      const now = new Date()
      const diffMs = trialEnd.getTime() - now.getTime()
      
      if (diffMs < 0) {
        return null
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      return { days, hours, minutes }
    }

    const time = calculateTimeLeft()
    setTimeLeft(time)
    
    // Show dialog after a short delay
    if (time) {
      const timer = setTimeout(() => setOpen(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [subscription])

  useEffect(() => {
    if (!timeLeft) return

    const interval = setInterval(() => {
      if (!subscription || subscription.status !== 'trialing') return
      
      const trialEnd = subscription.trial_ends_at 
        ? new Date(subscription.trial_ends_at)
        : (() => {
            const createdAt = parseISO(subscription.created_at)
            const endDate = new Date(createdAt)
            endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS)
            return endDate
          })()
      
      const now = new Date()
      const diffMs = trialEnd.getTime() - now.getTime()
      
      if (diffMs < 0) {
        setTimeLeft(null)
        return
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      setTimeLeft({ days, hours, minutes })
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [subscription, timeLeft])

  const handleDismiss = () => {
    sessionStorage.setItem('trial_banner_dismissed', 'true')
    setOpen(false)
  }

  const handleUpgrade = () => {
    setOpen(false)
    navigate('/settings/billing')
  }

  // Não mostrar se:
  // - Não tem subscription
  // - Não está em trialing
  // - Já tem plano pago (stripe_subscription_id)
  // - Não tem tempo restante
  if (!subscription || subscription.status !== 'trialing' || subscription.stripe_subscription_id || !timeLeft) {
    return null
  }

  const isUrgent = timeLeft.days <= 3
  const isCritical = timeLeft.days <= 1
  const progressPercent = Math.max(0, Math.min(100, ((TRIAL_DURATION_DAYS - timeLeft.days) / TRIAL_DURATION_DAYS) * 100))

  const features = [
    { icon: Target, label: 'A/B Testing', desc: 'Otimize suas campanhas' },
    { icon: Globe, label: 'Geo Targeting', desc: 'Personalize por país' },
    { icon: Smartphone, label: 'Device Targeting', desc: 'Desktop, Mobile, Tablet' },
    { icon: Link2, label: 'Deep Links', desc: 'Abra apps diretamente' },
    { icon: Eye, label: 'Link Cloaking', desc: 'Customize previews' },
    { icon: BarChart3, label: 'Multi-touch Attribution', desc: 'Jornada completa' },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg overflow-hidden p-0">
        {/* Header com gradiente */}
        <div className={`relative px-4 sm:px-6 pt-4 sm:pt-6 pb-6 sm:pb-8 ${
          isCritical 
            ? 'bg-gradient-to-br from-red-500/20 via-red-600/10 to-transparent' 
            : isUrgent 
              ? 'bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent'
              : 'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent'
        }`}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-xl" />
          
          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${
                isCritical 
                  ? 'bg-red-500/20 text-red-500' 
                  : isUrgent 
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'bg-primary/20 text-primary'
              }`}>
                <Clock className="h-6 w-6" />
              </div>
              <Badge variant="secondary" className="text-xs font-medium">
                <Sparkles className="h-3 w-3 mr-1" />
                {t('trial.trialPro')}
              </Badge>
            </div>
            
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              {isCritical ? t('trial.lastDay') : isUrgent ? t('trial.trialEnding') : t('trial.enjoyTrial')}
            </DialogTitle>
            
            <DialogDescription className="text-base mt-2">
              {isCritical 
                ? t('trial.dontLosePremium')
                : isUrgent 
                  ? t('trial.fewDaysLeft')
                  : t('trial.accessAllFeatures')
              }
            </DialogDescription>
          </DialogHeader>

          {/* Countdown */}
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3">
            <div className="text-center">
              <div className={`text-2xl sm:text-4xl font-bold tabular-nums ${
                isCritical ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-primary'
              }`}>
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{t('trial.days')}</div>
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${
              isCritical ? 'text-red-500/50' : isUrgent ? 'text-amber-500/50' : 'text-primary/50'
            }`}>:</div>
            <div className="text-center">
              <div className={`text-2xl sm:text-4xl font-bold tabular-nums ${
                isCritical ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-primary'
              }`}>
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{t('trial.hours')}</div>
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${
              isCritical ? 'text-red-500/50' : isUrgent ? 'text-amber-500/50' : 'text-primary/50'
            }`}>:</div>
            <div className="text-center">
              <div className={`text-2xl sm:text-4xl font-bold tabular-nums ${
                isCritical ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-primary'
              }`}>
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{t('trial.minutes')}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <Progress 
              value={progressPercent} 
              className={`h-2 ${
                isCritical 
                  ? '[&>div]:bg-red-500' 
                  : isUrgent 
                    ? '[&>div]:bg-amber-500'
                    : '[&>div]:bg-primary'
              }`}
            />
            <p className="text-xs text-muted-foreground mt-1.5 text-center">
              {Math.round(progressPercent)}% {t('trial.trialUsed')}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            {t('trial.featuresIncluded')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="p-1.5 rounded-md bg-primary/10">
                  <feature.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{feature.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDismiss}
          >
            {t('trial.remindLater')}
          </Button>
          <Button
            className={`flex-1 ${
              isCritical 
                ? 'bg-red-500 hover:bg-red-600' 
                : isUrgent 
                  ? 'bg-amber-500 hover:bg-amber-600 text-black'
                  : ''
            }`}
            onClick={handleUpgrade}
          >
            <Zap className="h-4 w-4 mr-2" />
            {t('trial.upgrade')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
