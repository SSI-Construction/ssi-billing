import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import type { Invoice, LineItem } from '../types';
import { addDays, format } from 'date-fns';

interface InvoiceStore {
  invoices: Invoice[];
  loading: boolean;
  loadInvoices: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoice: (id: string) => Invoice | undefined;
  getInvoicesByClient: (clientId: string) => Invoice[];
  generateInvoiceNumber: () => Promise<string>;
  markAsSent: (id: string) => Promise<void>;
  markAsPaid: (id: string, paidAmount?: number) => Promise<void>;
  markAsOverdue: (id: string) => Promise<void>;
  checkOverdueInvoices: () => Promise<void>;
  createBlankInvoice: (clientId?: string) => Promise<Invoice>;
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  invoices: [],
  loading: false,

  loadInvoices: async () => {
    set({ loading: true });
    const invoices = await db.invoices.orderBy('createdAt').reverse().toArray();
    set({ invoices, loading: false });
  },

  addInvoice: async (invoiceData) => {
    const now = new Date().toISOString();
    const invoice: Invoice = {
      ...invoiceData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await db.invoices.add(invoice);
    set((state) => ({ invoices: [invoice, ...state.invoices] }));
    return invoice;
  },

  updateInvoice: async (id, updates) => {
    // Only pass known Invoice data fields — keeps Dexie Cloud system props out
    const allowedKeys: (keyof Invoice)[] = [
      'invoiceNumber', 'clientId', 'invoiceDate', 'dueDate', 'status',
      'lineItems', 'discount', 'discountType', 'notes',
      'sentDate', 'paidDate', 'paidAmount', 'reminderSentDates',
    ];
    const cleanUpdates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const key of allowedKeys) {
      if (key in (updates as object)) {
        cleanUpdates[key] = (updates as Record<string, unknown>)[key];
      }
    }
    await db.invoices.update(id, cleanUpdates as Partial<Invoice>);
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, ...cleanUpdates } : inv)),
    }));
  },

  deleteInvoice: async (id) => {
    await db.invoices.delete(id);
    await db.reminders.where('invoiceId').equals(id).delete();
    set((state) => ({ invoices: state.invoices.filter((inv) => inv.id !== id) }));
  },

  getInvoice: (id) => {
    return get().invoices.find((inv) => inv.id === id);
  },

  getInvoicesByClient: (clientId) => {
    return get().invoices.filter((inv) => inv.clientId === clientId);
  },

  generateInvoiceNumber: async () => {
    const settings = await db.settings.get('default');
    if (!settings) return format(new Date(), 'yyMMdd');

    const prefix = settings.invoicePrefix;
    const num = settings.nextInvoiceNumber;
    const paddedNum = String(num).padStart(4, '0');
    const invoiceNumber = prefix ? `${prefix}-${paddedNum}` : paddedNum;

    await db.settings.update('default', { nextInvoiceNumber: num + 1 });
    return invoiceNumber;
  },

  markAsSent: async (id) => {
    const now = new Date().toISOString();
    await db.invoices.update(id, { status: 'sent', sentDate: now, updatedAt: now });
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id ? { ...inv, status: 'sent' as const, sentDate: now, updatedAt: now } : inv
      ),
    }));
  },

  markAsPaid: async (id, paidAmount) => {
    const now = new Date().toISOString();
    const updates: Partial<Invoice> = { status: 'paid', paidDate: now, updatedAt: now };
    if (paidAmount !== undefined) updates.paidAmount = paidAmount;
    await db.invoices.update(id, updates);
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id ? { ...inv, ...updates } : inv
      ),
    }));
  },

  markAsOverdue: async (id) => {
    const now = new Date().toISOString();
    await db.invoices.update(id, { status: 'overdue', updatedAt: now });
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id ? { ...inv, status: 'overdue' as const, updatedAt: now } : inv
      ),
    }));
  },

  checkOverdueInvoices: async () => {
    const today = new Date().toISOString().split('T')[0];
    const invoices = get().invoices;
    for (const inv of invoices) {
      if ((inv.status === 'sent') && inv.dueDate < today) {
        await get().markAsOverdue(inv.id);
      }
    }
  },

  createBlankInvoice: async (clientId?: string) => {
    const settings = await db.settings.get('default');
    const paymentTermDays = settings?.defaultPaymentTermDays ?? 21;
    const invoiceNumber = await get().generateInvoiceNumber();
    const today = new Date();

    const blankItem: LineItem = {
      id: uuidv4(),
      hours: 0,
      description: '',
      unitPrice: settings?.defaultHourlyRate ?? 0,
    };

    return get().addInvoice({
      invoiceNumber,
      clientId: clientId || '',
      invoiceDate: format(today, 'yyyy-MM-dd'),
      dueDate: format(addDays(today, paymentTermDays), 'yyyy-MM-dd'),
      status: 'draft',
      lineItems: [blankItem],
      discount: 0,
      discountType: 'fixed',
      notes: '',
      reminderSentDates: [],
    });
  },
}));
