import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoiceStore } from '../store/invoiceStore';
import { useClientStore } from '../store/clientStore';
import { useSettingsStore } from '../store/settingsStore';
import { useServiceTemplateStore } from '../store/serviceTemplateStore';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import type { Invoice, LineItem } from '../types';
import {
  getLineTotal,
  getSubtotal,
  getDiscountAmount,
  getNetTotal,
  getGstAmount,
  getGrandTotal,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Save,
  Download,
  Send,
  CheckCircle,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react';

export const InvoiceEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const invoice = useInvoiceStore((s) => s.invoices.find((i) => i.id === id));
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice);
  const markAsSent = useInvoiceStore((s) => s.markAsSent);
  const markAsPaid = useInvoiceStore((s) => s.markAsPaid);
  const clients = useClientStore((s) => s.clients);
  const settings = useSettingsStore((s) => s.settings);
  const templates = useServiceTemplateStore((s) => s.templates);

  const [form, setForm] = useState<Partial<Invoice>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);


  const gstRate = settings?.gstRate ?? 5;

  useEffect(() => {
    if (invoice) {
      setForm({ ...invoice });
    }
  }, [invoice]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = useCallback(async () => {
    if (!id || !form) return;
    setSaving(true);
    try {
      await updateInvoice(id, form);
      showToast('Invoice saved!');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }, [id, form, updateInvoice]);

  const handleSend = async () => {
    if (!id) return;
    await handleSave();
    await markAsSent(id);
    showToast('Invoice marked as sent!');
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    await markAsPaid(id);
    showToast('Invoice marked as paid!');
  };

  const handleDownloadPDF = async () => {
    if (!invoice || !settings) return;
    const client = clients.find((c) => c.id === invoice.clientId);
    await downloadInvoicePDF(
      { ...invoice, ...form } as Invoice,
      client,
      settings
    );
    showToast('PDF downloaded!');
  };

  const updateField = (field: keyof Invoice, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateLineItem = (itemId: string, field: keyof LineItem, value: unknown) => {
    setForm((prev) => ({
      ...prev,
      lineItems: (prev.lineItems || []).map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: uuidv4(),
      hours: 0,
      description: '',
      unitPrice: settings?.defaultHourlyRate ?? 0,
    };
    setForm((prev) => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), newItem],
    }));
  };

  const removeLineItem = (itemId: string) => {
    setForm((prev) => ({
      ...prev,
      lineItems: (prev.lineItems || []).filter((item) => item.id !== itemId),
    }));
  };

  const addFromTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const newItem: LineItem = {
      id: uuidv4(),
      hours: 0,
      description: template.description || template.name,
      unitPrice: template.defaultRate,
    };
    setForm((prev) => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), newItem],
    }));
  };

  const handleClientChange = (clientId: string) => {
    updateField('clientId', clientId);
  };

  const handleDueDateFromTerms = () => {
    if (!form.invoiceDate || !settings) return;
    const due = addDays(parseISO(form.invoiceDate), settings.defaultPaymentTermDays);
    updateField('dueDate', format(due, 'yyyy-MM-dd'));
  };

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found.</p>
        <button onClick={() => navigate('/invoices')} className="btn btn-primary mt-4">
          Back to Invoices
        </button>
      </div>
    );
  }

  const lineItems = form.lineItems || [];
  const subtotal = getSubtotal(lineItems);
  const discountAmt = getDiscountAmount(subtotal, form.discount || 0, form.discountType || 'fixed');
  const netTotal = getNetTotal(lineItems, form.discount || 0, form.discountType || 'fixed');
  const gstAmt = getGstAmount(netTotal, gstRate);
  const grandTotal = getGrandTotal(lineItems, form.discount || 0, form.discountType || 'fixed', gstRate);

  const selectedClient = clients.find((c) => c.id === form.clientId);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="btn btn-ghost">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice #{form.invoiceNumber}
            </h1>
            <span className={`badge badge-${form.status}`}>{form.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadPDF} className="btn btn-outline" title="Download PDF">
            <Download size={16} /> PDF
          </button>
          {form.status === 'draft' && (
            <button onClick={handleSend} className="btn btn-success">
              <Send size={16} /> Mark as Sent
            </button>
          )}
          {(form.status === 'sent' || form.status === 'overdue') && (
            <button onClick={handleMarkPaid} className="btn btn-success">
              <CheckCircle size={16} /> Mark as Paid
            </button>
          )}
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Dates */}
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group md:col-span-2">
                  <label className="form-label">Client</label>
                  <select
                    className="form-input form-select"
                    value={form.clientId || ''}
                    onChange={(e) => handleClientChange(e.target.value)}
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.projectName ? `- ${c.projectName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClient && (
                  <div className="md:col-span-2 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <div className="font-medium text-gray-900">{selectedClient.name}</div>
                    {selectedClient.projectName && <div>{selectedClient.projectName}</div>}
                    {selectedClient.projectAddress && <div>{selectedClient.projectAddress}</div>}
                    {selectedClient.cityProvince && <div>{selectedClient.cityProvince}</div>}
                    {selectedClient.attention && <div>Attn: {selectedClient.attention}</div>}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Invoice Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.invoiceDate || ''}
                    onChange={(e) => updateField('invoiceDate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Due Date
                    <button
                      type="button"
                      onClick={handleDueDateFromTerms}
                      className="ml-2 text-xs text-primary hover:underline font-normal"
                    >
                      Auto ({settings?.defaultPaymentTermDays ?? 21} days)
                    </button>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.dueDate || ''}
                    onChange={(e) => updateField('dueDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Line Items</h2>
              <div className="flex gap-2">
                {templates.length > 0 && (
                  <select
                    className="form-input form-select text-xs py-1 w-auto"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addFromTemplate(e.target.value);
                    }}
                  >
                    <option value="">+ From Template</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (${t.defaultRate}/hr)
                      </option>
                    ))}
                  </select>
                )}
                <button onClick={addLineItem} className="btn btn-outline btn-sm">
                  <Plus size={14} /> Add Line
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Hours</th>
                    <th>Description</th>
                    <th style={{ width: '120px' }}>Rate ($/hr)</th>
                    <th style={{ width: '120px' }}>Total</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="number"
                          className="form-input text-center py-1"
                          value={item.hours || ''}
                          onChange={(e) =>
                            updateLineItem(item.id, 'hours', parseFloat(e.target.value) || 0)
                          }
                          step="0.5"
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input py-1"
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(item.id, 'description', e.target.value)
                          }
                          placeholder="Service description..."
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input text-right py-1"
                          value={item.unitPrice || ''}
                          onChange={(e) =>
                            updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td className="text-right font-medium">
                        ${getLineTotal(item).toFixed(2)}
                      </td>
                      <td>
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="btn btn-ghost btn-sm p-1 text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lineItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-8">
                        No line items. Click "Add Line" to add services.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Notes / Additional Information</label>
                <textarea
                  className="form-input"
                  value={form.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Any notes to include on the invoice..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-700">Summary</h2>
            </div>
            <div className="card-body space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="form-label text-xs">Discount</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      className="form-input py-1 text-sm"
                      value={form.discount || ''}
                      onChange={(e) =>
                        updateField('discount', parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="0.01"
                    />
                    <select
                      className="form-input form-select py-1 text-sm w-16"
                      value={form.discountType || 'fixed'}
                      onChange={(e) =>
                        updateField('discountType', e.target.value)
                      }
                    >
                      <option value="fixed">$</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                </div>
              </div>

              {(form.discount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-red-500">-${discountAmt.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-500">Net Total</span>
                <span className="font-medium">${netTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-500">GST ({gstRate}%)</span>
                  <div className="text-xs text-gray-400">#{settings?.gstNumber}</div>
                </div>
                <span>${gstAmt.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-lg pt-3 border-t-2 border-gray-200">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-primary">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-700">Details</h2>
            </div>
            <div className="card-body space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice #</span>
                <span className="font-medium">{form.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`badge badge-${form.status}`}>{form.status}</span>
              </div>
              {form.sentDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Sent</span>
                  <span>{format(parseISO(form.sentDate), 'MMM d, yyyy')}</span>
                </div>
              )}
              {form.paidDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid</span>
                  <span>{format(parseISO(form.paidDate), 'MMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>{format(parseISO(form.createdAt || invoice.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-700">Actions</h2>
            </div>
            <div className="card-body space-y-2">
              <button onClick={handleDownloadPDF} className="w-full btn btn-outline btn-sm justify-start">
                <Download size={14} /> Download PDF
              </button>
              {selectedClient?.email && (
                <a
                  href={`mailto:${selectedClient.email}?subject=Invoice ${form.invoiceNumber} - ${settings?.companyName}&body=Please find attached invoice ${form.invoiceNumber} for your records.%0A%0AAmount Due: $${grandTotal.toFixed(2)}%0ADue Date: ${form.dueDate ? format(parseISO(form.dueDate), 'MMMM d, yyyy') : 'N/A'}%0A%0APayment can be sent via e-transfer to: ${settings?.etransferEmail}%0APayment Reference: ${form.invoiceNumber}%0A%0AThank you for your business!%0A${settings?.companyName}`}
                  className="w-full btn btn-outline btn-sm justify-start"
                >
                  <Send size={14} /> Email Client
                </a>
              )}
              <button
                onClick={() => {
                  const text = `Invoice #${form.invoiceNumber}\nAmount: $${grandTotal.toFixed(2)}\nDue: ${form.dueDate}\nPayment ref: ${form.invoiceNumber}\nE-transfer: ${settings?.etransferEmail}`;
                  navigator.clipboard.writeText(text);
                  showToast('Copied to clipboard!');
                }}
                className="w-full btn btn-outline btn-sm justify-start"
              >
                <Copy size={14} /> Copy Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
