import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { OnboardingStepProps } from '@/types/onboarding'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { CalendarIcon, Loader2, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

export function FinancialStep({ onNext }: OnboardingStepProps) {
  const { user } = useAuth()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleCreate = async () => {
    if (!description.trim()) {
      toast.error('Digite uma descrição')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Digite um valor válido')
      return
    }

    if (!user) return

    setLoading(true)

    try {
      // Buscar documento financeiro do workspace
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.workspace_id) {
        console.error('❌ Workspace não encontrado')
        toast.error('Complete os passos anteriores primeiro')
        return
      }

      // Buscar ou criar documento financeiro
      let { data: document } = await supabase
        .from('finance_documents')
        .select('id')
        .eq('workspace_id', membership.workspace_id)
        .limit(1)
        .maybeSingle()

      if (!document) {
        // Criar documento financeiro
        const { data: newDoc, error: docError } = await supabase
          .from('finance_documents')
          .insert({
            name: 'Meu Primeiro Orçamento',
            workspace_id: membership.workspace_id,
            user_id: user.id,
            template_type: 'custom'
          })
          .select()
          .single()

        if (docError) throw docError
        document = newDoc
      }

      // Validar se documento existe antes de criar transação
      if (!document || !document.id) {
        console.error('❌ Documento financeiro não encontrado')
        toast.error('Erro ao buscar documento financeiro')
        return
      }

      // Criar transação
      const transactionData = {
        finance_document_id: document.id,
        description: description.trim(),
        amount: parseFloat(amount),
        type: type,
        category: category || (type === 'income' ? 'Outros' : 'Geral'),
        transaction_date: date.toISOString(),
        payment_method: 'Dinheiro',
        status: 'confirmed'
      }

      console.log('📝 Criando transação com dados:', transactionData)

      const { error } = await supabase
        .from('finance_transactions')
        .insert(transactionData)

      if (error) {
        console.error('❌ Erro ao criar transação:', error.message, error)
        throw error
      }

      console.log('✅ Transação criada com sucesso com todos os dados!')
      toast.success('💰 Primeira transação criada!')
      
      onNext({ 
        createdFirstTransaction: true
      })
    } catch (error: any) {
      console.error('❌ Erro ao criar transação:', error)
      toast.error(`Erro ao criar transação: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    setSkipping(true)
    onNext({ createdFirstTransaction: false })
  }

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

        {/* Header - SEM ÍCONE */}
        <div className="text-center space-y-0.5">
          <h2 className="text-base font-semibold text-gray-900">💰 Registre sua primeira transação!</h2>
          <p className="text-xs text-gray-600">Comece a controlar suas finanças</p>
        </div>

        {/* Formulário - SEM CARD */}
        <div className="space-y-3">
        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={type === 'income' ? 'primary' : 'outline'}
            className={cn(
              'justify-start',
              type === 'income' && 'bg-green-500 hover:bg-green-600'
            )}
            onClick={() => setType('income')}
            disabled={loading}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Receita
          </Button>
          <Button
            type="button"
            variant={type === 'expense' ? 'primary' : 'outline'}
            className={cn(
              'justify-start',
              type === 'expense' && 'bg-red-500 hover:bg-red-600'
            )}
            onClick={() => setType('expense')}
            disabled={loading}
          >
            <TrendingDown className="mr-2 h-4 w-4" />
            Despesa
          </Button>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            placeholder={type === 'income' ? 'Ex: Salário, Freelance...' : 'Ex: Conta de luz, Mercado...'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        {/* Valor e Categoria */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              placeholder="Ex: Alimentação"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Data */}
        <div className="space-y-2">
          <Label htmlFor="transaction-date">Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="transaction-date"
                variant="outline"
                className="w-full justify-start text-left font-normal text-sm bg-white hover:bg-gray-50 border-gray-300"
                disabled={loading}
                type="button"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setDate(d)
                    // Fechar popover após selecionar
                    document.getElementById('transaction-date')?.click()
                  }
                }}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Dica */}
        <div className="bg-accent/50 p-3 rounded-lg text-sm space-y-1">
          <p className="font-medium">💡 Dica:</p>
          <p className="text-muted-foreground text-xs">
            {type === 'income' 
              ? 'Registre todas as suas fontes de renda para ter controle total das suas finanças!'
              : 'Anote todas as despesas, mesmo as pequenas. É assim que você controla seu orçamento!'}
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-1">
          <Button 
            variant="outline" 
            onClick={handleSkip}
            disabled={loading || skipping}
            className="h-10 text-sm font-medium border-gray-300 hover:bg-gray-100 bg-white/60"
          >
            {skipping ? 'Pulando...' : 'Fazer depois'}
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!description.trim() || !amount || loading}
            className="flex-1 h-10 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar transação'
            )}
          </Button>
        </div>
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
