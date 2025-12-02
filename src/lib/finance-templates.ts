export interface FinanceTemplate {
  id: string
  name: string
  description: string
  template_type: 'budget' | 'expenses' | 'income' | 'report' | 'accounts'
  icon: string
  category: 'personal' | 'business' | 'investment'
  config: {
    default_categories?: string[]
    default_period?: 'monthly' | 'quarterly' | 'yearly'
    default_currency?: string
    show_charts?: boolean
    show_budget_tracking?: boolean
  }
}

export const FINANCE_TEMPLATES: FinanceTemplate[] = [
  {
    id: 'expense-tracker',
    name: 'Controle de Gastos',
    description: 'Registre todas as suas despesas do dia a dia',
    template_type: 'expenses',
    icon: '💳',
    category: 'personal',
    config: {
      default_period: 'monthly',
      default_currency: 'BRL',
      show_charts: true,
      default_categories: [
        'Alimentação',
        'Transporte',
        'Compras',
        'Contas',
        'Outros',
      ],
    },
  },
  {
    id: 'blank',
    name: 'Documento em Branco',
    description: 'Comece do zero e personalize como quiser',
    template_type: 'expenses',
    icon: '📄',
    category: 'personal',
    config: {
      default_currency: 'BRL',
      default_categories: [], // Sem categorias pré-definidas - usuário cria as suas
      default_period: 'monthly' as const,
      show_charts: true,
      show_budget_tracking: true,
    },
  },
]

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    personal: 'Pessoal',
    business: 'Negócios',
    investment: 'Investimentos',
  }
  return labels[category] || category
}

export const getTemplatesByCategory = (category?: string) => {
  if (!category) return FINANCE_TEMPLATES
  return FINANCE_TEMPLATES.filter((t) => t.category === category)
}
