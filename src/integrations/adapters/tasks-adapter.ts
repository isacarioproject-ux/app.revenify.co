/**
 * TASKS ADAPTER
 * 
 * Ponte entre eventos de integração e o módulo Tasks existente.
 * NÃO modifica o código do Tasks, apenas USA suas funções.
 */

import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import type { TaskCreatedEvent } from '../types/integration-events';

export class TasksAdapter {
  /**
   * Criar task usando a estrutura existente do Supabase
   * Usa a mesma tabela e formato que o módulo Tasks já usa
   */
  async createTask(data: Omit<TaskCreatedEvent, 'taskId'>): Promise<string> {
    const taskId = nanoid();

    // Usa a MESMA estrutura da tabela tasks que já existe
    const { error } = await supabase
      .from('tasks')
      .insert({
        id: taskId,
        title: data.title,
        status: 'pending',
        priority: 'medium',
        // Metadata para rastreamento
        metadata: {
          cost: data.cost,
          linkedTo: data.linkedTo,
          source: data.source,
          createdViaIntegration: true
        },
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[TasksAdapter] Error creating task:', error);
      throw error;
    }

    return taskId;
  }

  /**
   * Atualizar task existente
   */
  async updateTask(taskId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      console.error('[TasksAdapter] Error updating task:', error);
      throw error;
    }
  }

  /**
   * Marcar task como completa
   */
  async completeTask(taskId: string): Promise<void> {
    await this.updateTask(taskId, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });
  }

  /**
   * Deletar task
   */
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('[TasksAdapter] Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Buscar tasks linkadas a um whiteboard
   */
  async getLinkedTasks(whiteboardId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .contains('metadata', { linkedTo: whiteboardId });

    if (error) {
      console.error('[TasksAdapter] Error fetching linked tasks:', error);
      return [];
    }

    return data || [];
  }
}

// Singleton
export const tasksAdapter = new TasksAdapter();
