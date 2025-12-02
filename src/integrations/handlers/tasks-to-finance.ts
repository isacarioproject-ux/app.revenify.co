/**
 * INTEGRAÇÃO: Tasks → Finance
 * 
 * Quando completar task com custo, cria despesa automaticamente
 */

import { eventBus } from '@/lib/event-bus';
import { gerenciadorAdapter } from '../adapters/gerenciador-adapter';
import { isIntegrationEnabled, INTEGRATION_CONFIG } from '../config';
import type { TaskCompletedEvent } from '../types/integration-events';
import { toast } from 'sonner';

/**
 * Inicializar integração
 */
export function initTasksToFinance() {
  if (!isIntegrationEnabled('TASKS_TO_FINANCE')) {
    console.log('[Integration] Tasks → Finance: DISABLED');
    return;
  }

  console.log('[Integration] Tasks → Finance: ENABLED');

  // Listener: Quando completar task
  eventBus.on(
    'task.completed',
    async (data: TaskCompletedEvent) => {
      try {
        // Só criar despesa se task tem custo
        if (!data.cost || data.cost <= 0) {
          return;
        }

        if (INTEGRATION_CONFIG.DEBUG_MODE) {
          console.log('[Integration] Creating expense from completed task:', data);
        }

        // Criar despesa
        const expenseId = await gerenciadorAdapter.createExpense({
          category: 'Tarefa Concluída',
          amount: data.cost,
          description: data.title,
          linkedTask: data.taskId
        });

        if (INTEGRATION_CONFIG.SHOW_NOTIFICATIONS) {
          toast.info('💸 Despesa registrada!', {
            description: `${data.title} - R$ ${data.cost.toFixed(2)}`
          });
        }

        // Disparar evento
        eventBus.emit('finance.expense.created', {
          expenseId,
          category: 'Tarefa Concluída',
          amount: data.cost,
          linkedTask: data.taskId,
          source: 'task'
        });

      } catch (error) {
        console.error('[Integration] Error creating expense from task:', error);
      }
    }
  );
}
