import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { OnboardingStepProps } from '@/types/onboarding'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, HelpCircle, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function BudgetStep({ onNext }: OnboardingStepProps) {
  const { user } = useAuth()
  
  // Controle de sub-passos (1=Entrada, 2=Gasto, 3=Reserva, 4=Meta)
  const [currentSubStep, setCurrentSubStep] = useState(1)
  
  // Estados para Entrada
  const [incomeName, setIncomeName] = useState('')
  const [incomeValue, setIncomeValue] = useState('')
  const [incomeDate, setIncomeDate] = useState<Date>()
  
  // Estados para Gasto
  const [expenseCategory, setExpenseCategory] = useState('')
  const [expensePayment, setExpensePayment] = useState('cash')
  const [expenseValue, setExpenseValue] = useState('')
  const [expenseDate, setExpenseDate] = useState<Date>()
  
  // Estados para Reserva
  const [reserveName, setReserveName] = useState('')
  const [reserveType, setReserveType] = useState<'reserve' | 'investment'>('reserve')
  const [reserveValue, setReserveValue] = useState('')
  const [reserveDate, setReserveDate] = useState<Date>()
  
  // Estados para Meta
  const [goalName, setGoalName] = useState('')
  const [goalType, setGoalType] = useState<'meta' | 'investment'>('meta')
  const [goalValue, setGoalValue] = useState('')
  const [goalDate, setGoalDate] = useState<Date>()
  
  const [loading, setLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleCreate = async () => {
    if (!user) return

    // Validar pelo menos um campo preenchido
    const hasIncome = incomeName.trim() && incomeValue
    const hasExpense = expenseCategory.trim() && expenseValue
    const hasReserve = reserveName.trim() && reserveValue
    const hasGoal = goalName.trim() && goalValue

    if (!hasIncome && !hasExpense && !hasReserve && !hasGoal) {
      toast.error('Preencha pelo menos um campo')
      return
    }

    setLoading(true)

    try {
      // Salvar no modo "Pessoal" (workspace_id = null)
      // Dados pessoais do onboarding ficam sem workspace
      // Usuário pode criar workspace colaborativo depois
      const workspaceId = null
      console.log('🏠 Salvando no modo PESSOAL (sem workspace)')

      const { data: financeDoc, error: docError } = await supabase
        .from('finance_documents')
        .insert({
          name: 'Meu Orçamento Inicial',
          workspace_id: null,  // ✅ Modo PESSOAL (sem workspace)
          user_id: user.id,
          template_type: 'personal',
          description: 'Documento criado no onboarding com suas primeiras entradas financeiras'
        })
        .select()
        .single()

      if (docError) throw docError

      console.log('📄 Documento criado:', financeDoc.name, financeDoc.id)

      // Criar transações reais ao invés de template_config
      const transactions = []

      // 1. ENTRADA (Income)
      if (hasIncome) {
        transactions.push({
          finance_document_id: financeDoc.id,
          type: 'income',
          category: 'Receita',
          description: incomeName.trim(),
          amount: parseFloat(incomeValue),
          transaction_date: incomeDate ? format(incomeDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          payment_method: 'Transferência',
          status: 'confirmed'
        })
        console.log('💰 Adicionando entrada:', incomeName, 'R$', incomeValue)
      }

      // 2. GASTO (Expense)
      if (hasExpense) {
        transactions.push({
          finance_document_id: financeDoc.id,
          type: 'expense',
          category: expenseCategory.trim(),
          description: expenseCategory.trim(),
          amount: parseFloat(expenseValue),
          transaction_date: expenseDate ? format(expenseDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          payment_method: expensePayment,
          status: 'confirmed'
        })
        console.log('💸 Adicionando gasto:', expenseCategory, 'R$', expenseValue)
      }

      // 3. RESERVA (Income type reserve)
      if (hasReserve) {
        transactions.push({
          finance_document_id: financeDoc.id,
          type: 'income',
          category: reserveType === 'reserve' ? 'Reserva' : 'Investimento',
          description: reserveName.trim(),
          amount: parseFloat(reserveValue),
          transaction_date: reserveDate ? format(reserveDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          payment_method: 'Transferência',
          status: 'confirmed',
          tags: [reserveType]
        })
        console.log('🏦 Adicionando reserva:', reserveName, 'R$', reserveValue)
      }

      // 4. META (Income type goal)
      if (hasGoal) {
        transactions.push({
          finance_document_id: financeDoc.id,
          type: 'income',
          category: goalType === 'meta' ? 'Meta' : 'Investimento',
          description: goalName.trim(),
          amount: parseFloat(goalValue),
          transaction_date: goalDate ? format(goalDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          payment_method: 'Transferência',
          status: 'pending',
          tags: [goalType]
        })
        console.log('🎯 Adicionando meta:', goalName, 'R$', goalValue)
      }

      // Inserir todas as transações
      if (transactions.length > 0) {
        const { error: transactionsError } = await supabase
          .from('finance_transactions')
          .insert(transactions)

        if (transactionsError) {
          console.error('❌ Erro ao criar transações:', transactionsError)
          throw transactionsError
        }

        console.log('✅', transactions.length, 'transações criadas com sucesso!')
      }

      toast.success('💰 Orçamento inicial criado!')
      onNext({ createdBudget: true })
    } catch (error: any) {
      console.error('❌ Erro ao criar orçamento:', error)
      toast.error(`Erro ao criar: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    setSkipping(true)
    onNext({ createdBudget: false })
  }

  const handleNext = () => {
    if (currentSubStep < 4) {
      setCurrentSubStep(currentSubStep + 1)
    } else {
      handleCreate()
    }
  }

  const handleBack = () => {
    if (currentSubStep > 1) {
      setCurrentSubStep(currentSubStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentSubStep) {
      case 1: return incomeName.trim() && incomeValue
      case 2: return expenseCategory.trim() && expenseValue
      case 3: return reserveName.trim() && reserveValue
      case 4: return goalName.trim() && goalValue
      default: return false
    }
  }

  const subStepConfig = {
    1: { title: 'Entrada', icon: '💚', desc: 'Registre suas fontes de renda' },
    2: { title: 'Gastos', icon: '❤️', desc: 'Anote suas despesas' },
    3: { title: 'Reserva & Investimento', icon: '💛', desc: 'Planeje seu futuro' },
    4: { title: 'Meta & Investimento', icon: '💜', desc: 'Defina seus objetivos' },
  }

  const config = subStepConfig[currentSubStep as keyof typeof subStepConfig]

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white/60 via-white/40 to-white/60 flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-lg space-y-2 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Logo com gradiente colorido de fundo */}
        <div className="text-center space-y-1">
          <div className="relative inline-block">
            {/* Gradiente colorido atrás do logo */}
            <div className="absolute inset-0 blur-2xl sm:blur-3xl opacity-40 overflow-visible">
              <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-400 rounded-full"></div>
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-0 left-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-yellow-400 rounded-full"></div>
              <div className="absolute bottom-0 right-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-red-400 rounded-full"></div>
            </div>
            
            {/* Logo */}
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 relative z-10" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Isacar.dev
            </h1>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-0.5">
          <h2 className="text-base font-semibold text-gray-900">{config.icon} {config.title}</h2>
          <p className="text-xs text-gray-600">{config.desc} (opcional)</p>
          <div className="flex justify-center gap-1 mt-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1 w-8 rounded-full transition-colors ${
                  step === currentSubStep ? 'bg-gray-900' : step < currentSubStep ? 'bg-gray-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Formulário - SEM CARD */}
        <div className="space-y-3">
          {/* SUB-PASSO 1: ENTRADA */}
          {currentSubStep === 1 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="income-name" className="text-xs">Nome</Label>
                <Input
                  id="income-name"
                  placeholder="Ex: Salário"
                  value={incomeName}
                  onChange={(e) => setIncomeName(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="income-value" className="text-xs">Valor</Label>
                <Input
                  id="income-value"
                  type="number"
                  placeholder="0.00"
                  value={incomeValue}
                  onChange={(e) => setIncomeValue(e.target.value)}
                  className="h-9 text-sm"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="income-date" className="text-xs">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="income-date"
                      variant="outline"
                      className="w-full h-9 text-sm justify-start text-left font-normal"
                    >
                      {incomeDate ? format(incomeDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={incomeDate}
                      onSelect={(d) => {
                        if (d) {
                          setIncomeDate(d)
                          document.getElementById('income-date')?.click()
                        }
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* SUB-PASSO 2: GASTO */}
          {currentSubStep === 2 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="expense-category" className="text-xs">Categoria</Label>
                <Input
                  id="expense-category"
                  placeholder="Ex: Alimentação"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="expense-payment" className="text-xs">Pagamento</Label>
                <Select value={expensePayment} onValueChange={setExpensePayment}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="credit">Crédito</SelectItem>
                    <SelectItem value="debit">Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expense-value" className="text-xs">Valor</Label>
                <Input
                  id="expense-value"
                  type="number"
                  placeholder="0.00"
                  value={expenseValue}
                  onChange={(e) => setExpenseValue(e.target.value)}
                  className="h-9 text-sm"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="expense-date" className="text-xs">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="expense-date"
                      variant="outline"
                      className="w-full h-9 text-sm justify-start text-left font-normal"
                    >
                      {expenseDate ? format(expenseDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={expenseDate}
                      onSelect={(d) => {
                        if (d) {
                          setExpenseDate(d)
                          document.getElementById('expense-date')?.click()
                        }
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* SUB-PASSO 3: RESERVA */}
          {currentSubStep === 3 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="reserve-name" className="text-xs">Nome</Label>
                <Input
                  id="reserve-name"
                  placeholder="Ex: Fundo emergência"
                  value={reserveName}
                  onChange={(e) => setReserveName(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="reserve-type" className="text-xs">Tipo</Label>
                <Select value={reserveType} onValueChange={(v) => setReserveType(v as 'reserve' | 'investment')}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reserve">Reserva</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reserve-value" className="text-xs">Valor</Label>
                <Input
                  id="reserve-value"
                  type="number"
                  placeholder="0.00"
                  value={reserveValue}
                  onChange={(e) => setReserveValue(e.target.value)}
                  className="h-9 text-sm"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="reserve-date" className="text-xs">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="reserve-date"
                      variant="outline"
                      className="w-full h-9 text-sm justify-start text-left font-normal"
                    >
                      {reserveDate ? format(reserveDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={reserveDate}
                      onSelect={(d) => {
                        if (d) {
                          setReserveDate(d)
                          document.getElementById('reserve-date')?.click()
                        }
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* SUB-PASSO 4: META */}
          {currentSubStep === 4 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="goal-name" className="text-xs">Nome</Label>
                <Input
                  id="goal-name"
                  placeholder="Ex: Viagem"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="goal-type" className="text-xs">Tipo</Label>
                <Select value={goalType} onValueChange={(v) => setGoalType(v as 'meta' | 'investment')}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta">Meta</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="goal-value" className="text-xs">Valor</Label>
                <Input
                  id="goal-value"
                  type="number"
                  placeholder="0.00"
                  value={goalValue}
                  onChange={(e) => setGoalValue(e.target.value)}
                  className="h-9 text-sm"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="goal-date" className="text-xs">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="goal-date"
                      variant="outline"
                      className="w-full h-9 text-sm justify-start text-left font-normal"
                    >
                      {goalDate ? format(goalDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={goalDate}
                      onSelect={(d) => {
                        if (d) {
                          setGoalDate(d)
                          document.getElementById('goal-date')?.click()
                        }
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-1">
          {currentSubStep > 1 && (
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={loading}
              className="h-10 text-sm font-medium border-gray-300 hover:bg-gray-100 bg-white/60"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleSkip}
            disabled={loading || skipping}
            className="h-10 text-sm font-medium border-gray-300 hover:bg-gray-100 bg-white/60"
          >
            {skipping ? 'Pulando...' : 'Pular'}
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={loading || !canProceed()}
            className="flex-1 h-10 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : currentSubStep === 4 ? (
              'Finalizar'
            ) : (
              'Próximo'
            )}
          </Button>
        </div>
      </div>

      {/* Info do usuário no canto inferior esquerdo */}
      <div className="fixed bottom-4 left-4 text-sm text-gray-600 space-y-2 z-20">
        <p className="text-xs">Você está conectado como <span className="font-medium">{user?.email}</span></p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Entrar com outro usuário
        </Button>
      </div>

      {/* Ícone de ajuda no canto inferior direito */}
      <div className="fixed bottom-4 right-4 z-20">
        <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <HelpCircle className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
