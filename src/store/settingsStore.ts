import { create } from 'zustand';
import { db } from './db';
import type { CompanySettings } from '../types';

interface SettingsStore {
  settings: CompanySettings | null;
  loading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<CompanySettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loading: false,

  loadSettings: async () => {
    set({ loading: true });
    const settings = await db.settings.get('default');
    set({ settings: settings ?? null, loading: false });
  },

  updateSettings: async (updates) => {
    await db.settings.update('default', updates);
    const settings = await db.settings.get('default');
    set({ settings: settings ?? null });
  },
}));
