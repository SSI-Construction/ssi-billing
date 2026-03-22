import { createClient } from '@supabase/supabase-js';
import type { Client, Invoice, ServiceTemplate, CompanySettings, Reminder } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── snake_case ↔ camelCase mappers ────────────────────────

// --- Client ---
export function clientFromRow(r: Record<string, unknown>): Client {
  return {
    id: r.id as string,
    name: r.name as string,
    projectName: r.project_name as string,
    projectAddress: r.project_address as string,
    cityProvince: r.city_province as string,
    attention: r.attention as string,
    email: r.email as string,
    phone: r.phone as string,
    notes: r.notes as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function clientToRow(c: Partial<Client>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (c.id !== undefined) row.id = c.id;
  if (c.name !== undefined) row.name = c.name;
  if (c.projectName !== undefined) row.project_name = c.projectName;
  if (c.projectAddress !== undefined) row.project_address = c.projectAddress;
  if (c.cityProvince !== undefined) row.city_province = c.cityProvince;
  if (c.attention !== undefined) row.attention = c.attention;
  if (c.email !== undefined) row.email = c.email;
  if (c.phone !== undefined) row.phone = c.phone;
  if (c.notes !== undefined) row.notes = c.notes;
  if (c.createdAt !== undefined) row.created_at = c.createdAt;
  if (c.updatedAt !== undefined) row.updated_at = c.updatedAt;
  return row;
}

// --- Invoice ---
export function invoiceFromRow(r: Record<string, unknown>): Invoice {
  return {
    id: r.id as string,
    invoiceNumber: r.invoice_number as string,
    clientId: r.client_id as string,
    invoiceDate: r.invoice_date as string,
    dueDate: r.due_date as string,
    status: r.status as Invoice['status'],
    lineItems: (r.line_items ?? []) as Invoice['lineItems'],
    discount: Number(r.discount ?? 0),
    discountType: r.discount_type as Invoice['discountType'],
    notes: r.notes as string,
    sentDate: r.sent_date as string | undefined,
    paidDate: r.paid_date as string | undefined,
    paidAmount: r.paid_amount != null ? Number(r.paid_amount) : undefined,
    reminderSentDates: (r.reminder_sent_dates ?? []) as string[],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function invoiceToRow(inv: Partial<Invoice>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (inv.id !== undefined) row.id = inv.id;
  if (inv.invoiceNumber !== undefined) row.invoice_number = inv.invoiceNumber;
  if (inv.clientId !== undefined) row.client_id = inv.clientId;
  if (inv.invoiceDate !== undefined) row.invoice_date = inv.invoiceDate;
  if (inv.dueDate !== undefined) row.due_date = inv.dueDate;
  if (inv.status !== undefined) row.status = inv.status;
  if (inv.lineItems !== undefined) row.line_items = inv.lineItems;
  if (inv.discount !== undefined) row.discount = inv.discount;
  if (inv.discountType !== undefined) row.discount_type = inv.discountType;
  if (inv.notes !== undefined) row.notes = inv.notes;
  if (inv.sentDate !== undefined) row.sent_date = inv.sentDate;
  if (inv.paidDate !== undefined) row.paid_date = inv.paidDate;
  if (inv.paidAmount !== undefined) row.paid_amount = inv.paidAmount;
  if (inv.reminderSentDates !== undefined) row.reminder_sent_dates = inv.reminderSentDates;
  if (inv.createdAt !== undefined) row.created_at = inv.createdAt;
  if (inv.updatedAt !== undefined) row.updated_at = inv.updatedAt;
  return row;
}

// --- ServiceTemplate ---
export function templateFromRow(r: Record<string, unknown>): ServiceTemplate {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string,
    defaultRate: Number(r.default_rate ?? 0),
    createdAt: r.created_at as string,
  };
}

export function templateToRow(t: Partial<ServiceTemplate>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (t.id !== undefined) row.id = t.id;
  if (t.name !== undefined) row.name = t.name;
  if (t.description !== undefined) row.description = t.description;
  if (t.defaultRate !== undefined) row.default_rate = t.defaultRate;
  if (t.createdAt !== undefined) row.created_at = t.createdAt;
  return row;
}

// --- CompanySettings ---
export function settingsFromRow(r: Record<string, unknown>): CompanySettings {
  return {
    id: r.id as string,
    companyName: r.company_name as string,
    address: r.address as string,
    cityProvince: r.city_province as string,
    gstNumber: r.gst_number as string,
    gstRate: Number(r.gst_rate ?? 5),
    beneficiaryName: r.beneficiary_name as string,
    chequePayableTo: r.cheque_payable_to as string,
    etransferEmail: r.etransfer_email as string,
    contactEmail: r.contact_email as string,
    phone: r.phone as string,
    defaultPaymentTermDays: Number(r.default_payment_term_days ?? 21),
    defaultHourlyRate: Number(r.default_hourly_rate ?? 0),
    invoicePrefix: r.invoice_prefix as string,
    nextInvoiceNumber: Number(r.next_invoice_number ?? 75001),
    logoUrl: r.logo_url as string | undefined,
  };
}

export function settingsToRow(s: Partial<CompanySettings>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (s.id !== undefined) row.id = s.id;
  if (s.companyName !== undefined) row.company_name = s.companyName;
  if (s.address !== undefined) row.address = s.address;
  if (s.cityProvince !== undefined) row.city_province = s.cityProvince;
  if (s.gstNumber !== undefined) row.gst_number = s.gstNumber;
  if (s.gstRate !== undefined) row.gst_rate = s.gstRate;
  if (s.beneficiaryName !== undefined) row.beneficiary_name = s.beneficiaryName;
  if (s.chequePayableTo !== undefined) row.cheque_payable_to = s.chequePayableTo;
  if (s.etransferEmail !== undefined) row.etransfer_email = s.etransferEmail;
  if (s.contactEmail !== undefined) row.contact_email = s.contactEmail;
  if (s.phone !== undefined) row.phone = s.phone;
  if (s.defaultPaymentTermDays !== undefined) row.default_payment_term_days = s.defaultPaymentTermDays;
  if (s.defaultHourlyRate !== undefined) row.default_hourly_rate = s.defaultHourlyRate;
  if (s.invoicePrefix !== undefined) row.invoice_prefix = s.invoicePrefix;
  if (s.nextInvoiceNumber !== undefined) row.next_invoice_number = s.nextInvoiceNumber;
  if (s.logoUrl !== undefined) row.logo_url = s.logoUrl;
  return row;
}

// --- Reminder ---
export function reminderFromRow(r: Record<string, unknown>): Reminder {
  return {
    id: r.id as string,
    invoiceId: r.invoice_id as string,
    type: r.type as Reminder['type'],
    dueDate: r.due_date as string,
    completed: r.completed as boolean,
    completedDate: r.completed_date as string | undefined,
    notes: r.notes as string,
    createdAt: r.created_at as string,
  };
}

export function reminderToRow(rem: Partial<Reminder>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (rem.id !== undefined) row.id = rem.id;
  if (rem.invoiceId !== undefined) row.invoice_id = rem.invoiceId;
  if (rem.type !== undefined) row.type = rem.type;
  if (rem.dueDate !== undefined) row.due_date = rem.dueDate;
  if (rem.completed !== undefined) row.completed = rem.completed;
  if (rem.completedDate !== undefined) row.completed_date = rem.completedDate;
  if (rem.notes !== undefined) row.notes = rem.notes;
  if (rem.createdAt !== undefined) row.created_at = rem.createdAt;
  return row;
}

// Seed default settings if none exist
export async function seedDefaultSettings(): Promise<void> {
  // The SQL migration seeds settings; this is a no-op safety net.
  const { data } = await supabase.from('settings').select('id').eq('id', 'default').single();
  if (!data) {
    await supabase.from('settings').insert({
      id: 'default',
      company_name: 'SSI Construction Management Inc.',
      address: '4415 11th Ave NW',
      city_province: 'Edmonton Ab. T6L6M7',
      gst_number: '78059 3620RT001',
      gst_rate: 5,
      beneficiary_name: 'Parmjit Kandola',
      cheque_payable_to: 'SSI Construction Management Inc.',
      etransfer_email: 'kandola.parm@gmail.com',
      contact_email: 'kandola.parm@gmail.com',
      phone: '',
      default_payment_term_days: 21,
      default_hourly_rate: 0,
      invoice_prefix: '',
      next_invoice_number: 75001,
    });
  }
}
