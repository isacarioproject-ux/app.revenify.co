import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Trash2,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { FinanceBudget, FinanceCategory } from '@/types/finance'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useWorkspace } from '@/contexts/workspace-context'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface BudgetManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
}

// Helper para formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const BudgetManager = ({
  open,
  onOpenChange,
  documentId,
}: BudgetManagerProps) => {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const [budgets, setBudgets] = useState<FinanceBudget[]>([])
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [newBudget, setNewBudget] = useState({
    categoryId: '',
    amount: '',
  })

  useEffect(() => {
    if (open) {
      fetchBudgets()
      fetchCategories()
    }
  }, [open, documentId])

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('finance_categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense') // Orçamento só para despesas
        .order('name')

      if (currentWorkspace) {
        query = query.eq('workspace_id', currentWorkspace.id)
      } else {
        query = query.is('workspace_id', null)
      }

      const { data, error } = await query
      if (error) throw error

      setCategories(data || [])
    } catch (err: any) {
      toast.error(t('finance.categories.errorLoad'), {
        description: err.message,
      })
    }
  }

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('finance_budgets')
        .select(`
          *,
          category:finance_categories(id, name, icon)
        `)
        .eq('finance_document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setBudgets(data || [])
    } catch (err: any) {
      toast.error(t('finance.budget.errorLoad'), {
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddBudget = async () => {
    if (!newBudget.categoryId || !newBudget.amount) return

    try {
      const category = categories.find((c) => c.id === newBudget.categoryId)
      if (!category) return

      const { error } = await supabase.from('finance_budgets').insert({
        finance_document_id: documentId,
        category_id: newBudget.categoryId,
        category_name: category.name,
        planned_amount: parseFloat(newBudget.amount),
        spent_amount: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      })

      if (error) throw error

      setNewBudget({ categoryId: '', amount: '' })
      fetchBudgets()
      toast.success(t('finance.budget.created'))
    } catch (err: any) {
      toast.error(t('finance.budget.errorCreate'), {
        description: err.message,
      })
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm(t('finance.budget.confirmDelete'))) return

    try {
      const { error } = await supabase
        .from('finance_budgets')
        .delete()
        .eq('id', id)

      if (error) throw error

      fetchBudgets()
      toast.success(t('finance.budget.deleted'))
    } catch (err: any) {
      toast.error(t('finance.budget.errorDelete'), {
        description: err.message,
      })
    }
  }

  // Calcular status do orçamento
  const getBudgetStatus = (spent: number, amount: number) => {
    const percentage = (spent / amount) * 100
    if (percentage >= 100) return { color: 'text-red-600', icon: AlertTriangle, label: t('finance.budget.exceeded') }
    if (percentage >= 80) return { color: 'text-yellow-600', icon: AlertCircle, label: t('finance.budget.attention') }
    return { color: 'text-green-600', icon: CheckCircle2, label: t('finance.budget.ok') }
  }

  // Categorias disponíveis (que ainda não têm orçamento)
  const availableCategories = categories.filter(
    (cat) => !budgets.some((b) => b.category_id === cat.id)
  )

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent 
        className="max-w-3xl max-h-[85vh] p-0"
        drawerProps={{
          className: "h-[96vh]"
        }}
      >
        <ModalHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b">
          <ModalTitle className="text-base font-semibold">{t('finance.budget.budgets')}</ModalTitle>
        </ModalHeader>

        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(96vh-80px)]">
          {/* Form novo orçamento */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={newBudget.categoryId}
                onValueChange={(value) =>
                  setNewBudget({ ...newBudget, categoryId: value })
                }
              >
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue placeholder={t('finance.budget.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        {cat.icon && <span className="text-sm">{cat.icon}</span>}
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder={t('finance.budget.budgetValue')}
                value={newBudget.amount}
                onChange={(e) =>
                  setNewBudget({ ...newBudget, amount: e.target.value })
                }
                className="w-full sm:w-48 h-9"
                min="0"
                step="0.01"
              />

              <Button 
                onClick={handleAddBudget} 
                size="sm"
                disabled={!newBudget.categoryId || !newBudget.amount}
                className="h-9"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline ml-1.5">{t('finance.table.add')}</span>
              </Button>
            </div>
          </div>

          {/* Lista de orçamentos */}
          <div className="space-y-3">
            {budgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{t('finance.budget.noBudgets')}</p>
                <p className="text-xs mt-1">{t('finance.budget.addBudgetsDesc')}</p>
              </div>
            ) : (
              budgets.map((budget) => {
                const percentage = Math.min((budget.spent_amount / budget.planned_amount) * 100, 100)
                const status = getBudgetStatus(budget.spent_amount, budget.planned_amount)
                const StatusIcon = status.icon
                const remaining = budget.planned_amount - budget.spent_amount

                return (
                  <div
                    key={budget.id}
                    className="p-3 sm:p-4 border rounded-lg bg-card space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium truncate">
                            {budget.category_name || t('finance.budget.category')}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StatusIcon className={cn('h-3 w-3', status.color)} />
                            <span className={cn('text-xs', status.color)}>
                              {status.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => handleDeleteBudget(budget.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <Progress value={percentage} className="h-2" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {t('finance.budget.spent')} <span className="font-mono font-medium text-foreground">
                            {formatCurrency(budget.spent_amount)}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          {t('finance.budget.budget')} <span className="font-mono font-medium text-foreground">
                            {formatCurrency(budget.planned_amount)}
                          </span>
                        </span>
                      </div>
                      <div className="text-xs text-center">
                        <span className={cn(
                          'font-mono font-semibold',
                          remaining >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {remaining >= 0 ? t('finance.budget.remains') : t('finance.budget.exceededIn')} {formatCurrency(Math.abs(remaining))}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
