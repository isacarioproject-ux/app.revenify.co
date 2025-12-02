import {
  Receipt,
  Target,
  PieChart,
  BarChart3,
  Zap,
  Repeat,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react'
import { FinanceBlockDefinition } from '@/types/finance-blocks'

/**
 * Registro de todos os blocos disponíveis
 */
export const FINANCE_BLOCKS_REGISTRY: FinanceBlockDefinition[] = [
  // ===== BLOCOS DE DADOS =====
  {
    type: 'transaction-table',
    name: 'Tabela de Transações',
    description: 'Registre e visualize todas as suas transações',
    icon: Receipt,
    category: 'data',
    color: '#3b82f6',
    defaultVisible: true,
    implemented: true,
  },
  {
    type: 'quick-expense',
    name: 'Despesa Rápida',
    description: 'Adicione gastos em segundos',
    icon: Zap,
    category: 'data',
    color: '#f59e0b',
    defaultVisible: false,
    implemented: true, // ✅ Implementado
  },
  {
    type: 'recurring-bills',
    name: 'Contas Recorrentes',
    description: 'Gerencie contas fixas mensais',
    icon: Repeat,
    category: 'data',
    color: '#8b5cf6',
    defaultVisible: true,
    implemented: true, // ✅ Implementado
  },

  // ===== BLOCOS DE ANÁLISE =====
  {
    type: 'charts',
    name: 'Gráficos e Relatórios',
    description: 'Visualize seus dados em gráficos',
    icon: PieChart,
    category: 'analysis',
    color: '#10b981',
    defaultVisible: false,
    implemented: true,
  },
  {
    type: 'category-summary',
    name: 'Resumo por Categoria',
    description: 'Veja gastos agrupados por categoria',
    icon: BarChart3,
    category: 'analysis',
    color: '#06b6d4',
    defaultVisible: false,
    implemented: true, // ✅ Implementado
  },

  // ===== BLOCOS DE PLANEJAMENTO =====
  {
    type: 'budget-tracker',
    name: 'Gerenciar Orçamento',
    description: 'Defina e acompanhe metas de gastos',
    icon: Target,
    category: 'planning',
    color: '#ec4899',
    defaultVisible: false,
    implemented: true,
  },

  // ===== BLOCOS DE FERRAMENTAS =====
  {
    type: 'calendar',
    name: 'Calendário Financeiro',
    description: 'Visualize transações por dia',
    icon: Calendar,
    category: 'tools',
    color: '#f97316',
    defaultVisible: false,
    implemented: true, // ✅ Implementado
  },
  {
    type: 'receipts',
    name: 'Comprovantes',
    description: 'Anexe e gerencie comprovantes',
    icon: FileText,
    category: 'tools',
    color: '#6366f1',
    defaultVisible: false,
    implemented: true, // ✅ Implementado
  },
  {
    type: 'goals',
    name: 'Metas Financeiras',
    description: 'Defina e acompanhe metas de gastos',
    icon: Target,
    category: 'analysis',
    color: '#8b5cf6',
    defaultVisible: false,
    implemented: true, // ✅ Implementado
  },
  {
    type: 'monthly-report',
    name: 'Relatório Mensal',
    description: 'Resumo automático do mês',
    icon: TrendingUp,
    category: 'analysis',
    color: '#06b6d4',
    defaultVisible: false,
    implemented: true, // ✅ Implementado
  },
]

/**
 * Obter definição de um bloco por tipo
 */
export function getBlockDefinition(type: string) {
  return FINANCE_BLOCKS_REGISTRY.find((b) => b.type === type)
}

/**
 * Obter blocos por categoria
 */
export function getBlocksByCategory(category: string) {
  return FINANCE_BLOCKS_REGISTRY.filter((b) => b.category === category)
}

/**
 * Obter apenas blocos implementados
 */
export function getImplementedBlocks() {
  return FINANCE_BLOCKS_REGISTRY.filter((b) => b.implemented)
}
