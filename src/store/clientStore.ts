import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase, clientFromRow, clientToRow } from './db';
import type { Client } from '../types';

interface ClientStore {
  clients: Client[];
  loading: boolean;
  loadClients: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  loading: false,

  loadClients: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) throw error;
    set({ clients: (data ?? []).map(clientFromRow), loading: false });
  },

  addClient: async (clientData) => {
    const now = new Date().toISOString();
    const client: Client = { ...clientData, id: uuidv4(), createdAt: now, updatedAt: now };
    const { error } = await supabase.from('clients').insert(clientToRow(client));
    if (error) throw error;
    set((state) => ({ clients: [...state.clients, client].sort((a, b) => a.name.localeCompare(b.name)) }));
    return client;
  },

  updateClient: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('clients').update(clientToRow(updatedData)).eq('id', id);
    if (error) throw error;
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...updatedData } : c)),
    }));
  },

  deleteClient: async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
  },

  getClient: (id) => {
    return get().clients.find((c) => c.id === id);
  },
}));
