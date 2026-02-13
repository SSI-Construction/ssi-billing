import Dexie, { type Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import type { Client, Invoice, ServiceTemplate, CompanySettings, Reminder } from '../types';

// Dexie Cloud database URL - set via environment variable
const DEXIE_CLOUD_URL = import.meta.env.VITE_DEXIE_CLOUD_URL as string | undefined;

export class SSIBillingDB extends Dexie {
  clients!: Table<Client>;
  invoices!: Table<Invoice>;
  serviceTemplates!: Table<ServiceTemplate>;
  settings!: Table<CompanySettings>;
  reminders!: Table<Reminder>;

  constructor() {
    super('SSIBillingDB', {
      addons: [...(DEXIE_CLOUD_URL ? [dexieCloud] : [])],
    });

    this.version(1).stores({
      clients: 'id, name, createdAt',
      invoices: 'id, invoiceNumber, clientId, status, invoiceDate, dueDate, createdAt',
      serviceTemplates: 'id, name',
      settings: 'id',
      reminders: 'id, invoiceId, type, dueDate, completed',
    });

    // Configure Dexie Cloud sync if URL is provided
    if (DEXIE_CLOUD_URL) {
      this.cloud.configure({
        databaseUrl: DEXIE_CLOUD_URL,
        requireAuth: true, // User authenticates once via email OTP
        nameSuffix: false, // Keep same IndexedDB name so existing data syncs
      });
    }
  }
}

export const db = new SSIBillingDB();

/** Whether Dexie Cloud sync is enabled */
export const isCloudEnabled = !!DEXIE_CLOUD_URL;

// Seed default settings if none exist
export async function seedDefaultSettings(): Promise<void> {
  try {
    const existing = await db.settings.get('default');
    if (!existing) {
      await db.settings.put({
        id: 'default',
        companyName: 'SSI Construction Management Inc.',
        address: '4415 11th Ave NW',
        cityProvince: 'Edmonton Ab. T6L6M7',
        gstNumber: '78059 3620RT001',
        gstRate: 5,
        beneficiaryName: 'Parmjit Kandola',
        chequePayableTo: 'SSI Construction Management Inc.',
        etransferEmail: 'kandola.parm@gmail.com',
        contactEmail: 'kandola.parm@gmail.com',
        phone: '',
        defaultPaymentTermDays: 21,
        defaultHourlyRate: 0,
        invoicePrefix: '',
        nextInvoiceNumber: 75001,
      });
    }
  } catch (error) {
    console.error('Failed to seed default settings:', error);
  }
}
