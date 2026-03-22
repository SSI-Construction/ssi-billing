import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
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
    const clients = await db.clients.orderBy('name').toArray();
    set({ clients, loading: false });
  },

  addClient: async (clientData) => {
    const now = new Date().toISOString();
    const client: Client = {
      ...clientData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await db.clients.add(client);
    set((state) => ({ clients: [...state.clients, client].sort((a, b) => a.name.localeCompare(b.name)) }));
    return client;
  },

  updateClient: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date().toISOString() };
    await db.clients.where({id}).modify(updatedData);
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...updatedData } : c)),
    }));
  },

  deleteClient: async (id) => {
    await db.clients.where({id}).delete();
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
  },

  getClient: (id) => {
    return get().clients.find((c) => c.id === id);
  },
}));
