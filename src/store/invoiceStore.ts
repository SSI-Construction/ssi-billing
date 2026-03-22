import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase, invoiceFromRow, invoiceToRow, settingsFromRow } from './db';
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
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    set({ invoices: (data ?? []).map(invoiceFromRow), loading: false });
  },

  addInvoice: async (invoiceData) => {
    const now = new Date().toISOString();
    const invoice: Invoice = { ...invoiceData, id: uuidv4(), createdAt: now, updatedAt: now };
    const { error } = await supabase.from('invoices').insert(invoiceToRow(invoice));
    if (error) throw error;
    set((state) => ({ invoices: [invoice, ...state.invoices] }));
    return invoice;
  },

  updateInvoice: async (id, updates) => {
    const cleanUpdates: Partial<Invoice> = { updatedAt: new Date().toISOString() };
    const allowedKeys: (keyof Invoice)[] = [
      'invoiceNumber', 'clientId', 'invoiceDate', 'dueDate', 'status',
      'lineItems', 'discount', 'discountType', 'notes',
      'sentDate', 'paidDate', 'paidAmount', 'reminderSentDates',
    ];
    for (const key of allowedKeys) {
      if (key in (updates as object)) {
        (cleanUpdates as Record<string, unknown>)[key] = (updates as Record<string, unknown>)[key];
      }
    }
    const { error } = await supabase
      .from('invoices')
      .update(invoiceToRow(cleanUpdates))
      .eq('id', id);
    if (error) throw error;
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, ...cleanUpdates } : inv)),
    }));
  },

  deleteInvoice: async (id) => {
    const { error: remErr } = await supabase.from('reminders').delete().eq('invoice_id', id);
    if (remErr) throw remErr;
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ invoices: state.invoices.filter((inv) => inv.id !== id) }));
  },

  getInvoice: (id) => {
    return get().invoices.find((inv) => inv.id === id);
  },

  getInvoicesByClient: (clientId) => {
    return get().invoices.filter((inv) => inv.clientId === clientId);
  },

  generateInvoiceNumber: async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 'default').single();
    if (!data) return format(new Date(), 'yyMMdd');
    const settings = settingsFromRow(data);

    const prefix = settings.invoicePrefix;
    const num = settings.nextInvoiceNumber;
    const paddedNum = String(num).padStart(4, '0');
    const invoiceNumber = prefix ? `${prefix}-${paddedNum}` : paddedNum;

    await supabase
      .from('settings')
      .update({ next_invoice_number: num + 1 })
      .eq('id', 'default');
    return invoiceNumber;
  },

  markAsSent: async (id) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'sent', sent_date: now, updated_at: now })
      .eq('id', id);
    if (error) throw error;
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id ? { ...inv, status: 'sent' as const, sentDate: now, updatedAt: now } : inv
      ),
    }));
  },

  markAsPaid: async (id, paidAmount) => {
    const now = new Date().toISOString();
    const row: Record<string, unknown> = { status: 'paid', paid_date: now, updated_at: now };
    if (paidAmount !== undefined) row.paid_amount = paidAmount;
    const { error } = await supabase.from('invoices').update(row).eq('id', id);
    if (error) throw error;
    const updates: Partial<Invoice> = { status: 'paid', paidDate: now, updatedAt: now };
    if (paidAmount !== undefined) updates.paidAmount = paidAmount;
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
    }));
  },

  markAsOverdue: async (id) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'overdue', updated_at: now })
      .eq('id', id);
    if (error) throw error;
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
      if (inv.status === 'sent' && inv.dueDate < today) {
        await get().markAsOverdue(inv.id);
      }
    }
  },

  createBlankInvoice: async (clientId?: string) => {
    const { data } = await supabase.from('settings').select('*').eq('id', 'default').single();
    const settings = data ? settingsFromRow(data) : null;
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
