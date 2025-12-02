import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/hooks/use-i18n'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { 
  Maximize2,
  Target,
  GripVertical,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
} from 'lucide-react'
import { useWorkspace } from '@/contexts/workspace-context'
import { toast } from 'sonner'
import { BudgetManagerNotion } from '@/components/budget-manager'
import { supabase } from '@/lib/supabase'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart'

interface BudgetCardProps {
  workspaceId?: string
  dragHandleProps?: any
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const COLORS = [
  '#10b981', // Entradas - verde
  '#ef4444', // Gastos - vermelho  
  '#f59e0b', // Reservas - amarelo
  '#8b5cf6', // Metas - roxo
  '#3b82f6', // Orçamento - azul
]

export function BudgetCard({ workspaceId, dragHandleProps }: BudgetCardProps) {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const cardName = t('sidebar.budget')
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [budgetData, setBudgetData] = useState({
    incomes: 0,
    expenses: 0,
    reserves: 0,
    goals: 0,
    budgets: 0,
  })

  // Carregar dados agregados
  useEffect(() => {
    const loadBudgetData = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        console.log('🔍 [BudgetCard] Carregando dados...', {
          userId: user?.id,
          workspaceId: currentWorkspace?.id
        })
        
        if (!user) {
          console.warn('⚠️ [BudgetCard] Usuário não encontrado')
          setLoading(false)
          return
        }

        // Buscar TODOS os documentos do usuário (sem filtro de workspace)
        const { data: documents, error } = await supabase
          .from('finance_documents')
          .select('id, total_income, total_expenses, template_config, workspace_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        console.log('✅ [BudgetCard] Documentos encontrados:', documents?.length || 0)
        console.log('📊 [BudgetCard] Workspace atual:', currentWorkspace?.id)
        
        if (documents && documents.length > 0) {
          console.log('📄 [BudgetCard] Documentos:', documents.map(d => ({
            id: d.id,
            workspace_id: d.workspace_id,
            has_config: !!d.template_config
          })))
        }

        if (error) throw error

        if (documents && documents.length > 0) {
          // Usar o primeiro documento ou agregar todos
          const firstDoc = documents[0]
          setSelectedDocId(firstDoc.id)

          // Agregar valores do template_config de todos os documentos
          let totalIncome = 0
          let totalExpenses = 0
          let totalReserves = 0
          let totalGoals = 0
          
          documents.forEach(doc => {
            const config = doc.template_config || {}
            const incomes = config.incomes || []
            const reserves = config.reserves || []
            const metas = config.metas || []
            
            totalIncome += incomes.reduce((sum: number, i: any) => sum + (i.value || 0), 0)
            totalReserves += reserves.reduce((sum: number, r: any) => sum + (r.value || 0), 0)
            totalGoals += metas.reduce((sum: number, m: any) => sum + (m.value || 0), 0)
          })
          
          // Buscar gastos (expenses) das transações
          const { data: transactions } = await supabase
            .from('finance_transactions')
            .select('amount')
            .eq('type', 'expense')
            .in('finance_document_id', documents.map(d => d.id))
          
          totalExpenses = transactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0

          // Buscar budgets
          const { data: budgets } = await supabase
            .from('finance_budgets')
            .select('planned_amount')
            .in('finance_document_id', documents.map(d => d.id))
          
          const totalBudgets = budgets?.reduce((sum, b) => sum + (Number(b.planned_amount) || 0), 0) || 0

          setBudgetData({
            incomes: totalIncome,
            expenses: totalExpenses,
            reserves: totalReserves,
            goals: totalGoals,
            budgets: totalBudgets,
          })
        }
      } catch (err) {
        console.error('Error loading budget data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBudgetData()
  }, [currentWorkspace?.id])

  // Escutar evento de atualização de transações
  useEffect(() => {
    const handleTransactionUpdate = () => {
      console.log('🔔 [BudgetCard] Transação atualizada, recarregando...')
      const loadBudgetData = async () => {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            setLoading(false)
            return
          }

          // Buscar TODOS os documentos do usuário (sem filtro de workspace)
          const { data: documents, error } = await supabase
            .from('finance_documents')
            .select('id, total_income, total_expenses, template_config')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          
          if (error) throw error

          if (documents && documents.length > 0) {
            const firstDoc = documents[0]
            setSelectedDocId(firstDoc.id)

            let totalIncome = 0
            let totalExpenses = 0
            let totalReserves = 0
            let totalGoals = 0
            
            documents.forEach(doc => {
              const config = doc.template_config || {}
              const incomes = config.incomes || []
              const reserves = config.reserves || []
              const metas = config.metas || []
              
              totalIncome += incomes.reduce((sum: number, i: any) => sum + (i.value || 0), 0)
              totalReserves += reserves.reduce((sum: number, r: any) => sum + (r.value || 0), 0)
              totalGoals += metas.reduce((sum: number, m: any) => sum + (m.value || 0), 0)
            })
            
            const { data: transactions } = await supabase
              .from('finance_transactions')
              .select('amount')
              .eq('type', 'expense')
              .in('finance_document_id', documents.map(d => d.id))
            
            totalExpenses = transactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0

            const { data: budgets } = await supabase
              .from('finance_budgets')
              .select('planned_amount')
              .in('finance_document_id', documents.map(d => d.id))
            
            const totalBudgets = budgets?.reduce((sum, b) => sum + (Number(b.planned_amount) || 0), 0) || 0

            setBudgetData({
              incomes: totalIncome,
              expenses: totalExpenses,
              reserves: totalReserves,
              goals: totalGoals,
              budgets: totalBudgets,
            })
          }
        } catch (err) {
          console.error('Error loading budget data:', err)
        } finally {
          setLoading(false)
        }
      }
      loadBudgetData()
    }

    window.addEventListener('finance-transaction-updated', handleTransactionUpdate)
    return () => window.removeEventListener('finance-transaction-updated', handleTransactionUpdate)
  }, [currentWorkspace?.id])

  const chartData = useMemo(() => {
    return [
      { name: t('budget.incomes'), value: budgetData.incomes, color: COLORS[0] },
      { name: t('budget.expenses'), value: budgetData.expenses, color: COLORS[1] },
      { name: t('budget.reserves'), value: budgetData.reserves, color: COLORS[2] },
      { name: t('budget.goals'), value: budgetData.goals, color: COLORS[3] },
      { name: t('budget.budgets'), value: budgetData.budgets, color: COLORS[4] },
    ].filter(item => item.value > 0)
  }, [budgetData])


  return (
    <>
        <Card className="border border-border bg-card rounded-lg overflow-hidden h-full flex flex-col group">
          {/* MENUBAR SUPERIOR */}
          <CardHeader className="p-0">
            <div className="flex items-center justify-between gap-2 px-0.5 py-0.5">
              {/* Drag Handle + Input */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {/* Drag Handle - sempre visível no mobile, hover no desktop */}
                <div 
                  {...dragHandleProps}
                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/70 rounded transition-colors flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 relative z-10 touch-none"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </div>
                
                {/* Nome Fixo */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {cardName}
                  </h3>
                  {/* Badge do Workspace */}
                  {currentWorkspace && (
                    <Badge variant="secondary" className="text-xs h-5 hidden sm:inline-flex truncate max-w-[120px]">
                      {currentWorkspace.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Botões de Ação - Sempre visíveis */}
              <TooltipProvider>
                <div className="flex items-center gap-1">
                  {/* Botão Expandir */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setIsExpanded(true)}
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('budget.expand')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </CardHeader>

          {/* CONTEÚDO DO CARD */}
          <CardContent className="p-4 flex-1 flex items-center justify-center overflow-hidden">
            {loading ? (
              <div className="space-y-4 w-full">
                <div className="flex justify-center">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-3 flex-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center text-muted-foreground"
              >
                <Target className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">{t('budget.noData')}</p>
                <p className="text-xs mt-1">{t('budget.noDataDesc')}</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeOut",
                  opacity: { duration: 0.4 },
                  scale: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
                  rotate: { duration: 0.6, ease: "easeOut" }
                }}
                className="w-full h-full flex items-center justify-center"
              >
                {/* Gráfico de Pizza - Sem Separadores com Tooltips Avançados */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    delay: 0.3, 
                    duration: 0.8,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <ChartContainer
                    config={{
                      value: { label: 'Valor' },
                      entradas: { label: 'Entradas', color: COLORS[0] },
                      gastos: { label: 'Gastos', color: COLORS[1] },
                      reservas: { label: 'Reservas', color: COLORS[2] },
                      metas: { label: 'Metas', color: COLORS[3] },
                      orçamento: { label: 'Orçamento', color: COLORS[4] },
                    }}
                    className="aspect-square max-h-[220px] w-full max-w-[220px]"
                  >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0]
                          if (!data || !data.value) return null
                          
                          const total = chartData.reduce((sum, item) => sum + item.value, 0)
                          const percentage = ((Number(data.value) / total) * 100).toFixed(1)
                          
                          // Ícones por categoria
                          const getIcon = (name: string) => {
                            switch(name) {
                              case 'Entradas': return <TrendingUp className="h-3.5 w-3.5" />
                              case 'Gastos': return <TrendingDown className="h-3.5 w-3.5" />
                              case 'Reservas': return <PiggyBank className="h-3.5 w-3.5" />
                              case 'Metas': return <Target className="h-3.5 w-3.5" />
                              case 'Orçamento': return <Wallet className="h-3.5 w-3.5" />
                              default: return null
                            }
                          }
                          
                          return (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.15 }}
                              className="rounded-lg border border-border/60 bg-background/95 backdrop-blur-sm p-2.5 shadow-lg"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div
                                  className="flex items-center justify-center h-6 w-6 rounded-md"
                                  style={{ backgroundColor: data.payload.fill }}
                                >
                                  <span className="text-white">
                                    {getIcon(String(data.name || ''))}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold">{String(data.name || '')}</span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-baseline justify-between gap-3">
                                  <span className="text-[10px] text-muted-foreground">{t('budget.value')}</span>
                                  <span className="text-sm font-mono font-bold tabular-nums">
                                    {formatCurrency(Number(data.value))}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-baseline justify-between gap-3">
                                    <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                                    <span className="text-[10px] text-muted-foreground">de {formatCurrency(total)}</span>
                                  </div>
                                  {/* Barra de progresso compacta */}
                                  <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 0.4, ease: "easeOut" }}
                                      className="h-full rounded-full"
                                      style={{ backgroundColor: data.payload.fill }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )
                        }
                        return null
                      }}
                    />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      stroke="0"
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                </motion.div>
              </motion.div>
            )}
          </CardContent>
        </Card>

      {/* Dialog do Budget Manager */}
      <BudgetManagerNotion
        open={isExpanded}
        onOpenChange={setIsExpanded}
        documentId={selectedDocId || ''}
      />
    </>
  )
}
