/**
 * GERENCIADOR ADAPTER
 * 
 * Ponte para o Budget Manager Notion (Meu Gerenciador)
 * NÃO modifica código existente, apenas USA tabelas existentes
 */

import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export class GerenciadorAdapter {
  /**
   * Criar meta financeira
   */
  async createGoal(data: {
    name: string;
    targetAmount: number;
    category?: string;
    linkedWhiteboard?: string;
    financeDocumentId?: string;
  }): Promise<string> {
    const goalId = nanoid();

    const { error } = await supabase
      .from('finance_goals')
      .insert({
        id: goalId,
        name: data.name,
        target_amount: data.targetAmount,
        current_amount: 0,
        category: data.category || 'Geral',
        finance_document_id: data.financeDocumentId,
        metadata: {
          linkedWhiteboard: data.linkedWhiteboard,
          createdViaIntegration: true
        },
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[GerenciadorAdapter] Error creating goal:', error);
      throw error;
    }

    return goalId;
  }

  /**
   * Criar despesa
   */
  async createExpense(data: {
    category: string;
    amount: number;
    description?: string;
    linkedTask?: string;
    linkedWhiteboard?: string;
    financeDocumentId?: string;
  }): Promise<string> {
    const expenseId = nanoid();

    const { error } = await supabase
      .from('finance_transactions')
      .insert({
        id: expenseId,
        type: 'expense',
        category: data.category,
        amount: data.amount,
        description: data.description || '',
        status: 'completed',
        finance_document_id: data.financeDocumentId,
        metadata: {
          linkedTask: data.linkedTask,
          linkedWhiteboard: data.linkedWhiteboard,
          createdViaIntegration: true
        },
        transaction_date: new Date().toISOString()
      });

    if (error) {
      console.error('[GerenciadorAdapter] Error creating expense:', error);
      throw error;
    }

    return expenseId;
  }

  /**
   * Criar entrada/receita
   */
  async createIncome(data: {
    name: string;
    amount: number;
    source?: string;
    financeDocumentId?: string;
  }): Promise<string> {
    const incomeId = nanoid();

    const { error } = await supabase
      .from('finance_transactions')
      .insert({
        id: incomeId,
        type: 'income',
        category: 'Receita',
        amount: data.amount,
        description: data.name,
        status: 'completed',
        finance_document_id: data.financeDocumentId,
        metadata: {
          source: data.source,
          createdViaIntegration: true
        },
        transaction_date: new Date().toISOString()
      });

    if (error) {
      console.error('[GerenciadorAdapter] Error creating income:', error);
      throw error;
    }

    return incomeId;
  }

  /**
   * Atualizar progresso de meta
   */
  async updateGoalProgress(goalId: string, amount: number): Promise<void> {
    const { error } = await supabase
      .from('finance_goals')
      .update({ current_amount: amount })
      .eq('id', goalId);

    if (error) {
      console.error('[GerenciadorAdapter] Error updating goal progress:', error);
      throw error;
    }
  }

  /**
   * Buscar metas linkadas a um whiteboard
   */
  async getLinkedGoals(whiteboardId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('finance_goals')
      .select('*')
      .contains('metadata', { linkedWhiteboard: whiteboardId });

    if (error) {
      console.error('[GerenciadorAdapter] Error fetching linked goals:', error);
      return [];
    }

    return data || [];
  }
}

// Singleton
export const gerenciadorAdapter = new GerenciadorAdapter();
