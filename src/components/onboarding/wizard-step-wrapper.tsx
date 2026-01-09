import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WizardStepWrapperProps {
  title: string
  description?: string
  children: ReactNode
  onNext?: () => void
  onBack?: () => void
  onSkip?: () => void
  nextLabel?: string
  backLabel?: string
  skipLabel?: string
  nextDisabled?: boolean
  showBack?: boolean
  showSkip?: boolean
  loading?: boolean
  className?: string
}

const stepVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export function WizardStepWrapper({
  title,
  description,
  children,
  onNext,
  onBack,
  onSkip,
  nextLabel = 'Próximo',
  backLabel = 'Voltar',
  skipLabel = 'Pular',
  nextDisabled = false,
  showBack = true,
  showSkip = false,
  loading = false,
  className,
}: WizardStepWrapperProps) {
  return (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn('w-full max-w-2xl mx-auto space-y-8', className)}
    >
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-lg">{description}</p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">{children}</div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4">
        <div>
          {showBack && onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={loading}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showSkip && onSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={loading}
            >
              {skipLabel}
            </Button>
          )}

          {onNext && (
            <Button
              onClick={onNext}
              disabled={nextDisabled || loading}
              className="gap-2"
            >
              {nextLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
