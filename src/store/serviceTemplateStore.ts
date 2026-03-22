import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase, templateFromRow, templateToRow } from './db';
import type { ServiceTemplate } from '../types';

interface ServiceTemplateStore {
  templates: ServiceTemplate[];
  loading: boolean;
  loadTemplates: () => Promise<void>;
  addTemplate: (template: Omit<ServiceTemplate, 'id' | 'createdAt'>) => Promise<ServiceTemplate>;
  updateTemplate: (id: string, updates: Partial<ServiceTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useServiceTemplateStore = create<ServiceTemplateStore>((set) => ({
  templates: [],
  loading: false,

  loadTemplates: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('service_templates').select('*').order('name');
    if (error) throw error;
    set({ templates: (data ?? []).map(templateFromRow), loading: false });
  },

  addTemplate: async (templateData) => {
    const template: ServiceTemplate = {
      ...templateData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('service_templates').upsert(templateToRow(template));
    if (error) throw error;
    const { data } = await supabase.from('service_templates').select('*').order('name');
    set({ templates: (data ?? []).map(templateFromRow) });
    return template;
  },

  updateTemplate: async (id, updates) => {
    const { error } = await supabase
      .from('service_templates')
      .update(templateToRow(updates))
      .eq('id', id);
    if (error) throw error;
    set((state) => ({
      templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  deleteTemplate: async (id) => {
    const { error } = await supabase.from('service_templates').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
  },
}));
