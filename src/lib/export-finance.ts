import { FinanceTransaction } from '@/types/finance'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Exportar transações para CSV
export const exportToCSV = (transactions: FinanceTransaction[], filename: string) => {
  // Cabeçalhos
  const headers = [
    'Data',
    'Tipo',
    'Categoria',
    'Descrição',
    'Valor',
    'Método de Pagamento',
    'Status',
    'Notas',
  ]

  // Converter transações para linhas CSV
  const rows = transactions.map((t) => [
    format(new Date(t.transaction_date), 'dd/MM/yyyy'),
    t.type === 'income' ? 'Receita' : 'Despesa',
    t.category,
    t.description,
    Number(t.amount).toFixed(2),
    getPaymentMethodLabel(t.payment_method || ''),
    t.status === 'completed' ? 'Concluído' : 'Pendente',
    t.notes || '',
  ])

  // Criar CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Helper para labels de método de pagamento
const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    money: 'Dinheiro',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
    bank_transfer: 'Transferência Bancária',
    other: 'Outro',
  }
  return labels[method] || method
}

// Exportar resumo financeiro
export const exportSummaryToCSV = (
  transactions: FinanceTransaction[],
  filename: string
) => {
  const income = transactions
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expenses = transactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = income - expenses

  // Agrupar por categoria
  const byCategory: Record<string, number> = {}
  transactions
    .filter((t) => t.status === 'completed')
    .forEach((t) => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = 0
      }
      byCategory[t.category] += Number(t.amount) * (t.type === 'expense' ? -1 : 1)
    })

  const csvContent = [
    'RESUMO FINANCEIRO',
    '',
    'Receitas,' + income.toFixed(2),
    'Despesas,' + expenses.toFixed(2),
    'Saldo,' + balance.toFixed(2),
    '',
    'POR CATEGORIA',
    'Categoria,Valor',
    ...Object.entries(byCategory).map(([cat, val]) => `"${cat}",${val.toFixed(2)}`),
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_resumo.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
