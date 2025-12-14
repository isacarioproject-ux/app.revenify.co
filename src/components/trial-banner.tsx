import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '@/contexts/subscription-context'
import { useI18n } from '@/hooks/use-i18n'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Clock, X, Sparkles } from 'lucide-react'
import { differenceInDays, differenceInHours, parseISO } from 'date-fns'

const TRIAL_DURATION_DAYS = 14

export function TrialBanner() {
  const { t } = useI18n()
  const { subscription } = useSubscription()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number } | null>(null)

  useEffect(() => {
    if (!subscription || subscription.status !== 'trialing') {
      return
    }

    const calculateTimeLeft = () => {
      const createdAt = parseISO(subscription.created_at)
      const trialEndDate = new Date(createdAt)
      trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS)
      
      const now = new Date()
      const daysLeft = differenceInDays(trialEndDate, now)
      const hoursLeft = differenceInHours(trialEndDate, now) % 24

      if (daysLeft < 0) {
        return null
      }

      return { days: Math.max(0, daysLeft), hours: Math.max(0, hoursLeft) }
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000 * 60 * 60) // Update every hour

    return () => clearInterval(interval)
  }, [subscription])

  // Don't show if not trialing, dismissed, or no time left data
  if (!subscription || subscription.status !== 'trialing' || dismissed || !timeLeft) {
    return null
  }

  // Show different urgency levels
  const isUrgent = timeLeft.days <= 3
  const isCritical = timeLeft.days <= 1

  return (
    <Alert 
      className={`mb-4 border ${
        isCritical 
          ? 'border-red-500/50 bg-red-500/10' 
          : isUrgent 
            ? 'border-amber-500/50 bg-amber-500/10' 
            : 'border-primary/50 bg-primary/10'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Clock className={`h-4 w-4 ${isCritical ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-primary'}`} />
          <AlertDescription className="text-sm">
            <span className="font-medium">
              {t('trial.trialEndsIn')}
            </span>
            {' '}
            <span className={`font-bold ${isCritical ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-primary'}`}>
              {timeLeft.days > 0 
                ? `${timeLeft.days} ${t('trial.days')}${timeLeft.hours > 0 ? ` ${t('trial.and')} ${timeLeft.hours} ${t('trial.hours')}` : ''}`
                : `${timeLeft.hours} ${t('trial.hours')}`
              }
            </span>
            {' '}
            <span className="text-muted-foreground">
              {t('trial.upgradeToKeep')}
            </span>
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => navigate('/pricing')}
            className={isCritical ? 'bg-red-500 hover:bg-red-600' : isUrgent ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {t('trial.upgrade')}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}
