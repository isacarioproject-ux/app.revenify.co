import * as RemindersDB from './reminders-db';
import type { Reminder } from './reminders-db';

export const createReminder = async (reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>): Promise<Reminder> => {
  return RemindersDB.createReminder(reminder);
};

export const getReminders = async (filters?: {
  status?: string;
  workspace_id?: string;
  limit?: number;
}): Promise<Reminder[]> => {
  return RemindersDB.getReminders(filters);
};

export const updateReminder = async (id: string, updates: Partial<Reminder>): Promise<Reminder> => {
  return RemindersDB.updateReminder(id, updates);
};

export const deleteReminder = async (id: string): Promise<void> => {
  return RemindersDB.deleteReminder(id);
};

export const snoozeReminder = async (id: string, minutes: number): Promise<Reminder> => {
  return RemindersDB.snoozeReminder(id, minutes);
};

export const completeReminder = async (id: string): Promise<Reminder> => {
  return RemindersDB.completeReminder(id);
};

export const getUpcomingReminders = async (minutesAhead: number = 60): Promise<Reminder[]> => {
  return RemindersDB.getUpcomingReminders(minutesAhead);
};

