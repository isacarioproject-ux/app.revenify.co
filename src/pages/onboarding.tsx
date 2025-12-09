import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, ArrowRight, Code2, BarChart3, Zap, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

const steps = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Revenify',
    description: 'Rastreie a origem de cada conversão com precisão',
  },
  {
    id: 'domain',
    title: 'Configure seu domínio',
    description: 'Adicione o domínio que você deseja rastrear',
  },
  {
    id: 'pixel',
    title: 'Instale o pixel',
    description: 'Copie o código e adicione ao seu site',
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [domain, setDomain] = useState('')
  const [copied, setCopied] = useState(false)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Finalizar onboarding - salvar no localStorage
      if (user) {
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true')
        console.log('✅ Onboarding completo para:', user.id)
      }
      toast.success('Configuração concluída!')
      navigate('/dashboard', { replace: true })
    }
  }

  const handleCopyPixel = () => {
    navigator.clipboard.writeText(pixelCode)
    setCopied(true)
    toast.success('Código copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  const pixelCode = `<script>
  window.revenify = { projectKey: 'YOUR_PROJECT_KEY' };
</script>
<script src="https://cdn.revenify.co/pixel.js" async></script>`

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-2',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <Code2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Pixel Leve</h4>
                  <p className="text-sm text-muted-foreground">Menos de 2KB</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Analytics</h4>
                  <p className="text-sm text-muted-foreground">Tempo real</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Atribuição</h4>
                  <p className="text-sm text-muted-foreground">First & Last touch</p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domínio do seu site</Label>
                  <Input
                    id="domain"
                    placeholder="exemplo.com.br"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o domínio sem https:// ou www
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{pixelCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={handleCopyPixel}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cole este código antes do fechamento da tag &lt;/head&gt; do seu site.
                </p>
              </div>
            )}

            <Button className="w-full" onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Ir para o Dashboard' : 'Continuar'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
