import { motion } from 'framer-motion'
import { WizardStepWrapper } from './wizard-step-wrapper'
import { OnboardingHeader } from './onboarding-header'
import { Card } from '@/components/ui/card'
import { Target, BarChart3, Zap } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

interface StepWelcomeProps {
  onNext: () => void
}

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, delay: i * 0.1 },
  }),
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  const { t } = useI18n()

  const features = [
    {
      icon: Target,
      title: t('onboarding.feature1Title'),
      description: t('onboarding.feature1Description'),
    },
    {
      icon: BarChart3,
      title: t('onboarding.feature2Title'),
      description: t('onboarding.feature2Description'),
    },
    {
      icon: Zap,
      title: t('onboarding.feature3Title'),
      description: t('onboarding.feature3Description'),
    },
  ]

  return (
    <div className="space-y-8">
      <OnboardingHeader showToggles={true} />

      <WizardStepWrapper
        title={t('onboarding.welcomeTitle')}
        description={t('onboarding.welcomeSubtitle')}
        onNext={onNext}
        nextLabel={t('onboarding.getStarted')}
        showBack={false}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                initial="initial"
                animate="animate"
              >
                <Card className="p-6 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground pt-4">
          {t('onboarding.setupTime')}
        </div>
      </WizardStepWrapper>
    </div>
  )
}
