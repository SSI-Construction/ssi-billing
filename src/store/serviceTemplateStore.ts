import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
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
    const templates = await db.serviceTemplates.orderBy('name').toArray();
    set({ templates, loading: false });
  },

  addTemplate: async (templateData) => {
    const template: ServiceTemplate = {
      ...templateData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    try {
      await db.serviceTemplates.put(template);
      const templates = await db.serviceTemplates.orderBy('name').toArray();
      set({ templates });
    } catch (err) {
      console.error('Failed to add service template:', err);
      throw err;
    }
    return template;
  },

  updateTemplate: async (id, updates) => {
    await db.serviceTemplates.where({id}).modify(updates);
    set((state) => ({
      templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  deleteTemplate: async (id) => {
    await db.serviceTemplates.where({id}).delete();
    set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
  },
}));
