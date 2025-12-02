import { FinanceTransaction } from '@/types/finance'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
// @ts-ignore - jspdf-autotable não tem tipos oficiais
import autoTable from 'jspdf-autotable'

// Exportar transações para PDF
export const exportToPDF = (
  transactions: FinanceTransaction[],
  filename: string,
  documentName: string = 'Relatório Financeiro'
) => {
  const doc = new jsPDF()
  
  // Calcular totais
  const income = transactions
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expenses = transactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = income - expenses

  // Título
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(documentName, 14, 20)
  
  // Data de geração
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28)
  
  // Resumo Financeiro
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo Financeiro', 14, 40)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 150, 0) // Verde
  doc.text(`Receitas: R$ ${income.toFixed(2)}`, 14, 48)
  
  doc.setTextColor(220, 38, 38) // Vermelho
  doc.text(`Despesas: R$ ${expenses.toFixed(2)}`, 14, 55)
  
  doc.setTextColor(0, 0, 0) // Preto
  doc.setFont('helvetica', 'bold')
  doc.text(`Saldo: R$ ${balance.toFixed(2)}`, 14, 62)
  
  // Tabela de Transações
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Transações', 14, 75)
  
  // Preparar dados da tabela
  const tableData = transactions.map((t) => [
    format(new Date(t.transaction_date), 'dd/MM/yyyy'),
    t.type === 'income' ? 'Receita' : 'Despesa',
    t.category,
    t.description,
    `R$ ${Number(t.amount).toFixed(2)}`,
    t.status === 'completed' ? 'Concluído' : 'Pendente',
  ])

  // @ts-ignore - jspdf-autotable não tem tipos perfeitos
  doc.autoTable({
    startY: 80,
    head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [99, 102, 241], // Cor primária
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 22 },
      2: { cellWidth: 30 },
      3: { cellWidth: 50 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25 },
    },
  })
  
  // Salvar PDF
  doc.save(`${filename}.pdf`)
}

// Exportar resumo financeiro para PDF
export const exportSummaryToPDF = (
  transactions: FinanceTransaction[],
  filename: string,
  documentName: string = 'Resumo Financeiro'
) => {
  const doc = new jsPDF()
  
  // Calcular totais
  const income = transactions
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expenses = transactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = income - expenses

  // Agrupar por categoria
  const byCategory: Record<string, { income: number; expense: number; total: number }> = {}
  transactions
    .filter((t) => t.status === 'completed')
    .forEach((t) => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = { income: 0, expense: 0, total: 0 }
      }
      if (t.type === 'income') {
        byCategory[t.category].income += Number(t.amount)
        byCategory[t.category].total += Number(t.amount)
      } else {
        byCategory[t.category].expense += Number(t.amount)
        byCategory[t.category].total -= Number(t.amount)
      }
    })

  // Título
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(documentName, 14, 20)
  
  // Data de geração
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28)
  
  // Resumo Geral
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo Geral', 14, 40)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 150, 0)
  doc.text(`Receitas Totais: R$ ${income.toFixed(2)}`, 14, 50)
  
  doc.setTextColor(220, 38, 38)
  doc.text(`Despesas Totais: R$ ${expenses.toFixed(2)}`, 14, 58)
  
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`Saldo Final: R$ ${balance.toFixed(2)}`, 14, 68)
  
  // Tabela por Categoria
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Detalhamento por Categoria', 14, 82)
  
  const categoryData = Object.entries(byCategory).map(([cat, vals]) => [
    cat,
    `R$ ${vals.income.toFixed(2)}`,
    `R$ ${vals.expense.toFixed(2)}`,
    `R$ ${vals.total.toFixed(2)}`,
  ])

  // @ts-ignore
  doc.autoTable({
    startY: 88,
    head: [['Categoria', 'Receitas', 'Despesas', 'Saldo']],
    body: categoryData,
    theme: 'striped',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
  })
  
  // Salvar PDF
  doc.save(`${filename}_resumo.pdf`)
}
