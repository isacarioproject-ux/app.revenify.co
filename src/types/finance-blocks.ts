import { LucideIcon } from 'lucide-react'

/**
 * Tipo de bloco financeiro
 */
export type FinanceBlockType =
  | 'transaction-table'
  | 'budget-tracker'
  | 'category-summary'
  | 'charts'
  | 'quick-expense'
  | 'recurring-bills'
  | 'calendar'
  | 'receipts'
  | 'goals'
  | 'monthly-report'

/**
 * Categoria do bloco
 */
export type FinanceBlockCategory = 'data' | 'analysis' | 'planning' | 'tools'

/**
 * Configuração de um bloco financeiro
 */
export interface FinanceBlock {
  id: string
  type: FinanceBlockType
  visible: boolean
  order: number
  config?: Record<string, any>
}

/**
 * Definição de um tipo de bloco (metadata)
 */
export interface FinanceBlockDefinition {
  type: FinanceBlockType
  name: string
  description: string
  icon: LucideIcon
  category: FinanceBlockCategory
  color: string
  defaultVisible: boolean
  implemented: boolean
}

/**
 * Props base para todos os blocos
 */
export interface FinanceBlockProps {
  documentId: string
  onRefresh: () => void
  config?: Record<string, any>
}

/**
 * Registro de bloco no banco de dados
 */
export interface FinanceDocumentBlock {
  id: string
  finance_document_id: string
  block_type: FinanceBlockType
  visible: boolean
  block_order: number
  config: Record<string, any>
  created_at: string
  updated_at: string
}

export type FinanceDocumentBlockInsert = Omit<FinanceDocumentBlock, 'id' | 'created_at' | 'updated_at'>
export type FinanceDocumentBlockUpdate = Partial<FinanceDocumentBlockInsert>
