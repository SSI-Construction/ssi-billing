import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
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
    const reminders = await db.reminders.orderBy('dueDate').toArray();
    set({ reminders, loading: false });
  },

  addReminder: async (reminderData) => {
    const reminder: Reminder = {
      ...reminderData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await db.reminders.add(reminder);
    set((state) => ({ reminders: [...state.reminders, reminder] }));
    return reminder;
  },

  completeReminder: async (id) => {
    const now = new Date().toISOString();
    await db.reminders.where({id}).modify({ completed: true, completedDate: now });
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, completed: true, completedDate: now } : r
      ),
    }));
  },

  deleteReminder: async (id) => {
    await db.reminders.where({id}).delete();
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
