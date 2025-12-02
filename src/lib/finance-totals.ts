import { supabase } from '@/lib/supabase'

/**
 * Recalcular e atualizar os totais de um documento financeiro
 */
export async function updateDocumentTotals(docId: string): Promise<{
  total_income: number
  total_expenses: number
  balance: number
} | null> {
  try {
    // Buscar todas as transações do documento
    const { data: transactions, error } = await supabase
      .from('finance_transactions')
      .select('type, amount, status')
      .eq('finance_document_id', docId)
    
    if (error) throw error
    
    // Calcular totais
    let totalIncome = 0
    let totalExpenses = 0
    
    transactions?.forEach(tx => {
      const amount = Number(tx.amount) || 0
      if (tx.type === 'income') {
        totalIncome += amount
      } else {
        totalExpenses += amount
      }
    })
    
    const balance = totalIncome - totalExpenses
    
    // Atualizar documento
    const { error: updateError } = await supabase
      .from('finance_documents')
      .update({
        total_income: totalIncome,
        total_expenses: totalExpenses,
        balance: balance,
        updated_at: new Date().toISOString()
      })
      .eq('id', docId)
    
    if (updateError) throw updateError
    
    // Disparar evento para atualizar UI
    window.dispatchEvent(new CustomEvent('finance-totals-updated', { 
      detail: { docId, totalIncome, totalExpenses, balance } 
    }))
    
    return { total_income: totalIncome, total_expenses: totalExpenses, balance }
  } catch (err) {
    console.error('Erro ao atualizar totais:', err)
    return null
  }
}

/**
 * Recalcular totais de todos os documentos do usuário
 */
export async function recalculateAllDocumentTotals(userId: string): Promise<void> {
  try {
    // Buscar todos os documentos do usuário
    const { data: documents, error } = await supabase
      .from('finance_documents')
      .select('id')
      .eq('user_id', userId)
    
    if (error) throw error
    
    // Recalcular cada um
    for (const doc of documents || []) {
      await updateDocumentTotals(doc.id)
    }
    
    console.log(`✅ Totais recalculados para ${documents?.length || 0} documentos`)
  } catch (err) {
    console.error('Erro ao recalcular totais:', err)
  }
}

/**
 * Verificar se os totais estão corretos e corrigir se necessário
 */
export async function verifyAndFixDocumentTotals(docId: string): Promise<boolean> {
  try {
    // Buscar documento atual
    const { data: doc, error: docError } = await supabase
      .from('finance_documents')
      .select('total_income, total_expenses, balance')
      .eq('id', docId)
      .single()
    
    if (docError) throw docError
    
    // Buscar transações e calcular
    const { data: transactions, error: txError } = await supabase
      .from('finance_transactions')
      .select('type, amount')
      .eq('finance_document_id', docId)
    
    if (txError) throw txError
    
    let calculatedIncome = 0
    let calculatedExpenses = 0
    
    transactions?.forEach(tx => {
      const amount = Number(tx.amount) || 0
      if (tx.type === 'income') {
        calculatedIncome += amount
      } else {
        calculatedExpenses += amount
      }
    })
    
    const calculatedBalance = calculatedIncome - calculatedExpenses
    
    // Verificar se está diferente
    const needsUpdate = 
      Math.abs((doc?.total_income || 0) - calculatedIncome) > 0.01 ||
      Math.abs((doc?.total_expenses || 0) - calculatedExpenses) > 0.01 ||
      Math.abs((doc?.balance || 0) - calculatedBalance) > 0.01
    
    if (needsUpdate) {
      console.log(`⚠️ Documento ${docId} com totais incorretos, corrigindo...`)
      await updateDocumentTotals(docId)
      return true
    }
    
    return false
  } catch (err) {
    console.error('Erro ao verificar totais:', err)
    return false
  }
}
