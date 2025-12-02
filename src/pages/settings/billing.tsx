import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CreditCard,
  Download,
  FileText,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { PricingSection } from '@/components/ui/pricing-section'

// Planos compatíveis com PricingSection
const plans = [
  {
    name: "Grátis",
    info: "Perfeito para começar",
    price: {
      mensal: "Personalizado",
      anual: "Personalizado",
    },
    features: [
      { text: "1 projeto" },
      { text: "3 whiteboards por projeto" },
      { text: "Até 2 membros (você + 1 convidado)" },
      { text: "1 GB de armazenamento" },
      { text: "Documentos ilimitados" },
      { text: "Suporte por email" },
    ],
    highlighted: false,
    id: 'free' as const,
  },
  {
    name: "Pro",
    info: "Para equipes pequenas",
    price: {
      mensal: 65,
      anual: 624,
    },
    originalPrice: 780,
    discount: 20,
    features: [
      { text: "Até 5 projetos" },
      { text: "Whiteboards ilimitados" },
      { text: "Até 10 membros (5 free + 5 pro)" },
      { text: "50 GB de armazenamento" },
      { text: "Documentos ilimitados" },
      { text: "Analytics avançado" },
      { text: "Exportação CSV/JSON" },
      { text: "Suporte prioritário" },
    ],
    highlighted: true,
    id: 'pro' as const,
  },
  {
    name: "Business",
    info: "Para empresas em crescimento",
    price: {
      mensal: 197,
      anual: 1891,
    },
    originalPrice: 2364,
    discount: 20,
    features: [
      { text: "Projetos ilimitados" },
      { text: "Whiteboards ilimitados" },
      { text: "Membros ilimitados" },
      { text: "200 GB de armazenamento" },
      { text: "Documentos ilimitados" },
      { text: "Branding customizado" },
      { text: "SSO (Single Sign-On)" },
      { text: "Backup automático" },
      { text: "Suporte 24/7" },
    ],
    highlighted: false,
    id: 'business' as const,
  },
  {
    name: "Enterprise",
    info: "Para grandes organizações",
    price: {
      mensal: "Personalizado",
      anual: "Personalizado",
    },
    features: [
      { text: "Tudo do Business +" },
      { text: "Armazenamento ilimitado" },
      { text: "On-premise deployment" },
      { text: "SLA 99.9%" },
      { text: "Auditoria de segurança" },
      { text: "Treinamento personalizado" },
      { text: "Integrações customizadas" },
      { text: "Contrato anual" },
    ],
    highlighted: false,
    id: 'enterprise' as const,
  },
]

export default function BillingPage() {
  const { t } = useI18n()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingMethods, setLoadingMethods] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null)
  const [showAddMethodDialog, setShowAddMethodDialog] = useState(false)
  const [showChangeMethodDialog, setShowChangeMethodDialog] = useState(false)
  const [savingMethod, setSavingMethod] = useState(false)
  const [newMethod, setNewMethod] = useState({
    cardNumber: '',
    brand: 'visa',
    expMonth: '',
    expYear: '',
  })

  useEffect(() => {
    loadSubscription()
    loadPaymentMethods()
    loadInvoices()
  }, [])

  const loadSubscription = async () => {
    try {
      setLoadingSubscription(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') throw error

      setSubscription(data)
    } catch (error: any) {
      console.error('Error loading subscription:', error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const loadPaymentMethods = async () => {
    try {
      setLoadingMethods(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPaymentMethods(data ?? [])
      if (data && data.length > 0) {
        const defaultMethod = data.find((method) => method.is_default)
        setSelectedMethodId(defaultMethod ? defaultMethod.id : data[0].id)
      } else {
        setSelectedMethodId(null)
      }
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message || 'Erro ao carregar métodos de pagamento'
      })
    } finally {
      setLoadingMethods(false)
    }
  }

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('billing_date', { ascending: false })

      if (error) throw error

      setInvoices(data ?? [])
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message || 'Erro ao carregar faturas'
      })
    } finally {
      setLoadingInvoices(false)
    }
  }

  const defaultMethod = useMemo(() => {
    if (!selectedMethodId) return null
    return paymentMethods.find((method) => method.id === selectedMethodId) ?? null
  }, [paymentMethods, selectedMethodId])

  const maskedCardNumber = (method: any) => `•••• •••• •••• ${method.last_four}`

  const handleNewMethodChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setNewMethod((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddNewMethod = async () => {
    try {
      setSavingMethod(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      if (newMethod.cardNumber.length < 12) {
        throw new Error(t('billing.cardInvalid'))
      }

      const lastFour = newMethod.cardNumber.slice(-4)

      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user.id,
          type: 'card',
          brand: newMethod.brand,
          last_four: lastFour,
          exp_month: parseInt(newMethod.expMonth),
          exp_year: parseInt(newMethod.expYear),
          is_default: paymentMethods.length === 0,
        })

      if (error) throw error

      toast.success(t('common.success'), {
        description: t('billing.methodAdded')
      })

      setShowAddMethodDialog(false)
      setNewMethod({ cardNumber: '', brand: 'visa', expMonth: '', expYear: '' })
      loadPaymentMethods()
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message || 'Erro ao adicionar método de pagamento'
      })
    } finally {
      setSavingMethod(false)
    }
  }

  const handleSetDefaultMethod = async (methodId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const updates = paymentMethods.map((method) => ({
        id: method.id,
        user_id: user.id,
        is_default: method.id === methodId,
      }))

      const { error } = await supabase
        .from('payment_methods')
        .upsert(updates)

      if (error) throw error

      toast.success(t('common.success'), {
        description: t('billing.methodUpdated')
      })

      setSelectedMethodId(methodId)
      setShowChangeMethodDialog(false)
      loadPaymentMethods()
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message || 'Erro ao atualizar método de pagamento'
      })
    }
  }

  const handleDownloadInvoice = (invoice: any) => {
    // TODO: Implementar download de fatura quando integração de pagamento estiver pronta
    toast.info('Download de faturas estará disponível após integração com gateway de pagamento')
  }

  const currentPlan = subscription?.plan_id || 'free'
  const currentPlanData = plans.find(p => p.id === currentPlan) || plans[0]

  // Preparar planos com ações
  const plansWithActions = plans.map(plan => ({
    ...plan,
    selected: plan.id === currentPlan,
    btn: plan.id === currentPlan ? undefined : {
      text: plan.id === 'enterprise' ? t('billing.contactSales') : t('billing.upgrade'),
      onClick: () => {
        if (plan.id === 'enterprise') {
          window.location.href = 'mailto:contato@isacar.io?subject=Interesse no Plano Enterprise'
        } else {
          toast.info('Integração com gateway de pagamento em breve!')
        }
      },
    }
  }))

  // Loading Skeleton
  if (loadingSubscription) {
    return (
      <DashboardLayout>
        <div className="min-h-screen w-full flex items-start justify-center pt-6 pb-8">
          <div className="w-full px-6 md:px-8 max-w-7xl space-y-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Header Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>

              {/* Current Plan Skeleton */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Plans Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-lg space-y-4 bg-muted/20"
                  >
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((j) => (
                        <Skeleton key={j} className="h-4 w-full" />
                      ))}
                    </div>
                    <Skeleton className="h-9 w-full" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen w-full flex items-start justify-center pt-6 pb-8">
        <div className="w-full px-6 md:px-8 max-w-7xl space-y-8">
          {/* Header */}
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight">{t('billing.title')}</h1>
            <p className="text-xs text-muted-foreground">
              {t('billing.description')}
            </p>
          </div>

          {/* Current Plan - Totalmente minimalista */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-medium">{t('billing.currentPlan')}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('billing.currentPlanDesc').replace('{plan}', currentPlanData.name)}
                </p>
              </div>
              <Badge className="w-fit">
                {currentPlanData.name}
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground">{t('billing.nextCharge')}</p>
                <p className="mt-1 text-xl font-bold">
                  {subscription ? `R$ ${subscription.amount}` : 'R$ 0'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscription?.next_billing_date 
                    ? new Date(subscription.next_billing_date).toLocaleDateString()
                    : '-'
                  }
                </p>
              </div>
              <div className="rounded-lg p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground">{t('billing.members')}</p>
                <p className="mt-1 text-xl font-bold">
                  {subscription?.members_used || 1} / {subscription?.members_limit || 2}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscription ? Math.round((subscription.members_used / subscription.members_limit) * 100) : 50}% {t('billing.used').replace('{percent}', '')}
                </p>
              </div>
              <div className="rounded-lg p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground">{t('billing.storage')}</p>
                <p className="mt-1 text-xl font-bold">
                  {subscription?.storage_used_gb || 0} GB
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscription ? Math.round((subscription.storage_used_gb / subscription.storage_limit_gb) * 100) : 0}% de {subscription?.storage_limit_gb || 1} GB
                </p>
              </div>
            </div>
          </motion.div>

          {/* Pricing Section - Usando o componente do onboarding */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PricingSection
              plans={plansWithActions}
              className="!px-0"
            />
          </motion.div>

          {/* Payment Method - Minimalista */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-medium">{t('billing.paymentMethod')}</h2>
            </div>
            <p className="text-xs text-muted-foreground">{t('billing.paymentMethodDesc')}</p>
            
            {loadingMethods ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : defaultMethod ? (
              <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shrink-0">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{maskedCardNumber(defaultMethod)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('billing.expiresIn')} {String(defaultMethod.exp_month).padStart(2, '0')}/{defaultMethod.exp_year}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8" onClick={() => setShowChangeMethodDialog(true)}>
                  {t('billing.change')}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('billing.noPaymentMethods')}</p>
            )}

            <Button variant="ghost" className="w-full h-9" onClick={() => setShowAddMethodDialog(true)}>
              {t('billing.addNewMethod')}
            </Button>
          </motion.div>

          {/* Invoice History - Minimalista */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-medium">{t('billing.invoiceHistory')}</h2>
            </div>
            <p className="text-xs text-muted-foreground">{t('billing.invoiceHistoryDesc')}</p>
            
            {loadingInvoices ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('billing.noInvoices')}</p>
            ) : (
              <div className="bg-muted/20 rounded-lg">
                <Accordion type="single" collapsible className="w-full">
                  {invoices.map((invoice) => (
                    <AccordionItem key={invoice.id} value={invoice.id} className="border-none">
                      <AccordionTrigger className="text-sm hover:no-underline px-4">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{invoice.invoice_number}</span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'text-xs border-none',
                                invoice.status === 'paid' && 'bg-green-500/10 text-green-500',
                                invoice.status === 'pending' && 'bg-yellow-500/10 text-yellow-500',
                                invoice.status === 'failed' && 'bg-red-500/10 text-red-500'
                              )}
                            >
                              {invoice.status === 'paid' ? t('billing.paid') : invoice.status === 'pending' ? 'Pendente' : 'Falhou'}
                            </Badge>
                          </div>
                          <span className="font-medium text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(invoice.amount))}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground px-4">
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between">
                            <span>Data:</span>
                            <span>{new Date(invoice.billing_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Plano:</span>
                            <span>{invoice.plan_name || 'Pro'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Período:</span>
                            <span>{invoice.billing_period || 'Mensal'}</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2 h-8"
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            <Download className="h-3 w-3 mr-2" />
                            {t('billing.downloadInvoice')}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </motion.div>

          {/* FAQ - Minimalista */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-base font-medium">{t('billing.faq')}</h2>
            <div className="bg-muted/20 rounded-lg">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1" className="border-none">
                  <AccordionTrigger className="text-sm px-4">{t('billing.faq1Question')}</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground px-4">
                    {t('billing.faq1Answer')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2" className="border-none">
                  <AccordionTrigger className="text-sm px-4">{t('billing.faq2Question')}</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground px-4">
                    {t('billing.faq2Answer')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3" className="border-none">
                  <AccordionTrigger className="text-sm px-4">{t('billing.faq3Question')}</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground px-4">
                    {t('billing.faq3Answer')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddMethodDialog} onOpenChange={setShowAddMethodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">{t('billing.addNewMethodTitle')}</DialogTitle>
            <DialogDescription className="text-xs">{t('billing.addNewMethodDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="cardNumber">
                {t('billing.cardNumber')}
              </label>
              <Input
                id="cardNumber"
                name="cardNumber"
                placeholder="4242 4242 4242 4242"
                value={newMethod.cardNumber}
                onChange={handleNewMethodChange}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground" htmlFor="expMonth">
                  {t('billing.expMonth')}
                </label>
                <Input
                  id="expMonth"
                  name="expMonth"
                  placeholder="MM"
                  value={newMethod.expMonth}
                  onChange={handleNewMethodChange}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground" htmlFor="expYear">
                  {t('billing.expYear')}
                </label>
                <Input
                  id="expYear"
                  name="expYear"
                  placeholder="YYYY"
                  value={newMethod.expYear}
                  onChange={handleNewMethodChange}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMethodDialog(false)} className="h-9">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddNewMethod} disabled={savingMethod} className="h-9">
              {savingMethod ? t('common.saving') : t('billing.saveMethod')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Payment Method Dialog */}
      <Dialog open={showChangeMethodDialog} onOpenChange={setShowChangeMethodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">{t('billing.changeMethodTitle')}</DialogTitle>
            <DialogDescription className="text-xs">{t('billing.changeMethodDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3',
                  method.id === selectedMethodId ? 'border-primary bg-primary/10' : 'border-border'
                )}
              >
                <div>
                  <p className="font-medium text-sm">{maskedCardNumber(method)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('billing.expiresIn')} {String(method.exp_month).padStart(2, '0')}/{method.exp_year}
                  </p>
                </div>
                {method.is_default ? (
                  <Badge className="bg-primary/20 text-primary text-xs">Atual</Badge>
                ) : (
                  <Button size="sm" className="h-8" onClick={() => handleSetDefaultMethod(method.id)}>
                    Usar
                  </Button>
                )}
              </div>
            ))}
            {paymentMethods.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('billing.noPaymentMethods')}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeMethodDialog(false)} className="h-9">
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
