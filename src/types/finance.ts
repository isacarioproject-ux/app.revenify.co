export interface FinanceDocument {
  id: string
  user_id: string
  workspace_id: string | null
  project_id: string | null // ✅ Vinculação com projetos
  name: string
  template_type: 'budget' | 'expenses' | 'income' | 'report' | 'accounts'
  icon: string | null
  cover_image: string | null
  description: string | null
  reference_month: number | null
  reference_year: number | null
  template_config: Record<string, any>
  total_income: number
  total_expenses: number
  balance: number
  created_at: string
  updated_at: string
}

export interface FinanceTransaction {
  id: string
  finance_document_id: string
  task_id: string | null // ✨ Vinculação com tarefas
  type: 'income' | 'expense' | 'transfer'
  category: string
  description: string
  amount: number
  transaction_date: string
  is_recurring: boolean
  recurrence_type: string | null
  recurrence_end_date: string | null
  payment_method: string | null
  account: string | null
  tags: string[]
  notes: string | null
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface FinanceCategory {
  id: string
  user_id: string
  workspace_id: string | null
  name: string
  description?: string | null
  type: 'income' | 'expense'
  color: string | null
  icon: string | null
  monthly_budget: number | null
  parent_category_id: string | null
  created_at: string
}

export interface FinanceBudget {
  id: string
  finance_document_id: string
  category_id: string | null
  category_name: string
  planned_amount: number
  spent_amount: number
  month: number
  year: number
  created_at: string
  updated_at: string
}

export type FinanceDocumentInsert = Omit<FinanceDocument, 'id' | 'created_at' | 'updated_at' | 'total_income' | 'total_expenses' | 'balance'>
export type FinanceDocumentUpdate = Partial<FinanceDocumentInsert>

export type FinanceTransactionInsert = Omit<FinanceTransaction, 'id' | 'created_at' | 'updated_at'>
export type FinanceTransactionUpdate = Partial<FinanceTransactionInsert>

export type FinanceCategoryInsert = Omit<FinanceCategory, 'id' | 'created_at'>
export type FinanceCategoryUpdate = Partial<FinanceCategoryInsert>

export type FinanceBudgetInsert = Omit<FinanceBudget, 'id' | 'created_at' | 'updated_at'>
export type FinanceBudgetUpdate = Partial<FinanceBudgetInsert>

// Templates de documentos financeiros
export const FINANCE_TEMPLATES = {
  budget: {
    name: 'Orçamento Mensal',
    icon: '📊',
    description: 'Planeje seus gastos mensais por categoria',
    color: '#3b82f6',
  },
  expenses: {
    name: 'Controle de Gastos',
    icon: '💰',
    description: 'Registre e acompanhe todas as suas despesas',
    color: '#ef4444',
  },
  income: {
    name: 'Registro de Ganhos',
    icon: '💵',
    description: 'Acompanhe todas as suas fontes de renda',
    color: '#10b981',
  },
  report: {
    name: 'Relatório Anual',
    icon: '📈',
    description: 'Análise completa das suas finanças do ano',
    color: '#8b5cf6',
  },
  accounts: {
    name: 'Contas Bancárias',
    icon: '🏦',
    description: 'Gerencie seus saldos e movimentações bancárias',
    color: '#06b6d4',
  },
} as const

// Categorias padrão
export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salário', icon: '💰', color: '#10b981' },
  { name: 'Freelance', icon: '💼', color: '#3b82f6' },
  { name: 'Investimentos', icon: '📈', color: '#8b5cf6' },
  { name: 'Vendas', icon: '🛍️', color: '#f59e0b' },
  { name: 'Outros Ganhos', icon: '💵', color: '#6b7280' },
]

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Alimentação', icon: '🍔', color: '#ef4444' },
  { name: 'Transporte', icon: '🚗', color: '#f97316' },
  { name: 'Moradia', icon: '🏠', color: '#06b6d4' },
  { name: 'Saúde', icon: '🏥', color: '#ec4899' },
  { name: 'Educação', icon: '📚', color: '#8b5cf6' },
  { name: 'Lazer', icon: '🎮', color: '#14b8a6' },
  { name: 'Roupas', icon: '👕', color: '#a855f7' },
  { name: 'Tecnologia', icon: '💻', color: '#3b82f6' },
  { name: 'Assinaturas', icon: '📱', color: '#f59e0b' },
  { name: 'Outros Gastos', icon: '💳', color: '#6b7280' },
]

// Métodos de pagamento
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro', icon: '💵' },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: '💳' },
  { value: 'debit_card', label: 'Cartão de Débito', icon: '💳' },
  { value: 'pix', label: 'PIX', icon: '📱' },
  { value: 'bank_transfer', label: 'Transferência Bancária', icon: '🏦' },
] as const
