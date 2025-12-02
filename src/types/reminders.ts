export type ReminderStatus = 'active' | 'completed' | 'snoozed' | 'cancelled';
export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminder_date?: string;
  reminder_time?: string;
  timezone?: string;
  is_recurring: boolean;
  recurrence_type?: RecurrenceType;
  recurrence_config?: Record<string, any>;
  recurrence_end_date?: string;
  notification_enabled: boolean;
  notification_channels?: string[];
  notification_times?: number[];
  last_notified_at?: string;
  next_notification_at?: string;
  location_enabled: boolean;
  location_latitude?: number;
  location_longitude?: number;
  location_radius?: number;
  location_name?: string;
  priority: ReminderPriority;
  category?: string;
  tags?: string[];
  status: ReminderStatus;
  completed_at?: string;
  snoozed_until?: string;
  task_id?: string;
  workspace_id?: string;
  created_by: string;
  assigned_to?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateReminderData {
  title: string;
  description?: string;
  reminder_date?: string;
  reminder_time?: string;
  timezone?: string;
  is_recurring?: boolean;
  recurrence_type?: RecurrenceType;
  recurrence_config?: Record<string, any>;
  recurrence_end_date?: string;
  notification_enabled?: boolean;
  notification_channels?: string[];
  notification_times?: number[];
  location_enabled?: boolean;
  location_latitude?: number;
  location_longitude?: number;
  location_radius?: number;
  location_name?: string;
  priority?: ReminderPriority;
  category?: string;
  tags?: string[];
  task_id?: string;
  workspace_id?: string;
  assigned_to?: string[];
  metadata?: Record<string, any>;
}
