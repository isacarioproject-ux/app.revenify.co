import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  BarChart3, 
  Zap, 
  Target,
  Copy,
  CheckCircle2,
  Globe,
  Code2,
  Loader2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { createProject } from '@/lib/supabase/queries'

// Configuração dos steps
const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'project', title: 'Create Project' },
  { id: 'pixel', title: 'Install Pixel' },
  { id: 'success', title: 'Done!' },
]

// Animações
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
}

// Animação flutuante para os cards
const floatingAnimation = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  whileHover: { 
    y: -4, 
    scale: 1.02,
    boxShadow: '0 10px 40px -10px rgba(99, 102, 241, 0.3)',
    transition: { duration: 0.2 }
  }
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form data
  const [projectName, setProjectName] = useState('')
  const [projectDomain, setProjectDomain] = useState('')
  const [createdProject, setCreatedProject] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Verificar se já completou onboarding
  useEffect(() => {
    if (user) {
      const onboardingKey = `onboarding_completed_${user.id}`
      const completed = localStorage.getItem(onboardingKey) === 'true'
      if (completed) {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, navigate])

  const handleNext = async () => {
    if (currentStep === 1) {
      // Criar projeto
      if (!projectName.trim() || !projectDomain.trim()) {
        toast.error(t('onboarding.fillAllFields'))
        return
      }
      
      setIsLoading(true)
      try {
        const project = await createProject({
          name: projectName,
          domain: projectDomain.replace(/^https?:\/\//, '').replace(/^www\./, '')
        })
        setCreatedProject(project)
        setCurrentStep(currentStep + 1)
      } catch (error: any) {
        toast.error(t('onboarding.errorCreating'), { description: error.message })
      } finally {
        setIsLoading(false)
      }
    } else if (currentStep === STEPS.length - 1) {
      // Finalizar
      if (user) {
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true')
      }
      toast.success(t('onboarding.setupComplete'))
      navigate('/dashboard', { replace: true })
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkip = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true')
    }
    toast.info(t('onboarding.configLater'))
    navigate('/dashboard', { replace: true })
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCopyPixel = () => {
    const pixelCode = `<script>
  window.revenify = { projectKey: '${createdProject?.project_key || 'YOUR_PROJECT_KEY'}' };
</script>
<script src="https://cdn.revenify.co/pixel.js" async></script>`
    
    navigator.clipboard.writeText(pixelCode)
    setCopied(true)
    toast.success(t('onboarding.codeCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

  const pixelCode = `<script>
  window.revenify = { projectKey: '${createdProject?.project_key || 'YOUR_PROJECT_KEY'}' };
</script>
<script src="https://cdn.revenify.co/pixel.js" async></script>`

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Revenify" className="h-6" />
            <span className="font-semibold text-lg">Revenify</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            {t('onboarding.skipSetup')}
            <X className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </header>

{/* Progress Bar - Hidden for cleaner UI */}

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {currentStep === 0 && (
              <motion.div
                key="welcome"
                {...fadeInUp}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mx-auto mb-6"
                >
                  <img src="/logo.png" alt="Revenify" className="h-20 w-20 object-contain" />
                </motion.div>

                <h1 className="text-3xl font-bold mb-3">
                  {t('onboarding.welcomeTitle')}
                </h1>
                <p className="text-muted-foreground text-lg mb-8">
                  {t('onboarding.welcomeDesc')}
                </p>

                <motion.div 
                  variants={staggerChildren}
                  initial="initial"
                  animate="animate"
                  className="grid gap-4 mb-8"
                >
                  {[
                    { icon: Target, title: t('onboarding.feature1Title'), desc: t('onboarding.feature1Desc'), color: 'from-indigo-500/20 to-indigo-500/5', iconColor: 'text-indigo-500' },
                    { icon: BarChart3, title: t('onboarding.feature2Title'), desc: t('onboarding.feature2Desc'), color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-500' },
                    { icon: Zap, title: t('onboarding.feature3Title'), desc: t('onboarding.feature3Desc'), color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-500' },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      variants={floatingAnimation}
                      whileHover="whileHover"
                      className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/50 text-left cursor-pointer shadow-sm hover:shadow-lg transition-shadow"
                    >
                      <motion.div 
                        className={cn('p-3 rounded-xl bg-gradient-to-br', feature.color)}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      >
                        <feature.icon className={cn('h-6 w-6', feature.iconColor)} />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold text-base">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <Button size="lg" className="w-full" onClick={handleNext}>
                  {t('onboarding.getStarted')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Create Project */}
            {currentStep === 1 && (
              <motion.div
                key="project"
                {...fadeInUp}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2">{t('onboarding.createProjectTitle')}</h1>
                  <p className="text-muted-foreground">
                    {t('onboarding.createProjectDesc')}
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">{t('onboarding.projectName')}</Label>
                    <Input
                      id="projectName"
                      placeholder={t('onboarding.projectNamePlaceholder')}
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectDomain">{t('onboarding.projectDomain')}</Label>
                    <Input
                      id="projectDomain"
                      placeholder={t('onboarding.projectDomainPlaceholder')}
                      value={projectDomain}
                      onChange={(e) => setProjectDomain(e.target.value)}
                      className="h-12"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('onboarding.domainHint')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('common.back')}
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    disabled={isLoading || !projectName.trim() || !projectDomain.trim()}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.creating')}
                      </>
                    ) : (
                      <>
                        {t('onboarding.createProject')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Install Pixel */}
            {currentStep === 2 && (
              <motion.div
                key="pixel"
                {...fadeInUp}
              >
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">{t('onboarding.installPixelTitle')}</h1>
                  <p className="text-muted-foreground">
                    {t('onboarding.installPixelDesc')}
                  </p>
                </div>

                {createdProject && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-emerald-500">
                        {t('onboarding.projectCreated', { name: createdProject.name })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Key: {createdProject.project_key}
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="relative mb-6">
                  <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-xl overflow-x-auto text-xs leading-relaxed border border-neutral-800">
                    <code>{pixelCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant={copied ? "default" : "secondary"}
                    className="absolute top-3 right-3"
                    onClick={handleCopyPixel}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        {t('common.copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        {t('common.copy')}
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 mb-6 border border-border/50">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    {t('onboarding.whereToAdd')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.whereToAddDesc')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('common.back')}
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    {t('common.continue')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  {t('onboarding.doLater')}
                </p>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {currentStep === 3 && (
              <motion.div
                key="success"
                {...fadeInUp}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mx-auto mb-6"
                >
                  <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold mb-3"
                >
                  {t('onboarding.allSet')} 🎉
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground text-lg mb-8"
                >
                  {t('onboarding.readyToTrack')}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-muted/50 rounded-xl p-6 mb-8 border border-border/50 text-left"
                >
                  <h3 className="font-semibold mb-4">{t('onboarding.nextSteps')}</h3>
                  <ul className="space-y-3">
                    {[
                      t('onboarding.step1'),
                      t('onboarding.step2'),
                      t('onboarding.step3'),
                      t('onboarding.step4'),
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {i + 1}
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button size="lg" className="w-full" onClick={handleNext}>
                    {t('onboarding.goToDashboard')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

    </div>
  )
}
