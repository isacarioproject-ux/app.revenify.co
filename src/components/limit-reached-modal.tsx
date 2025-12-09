import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Zap, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface LimitReachedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  limitType: 'events' | 'short_links' | 'projects' | 'ai_messages'
  currentPlan: string
  used: number
  limit: number
}

const LIMIT_INFO = {
  events: {
    title: 'Limite de Eventos Atingido',
    description: 'Você atingiu o limite mensal de eventos do seu plano.',
    icon: '📊',
  },
  short_links: {
    title: 'Limite de Links Atingido',
    description: 'Você atingiu o limite de links curtos do seu plano.',
    icon: '🔗',
  },
  projects: {
    title: 'Limite de Projetos Atingido',
    description: 'Você atingiu o limite de projetos do seu plano.',
    icon: '📁',
  },
  ai_messages: {
    title: 'Limite de IA Atingido',
    description: 'Você atingiu o limite mensal de mensagens com a IA.',
    icon: '🤖',
  },
}

const PLAN_UPGRADES = {
  free: {
    nextPlan: 'Starter',
    price: 'R$49/mês',
    benefits: ['100K eventos/mês', '100 links curtos', '3 projetos', '50 msgs IA/mês'],
  },
  starter: {
    nextPlan: 'Pro',
    price: 'R$149/mês',
    benefits: ['500K eventos/mês', '500 links curtos', '10 projetos', '200 msgs IA/mês', 'Domínio customizado'],
  },
  pro: {
    nextPlan: 'Business',
    price: 'R$399/mês',
    benefits: ['2M eventos/mês', '2000 links curtos', '50 projetos', '1000 msgs IA/mês', 'API acesso'],
  },
  business: {
    nextPlan: 'Enterprise',
    price: 'Contato',
    benefits: ['Eventos ilimitados', 'Links ilimitados', 'Projetos ilimitados', 'IA ilimitada', 'Suporte dedicado'],
  },
}

export function LimitReachedModal({
  open,
  onOpenChange,
  limitType,
  currentPlan,
  used,
  limit,
}: LimitReachedModalProps) {
  const navigate = useNavigate()
  const info = LIMIT_INFO[limitType]
  const upgrade = PLAN_UPGRADES[currentPlan.toLowerCase() as keyof typeof PLAN_UPGRADES] || PLAN_UPGRADES.free

  const handleUpgrade = () => {
    onOpenChange(false)
    navigate('/pricing')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                <span>{info.icon}</span>
                {info.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Plano atual: <Badge variant="secondary" className="capitalize">{currentPlan}</Badge>
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-base">
          {info.description}
        </DialogDescription>

        {/* Usage Bar */}
        <div className="my-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Uso atual</span>
            <span className="font-medium text-amber-600">{used.toLocaleString()} / {limit.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Upgrade Benefits */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Upgrade para {upgrade.nextPlan}</span>
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
              {upgrade.price}
            </Badge>
          </div>
          <ul className="space-y-1.5">
            {upgrade.benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Zap className="h-3.5 w-3.5 text-purple-500" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="grid gap-3 mt-4">
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={handleUpgrade}
          >
            Ver Opções de Upgrade
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full" 
            onClick={() => onOpenChange(false)}
          >
            Continuar no Plano Atual
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Dúvidas? <a href="/support" className="underline">Fale com o suporte</a>
        </p>
      </DialogContent>
    </Dialog>
  )
}
