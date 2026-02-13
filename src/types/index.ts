export interface Client {
  id: string;
  name: string;
  projectName: string;
  projectAddress: string;
  cityProvince: string;
  attention: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: string;
  hours: number;
  description: string;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  lineItems: LineItem[];
  discount: number;
  discountType: 'percentage' | 'fixed';
  notes: string;
  sentDate?: string;
  paidDate?: string;
  paidAmount?: number;
  reminderSentDates: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  defaultRate: number;
  createdAt: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  address: string;
  cityProvince: string;
  gstNumber: string;
  gstRate: number;
  beneficiaryName: string;
  chequePayableTo: string;
  etransferEmail: string;
  contactEmail: string;
  phone: string;
  defaultPaymentTermDays: number;
  defaultHourlyRate: number;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  logoUrl?: string;
}

export interface Reminder {
  id: string;
  invoiceId: string;
  type: 'send' | 'overdue' | 'followup';
  dueDate: string;
  completed: boolean;
  completedDate?: string;
  notes: string;
  createdAt: string;
}

// Computed helpers
export function getLineTotal(item: LineItem): number {
  return item.hours * item.unitPrice;
}

export function getSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + getLineTotal(item), 0);
}

export function getDiscountAmount(subtotal: number, discount: number, discountType: 'percentage' | 'fixed'): number {
  if (discountType === 'percentage') {
    return subtotal * (discount / 100);
  }
  return discount;
}

export function getNetTotal(items: LineItem[], discount: number, discountType: 'percentage' | 'fixed'): number {
  const subtotal = getSubtotal(items);
  return subtotal - getDiscountAmount(subtotal, discount, discountType);
}

export function getGstAmount(netTotal: number, gstRate: number): number {
  return netTotal * (gstRate / 100);
}

export function getGrandTotal(items: LineItem[], discount: number, discountType: 'percentage' | 'fixed', gstRate: number): number {
  const net = getNetTotal(items, discount, discountType);
  return net + getGstAmount(net, gstRate);
}
