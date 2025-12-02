import { useEffect, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { realtimeManager } from '@/lib/realtime-manager';
import { toast } from 'sonner';

/**
 * 📡 Hook para ouvir mudanças em tempo real nas tabelas de finanças
 * 
 * Tabelas monitoradas:
 * - finance_transactions
 * - finance_budgets
 * - finance_categories
 * - finance_goals
 * 
 * @param workspaceId - ID do workspace para filtrar eventos
 * @param options - Configurações opcionais
 */

interface UseRealtimeFinanceOptions {
  /** Habilitar/desabilitar o realtime */
  enabled?: boolean;
  /** Mostrar notificações toast */
  showNotifications?: boolean;
  /** Callback chamado quando houver uma atualização */
  onUpdate?: () => void;
  /** Callback chamado quando uma transação for criada */
  onTransactionCreated?: (transaction: any) => void;
  /** Callback chamado quando um orçamento for atualizado */
  onBudgetUpdated?: (budget: any) => void;
}

type RealtimePayload = RealtimePostgresChangesPayload<any>;

export function useRealtimeFinance(
  workspaceId: string | null,
  options: UseRealtimeFinanceOptions = {}
) {
  const {
    enabled = true,
    showNotifications = true,
    onUpdate,
    onTransactionCreated,
    onBudgetUpdated,
  } = options;

  /**
   * 🆕 Handler para INSERT
   */
  const handleInsert = useCallback((payload: RealtimePayload) => {
    console.log('💰 [useRealtimeFinance] Nova inserção:', {
      table: payload.table,
      new: payload.new,
    });

    // Atualizar UI
    onUpdate?.();

    // Callbacks específicos
    if (payload.table === 'finance_transactions' && onTransactionCreated) {
      onTransactionCreated(payload.new);
    }

    // Notificação
    if (showNotifications) {
      const messages: Record<string, string> = {
        finance_transactions: '💰 Nova transação adicionada',
        finance_budgets: '📊 Novo orçamento criado',
        finance_categories: '🏷️ Nova categoria criada',
        finance_goals: '🎯 Nova meta financeira',
      };
      
      toast.success(messages[payload.table] || 'Atualização financeira', {
        duration: 2000,
      });
    }
  }, [onUpdate, onTransactionCreated, showNotifications]);

  /**
   * 🔄 Handler para UPDATE
   */
  const handleUpdate = useCallback((payload: RealtimePayload) => {
    console.log('🔄 [useRealtimeFinance] Atualização:', {
      table: payload.table,
      old: payload.old,
      new: payload.new,
    });

    // Atualizar UI
    onUpdate?.();

    // Callbacks específicos
    if (payload.table === 'finance_budgets' && onBudgetUpdated) {
      onBudgetUpdated(payload.new);
    }

    // Notificação discreta (apenas para orçamentos)
    if (showNotifications && payload.table === 'finance_budgets') {
      toast.info('📊 Orçamento atualizado', {
        duration: 2000,
      });
    }
  }, [onUpdate, onBudgetUpdated, showNotifications]);

  /**
   * 🗑️ Handler para DELETE
   */
  const handleDelete = useCallback((payload: RealtimePayload) => {
    console.log('🗑️ [useRealtimeFinance] Exclusão:', {
      table: payload.table,
      old: payload.old,
    });

    // Atualizar UI
    onUpdate?.();

    // Notificação
    if (showNotifications) {
      const messages: Record<string, string> = {
        finance_transactions: '💰 Transação removida',
        finance_budgets: '📊 Orçamento removido',
        finance_categories: '🏷️ Categoria removida',
        finance_goals: '🎯 Meta removida',
      };
      
      toast.info(messages[payload.table] || 'Item removido', {
        duration: 2000,
      });
    }
  }, [onUpdate, showNotifications]);

  /**
   * 🎯 Handler principal de eventos Realtime
   */
  const handleRealtimeEvent = useCallback((payload: RealtimePayload) => {
    console.log('🎉 [useRealtimeFinance] Evento recebido:', {
      eventType: payload.eventType,
      table: payload.table,
    });

    switch (payload.eventType) {
      case 'INSERT':
        handleInsert(payload);
        break;
      case 'UPDATE':
        handleUpdate(payload);
        break;
      case 'DELETE':
        handleDelete(payload);
        break;
    }
  }, [handleInsert, handleUpdate, handleDelete]);

  /**
   * 📡 Configurar subscrições Realtime para todas as tabelas de finanças
   */
  useEffect(() => {
    console.log('🔍 [useRealtimeFinance] useEffect executado', {
      workspaceId,
      enabled,
    });

    if (!workspaceId) {
      console.warn('⚠️ [useRealtimeFinance] WorkspaceId não fornecido');
      return;
    }

    if (!enabled) {
      console.warn('⚠️ [useRealtimeFinance] Realtime desabilitado');
      return;
    }

    const tables = [
      'finance_transactions',
      'finance_budgets',
      'finance_categories',
      'finance_goals',
    ];

    console.log('✨ [useRealtimeFinance] Iniciando subscrições', {
      workspaceId,
      tables,
      timestamp: new Date().toISOString(),
    });

    // Subscrever em cada tabela
    tables.forEach(table => {
      const channelName = `${table}:${workspaceId}`;
      
      realtimeManager.subscribe(channelName, {
        event: '*',
        schema: 'public',
        table,
        filter: `workspace_id=eq.${workspaceId}`,
        callback: (payload) => {
          console.log(`🎯 [useRealtimeFinance] Callback ${table}:`, payload.eventType);
          handleRealtimeEvent(payload);
        },
      });
    });

    console.log('📡 [useRealtimeFinance] Subscrições criadas', {
      activeChannels: realtimeManager.getActiveChannelsCount(),
    });

    // Cleanup
    return () => {
      console.log('🔌 [useRealtimeFinance] Removendo subscrições');
      tables.forEach(table => {
        const channelName = `${table}:${workspaceId}`;
        realtimeManager.unsubscribe(channelName);
      });
    };
  }, [workspaceId, enabled, handleRealtimeEvent]);

  return {
    isConnected: true, // Podemos melhorar isso depois
  };
}
