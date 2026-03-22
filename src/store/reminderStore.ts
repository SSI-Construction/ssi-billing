import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase, reminderFromRow, reminderToRow } from './db';
import type { Reminder } from '../types';

interface ReminderStore {
  reminders: Reminder[];
  loading: boolean;
  loadReminders: () => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Promise<Reminder>;
  completeReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  getPendingReminders: () => Reminder[];
  getOverdueReminders: () => Reminder[];
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],
  loading: false,

  loadReminders: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('reminders').select('*').order('due_date');
    if (error) throw error;
    set({ reminders: (data ?? []).map(reminderFromRow), loading: false });
  },

  addReminder: async (reminderData) => {
    const reminder: Reminder = { ...reminderData, id: uuidv4(), createdAt: new Date().toISOString() };
    const { error } = await supabase.from('reminders').insert(reminderToRow(reminder));
    if (error) throw error;
    set((state) => ({ reminders: [...state.reminders, reminder] }));
    return reminder;
  },

  completeReminder: async (id) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('reminders')
      .update({ completed: true, completed_date: now })
      .eq('id', id);
    if (error) throw error;
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, completed: true, completedDate: now } : r
      ),
    }));
  },

  deleteReminder: async (id) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) }));
  },

  getPendingReminders: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().reminders.filter((r) => !r.completed && r.dueDate >= today);
  },

  getOverdueReminders: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().reminders.filter((r) => !r.completed && r.dueDate < today);
  },
}));
