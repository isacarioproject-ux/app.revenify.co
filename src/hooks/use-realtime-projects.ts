import { useEffect, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { realtimeManager } from '@/lib/realtime-manager';
import { toast } from 'sonner';

/**
 * 📡 Hook para ouvir mudanças em tempo real na tabela de projetos
 * 
 * @param workspaceId - ID do workspace para filtrar eventos
 * @param options - Configurações opcionais
 */

interface UseRealtimeProjectsOptions {
  /** Habilitar/desabilitar o realtime */
  enabled?: boolean;
  /** Mostrar notificações toast */
  showNotifications?: boolean;
  /** Callback chamado quando houver uma atualização */
  onUpdate?: () => void;
  /** Callback chamado quando um projeto for criado */
  onProjectCreated?: (project: any) => void;
  /** Callback chamado quando um projeto for atualizado */
  onProjectUpdated?: (project: any) => void;
  /** Callback chamado quando um projeto for deletado */
  onProjectDeleted?: (projectId: string) => void;
}

type RealtimePayload = RealtimePostgresChangesPayload<any>;

export function useRealtimeProjects(
  workspaceId: string | null,
  options: UseRealtimeProjectsOptions = {}
) {
  const {
    enabled = true,
    showNotifications = true,
    onUpdate,
    onProjectCreated,
    onProjectUpdated,
    onProjectDeleted,
  } = options;

  /**
   * 🆕 Handler para INSERT
   */
  const handleInsert = useCallback((payload: RealtimePayload) => {
    const project = payload.new as any;
    
    console.log('📁 [useRealtimeProjects] Novo projeto:', {
      id: project?.id,
      name: project?.name,
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onProjectCreated?.(project);

    // Notificação
    if (showNotifications) {
      const projectName = project?.name || 'Projeto';
      toast.success(`📁 ${projectName} foi criado`, {
        duration: 2000,
      });
    }
  }, [onUpdate, onProjectCreated, showNotifications]);

  /**
   * 🔄 Handler para UPDATE
   */
  const handleUpdate = useCallback((payload: RealtimePayload) => {
    const newProj = payload.new as any;
    const oldProj = payload.old as any;
    
    console.log('🔄 [useRealtimeProjects] Projeto atualizado:', {
      id: newProj?.id,
      name: newProj?.name,
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onProjectUpdated?.(newProj);

    // Notificação discreta (apenas para mudanças significativas)
    if (showNotifications && oldProj?.name !== newProj?.name) {
      toast.info(`📁 ${newProj?.name} foi atualizado`, {
        duration: 2000,
      });
    }
  }, [onUpdate, onProjectUpdated, showNotifications]);

  /**
   * 🗑️ Handler para DELETE
   */
  const handleDelete = useCallback((payload: RealtimePayload) => {
    const oldProj = payload.old as any;
    
    console.log('🗑️ [useRealtimeProjects] Projeto removido:', {
      id: oldProj?.id,
      name: oldProj?.name,
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onProjectDeleted?.(oldProj?.id);

    // Notificação
    if (showNotifications) {
      const projectName = oldProj?.name || 'Projeto';
      toast.info(`📁 ${projectName} foi removido`, {
        duration: 2000,
      });
    }
  }, [onUpdate, onProjectDeleted, showNotifications]);

  /**
   * 🎯 Handler principal de eventos Realtime
   */
  const handleRealtimeEvent = useCallback((payload: RealtimePayload) => {
    const proj = (payload.new || payload.old) as any;
    
    console.log('🎉 [useRealtimeProjects] Evento recebido:', {
      eventType: payload.eventType,
      id: proj?.id,
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
   * 📡 Configurar subscrição Realtime
   */
  useEffect(() => {
    console.log('🔍 [useRealtimeProjects] useEffect executado', {
      workspaceId,
      enabled,
    });

    if (!workspaceId) {
      console.warn('⚠️ [useRealtimeProjects] WorkspaceId não fornecido');
      return;
    }

    if (!enabled) {
      console.warn('⚠️ [useRealtimeProjects] Realtime desabilitado');
      return;
    }

    const channelName = `projects:${workspaceId}`;

    console.log('✨ [useRealtimeProjects] Iniciando subscrição', {
      workspaceId,
      channelName,
      timestamp: new Date().toISOString(),
    });

    // Subscrever no channel de projetos
    realtimeManager.subscribe(channelName, {
      event: '*',
      schema: 'public',
      table: 'projects',
      filter: `workspace_id=eq.${workspaceId}`,
      callback: (payload) => {
        console.log('🎯 [useRealtimeProjects] Callback disparado:', payload.eventType);
        handleRealtimeEvent(payload);
      },
    });

    console.log('📡 [useRealtimeProjects] Subscrição criada', {
      channelName,
      activeChannels: realtimeManager.getActiveChannelsCount(),
    });

    // Cleanup
    return () => {
      console.log('🔌 [useRealtimeProjects] Removendo subscrição');
      realtimeManager.unsubscribe(channelName);
    };
  }, [workspaceId, enabled, handleRealtimeEvent]);

  return {
    isConnected: true,
  };
}
