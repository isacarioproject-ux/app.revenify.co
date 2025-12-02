import { supabase } from '@/lib/supabase';
import { getCurrentWorkspaceId } from './tasks-db';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  reminder_date: string;
  reminder_time?: string;
  timezone: string;
  is_recurring: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrence_config?: any;
  recurrence_end_date?: string;
  notification_enabled: boolean;
  notification_channels: string[];
  notification_times: number[];
  last_notified_at?: string;
  next_notification_at?: string;
  location_enabled: boolean;
  location_latitude?: number;
  location_longitude?: number;
  location_radius?: number;
  location_name?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags: string[];
  status: 'active' | 'completed' | 'cancelled' | 'snoozed';
  completed_at?: string;
  snoozed_until?: string;
  task_id?: string;
  workspace_id?: string;
  created_by: string;
  assigned_to: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
}

export async function createReminder(reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>): Promise<Reminder> {
  const userId = await getCurrentUserId();
  const workspaceId = await getCurrentWorkspaceId();

  // Combinar data e hora
  let reminderDate = new Date(reminder.reminder_date);
  if (reminder.reminder_time) {
    const [hours, minutes] = reminder.reminder_time.split(':').map(Number);
    reminderDate.setHours(hours, minutes, 0, 0);
  }

  const { data, error } = await supabase
    .from('reminders')
    .insert({
      title: reminder.title,
      description: reminder.description || '',
      reminder_date: reminderDate.toISOString(),
      reminder_time: reminder.reminder_time,
      timezone: reminder.timezone || 'America/Sao_Paulo',
      is_recurring: reminder.is_recurring || false,
      recurrence_type: reminder.recurrence_type,
      recurrence_config: reminder.recurrence_config || {},
      recurrence_end_date: reminder.recurrence_end_date,
      notification_enabled: reminder.notification_enabled !== false,
      notification_channels: reminder.notification_channels || ['browser'],
      notification_times: reminder.notification_times || [0],
      location_enabled: reminder.location_enabled || false,
      location_latitude: reminder.location_latitude,
      location_longitude: reminder.location_longitude,
      location_radius: reminder.location_radius || 100,
      location_name: reminder.location_name,
      priority: reminder.priority || 'medium',
      category: reminder.category,
      tags: reminder.tags || [],
      status: 'active',
      task_id: reminder.task_id,
      workspace_id: workspaceId || reminder.workspace_id,
      created_by: userId,
      assigned_to: reminder.assigned_to || [],
      metadata: reminder.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReminders(filters?: {
  status?: string;
  workspace_id?: string;
  limit?: number;
}): Promise<Reminder[]> {
  const userId = await getCurrentUserId();
  const workspaceId = await getCurrentWorkspaceId();

  let query = supabase
    .from('reminders')
    .select('*')
    .or(`created_by.eq.${userId},assigned_to.cs.{${userId}}`)
    .order('reminder_date', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.workspace_id || workspaceId) {
    query = query.eq('workspace_id', filters?.workspace_id || workspaceId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function snoozeReminder(id: string, minutes: number): Promise<Reminder> {
  const snoozedUntil = new Date();
  snoozedUntil.setMinutes(snoozedUntil.getMinutes() + minutes);

  return updateReminder(id, {
    status: 'snoozed',
    snoozed_until: snoozedUntil.toISOString(),
  });
}

export async function completeReminder(id: string): Promise<Reminder> {
  return updateReminder(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
}

// Cache persistente para evitar tentativas repetidas de chamar RPC que não existe
const RPC_CACHE_KEY = 'rpc_get_upcoming_reminders_available';
const getRpcAvailability = (): boolean => {
  if (typeof window === 'undefined') return true; // Server-side, sempre tentar
  const cached = localStorage.getItem(RPC_CACHE_KEY);
  return cached !== 'false'; // Se não estiver marcado como false, tentar
};

const setRpcUnavailable = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(RPC_CACHE_KEY, 'false');
  }
};

export async function getUpcomingReminders(minutesAhead: number = 60): Promise<Reminder[]> {
  try {
    // Se já sabemos que a RPC não está disponível, usar fallback direto
    if (!getRpcAvailability()) {
      return await getUpcomingRemindersFallback(minutesAhead);
    }

    // Tentar usar a RPC primeiro
    let data, error;
    try {
      const result = await supabase.rpc('get_upcoming_reminders', {
        p_minutes_ahead: minutesAhead,
      });
      data = result.data;
      error = result.error;
    } catch (rpcError: any) {
      // Se a RPC não existir (404), marcar como não disponível e usar fallback
      if (rpcError?.code === 'P0001' || 
          rpcError?.message?.includes('does not exist') || 
          rpcError?.message?.includes('404') ||
          rpcError?.status === 404 ||
          rpcError?.code === '42883' ||
          rpcError?.code === 'PGRST116') {
        setRpcUnavailable();
        console.warn('⚠️ RPC get_upcoming_reminders não disponível, usando fallback');
        data = null;
        error = { message: 'RPC not available' };
      } else {
        throw rpcError;
      }
    }

    if (!error && data) {
      return data;
    }

    // Se a RPC falhar (404 ou outro erro), usar query direta como fallback
    if (error && (error.code === 'P0001' || error.code === 'RPC_NOT_FOUND' || error.message?.includes('does not exist') || error.message?.includes('404'))) {
      setRpcUnavailable();
      return await getUpcomingRemindersFallback(minutesAhead);
    }

    throw error;
  } catch (error: any) {
    // Se ainda falhar, usar fallback
    if (error?.code === 'RPC_NOT_FOUND' || 
        error?.message?.includes('does not exist') || 
        error?.message?.includes('404') ||
        error?.status === 404 ||
        error?.code === '42883' ||
        error?.code === 'PGRST116') {
      setRpcUnavailable();
      return await getUpcomingRemindersFallback(minutesAhead);
    }
    
    // Para outros erros, retornar array vazio silenciosamente
    return [];
  }
}

async function getUpcomingRemindersFallback(minutesAhead: number): Promise<Reminder[]> {
  try {
    const userId = await getCurrentUserId();
    const workspaceId = await getCurrentWorkspaceId();
    
    const now = new Date();
    const futureTime = new Date(now.getTime() + minutesAhead * 60 * 1000);
    
    let query = supabase
      .from('reminders')
      .select('*')
      .eq('status', 'active')
      .eq('notification_enabled', true)
      .or(`created_by.eq.${userId},assigned_to.cs.{${userId}}`)
      .gte('reminder_date', now.toISOString())
      .lte('reminder_date', futureTime.toISOString())
      .order('reminder_date', { ascending: true });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data: reminders, error: queryError } = await query;

    if (queryError) throw queryError;
    return reminders || [];
  } catch (error: any) {
    console.warn('Erro no fallback de lembretes:', error);
    return [];
  }
}

