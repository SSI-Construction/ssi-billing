import { create } from 'zustand';
import { supabase, settingsFromRow, settingsToRow } from './db';
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
    const { data } = await supabase.from('settings').select('*').eq('id', 'default').single();
    set({ settings: data ? settingsFromRow(data) : null, loading: false });
  },

  updateSettings: async (updates) => {
    const { error } = await supabase
      .from('settings')
      .update(settingsToRow(updates))
      .eq('id', 'default');
    if (error) throw error;
    const { data } = await supabase.from('settings').select('*').eq('id', 'default').single();
    set({ settings: data ? settingsFromRow(data) : null });
  },
}));
