import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { CompanySettings } from '../types';
import { Save, Building2, Download, Upload } from 'lucide-react';
import { db } from '../store/db';

export const Settings: React.FC = () => {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [form, setForm] = useState<Partial<CompanySettings>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setForm({ ...settings });
    }
  }, [settings]);

  const handleExport = async () => {
    try {
      const [clients, invoices, serviceTemplates, allSettings, reminders] = await Promise.all([
        db.clients.toArray(),
        db.invoices.toArray(),
        db.serviceTemplates.toArray(),
        db.settings.toArray(),
        db.reminders.toArray(),
      ]);
      const backup = {
        exportedAt: new Date().toISOString(),
        version: 1,
        clients,
        invoices,
        serviceTemplates,
        settings: allSettings,
        reminders,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ssi-billing-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setToast(`Exported ${clients.length} clients, ${invoices.length} invoices, ${serviceTemplates.length} templates, ${reminders.length} reminders`);
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      console.error('Export failed:', err);
      setToast('Export failed — check console for details');
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.version || !data.exportedAt) {
        throw new Error('Invalid backup file format');
      }
      await db.transaction('rw', [db.clients, db.invoices, db.serviceTemplates, db.settings, db.reminders], async () => {
        if (data.clients?.length) await db.clients.bulkPut(data.clients);
        if (data.invoices?.length) await db.invoices.bulkPut(data.invoices);
        if (data.serviceTemplates?.length) await db.serviceTemplates.bulkPut(data.serviceTemplates);
        if (data.settings?.length) await db.settings.bulkPut(data.settings);
        if (data.reminders?.length) await db.reminders.bulkPut(data.reminders);
      });
      setToast(`Imported ${data.clients?.length || 0} clients, ${data.invoices?.length || 0} invoices`);
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      console.error('Import failed:', err);
      setToast('Import failed — invalid file or format');
      setTimeout(() => setToast(null), 5000);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      setToast('Settings saved!');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof CompanySettings, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (!settings) return null;

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure your company details and invoice defaults
          </p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Company Info */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Building2 size={18} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Company Information</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group md:col-span-2">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.companyName || ''}
                  onChange={(e) => updateField('companyName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">City, Province, Postal Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.cityProvince || ''}
                  onChange={(e) => updateField('cityProvince', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.contactEmail || ''}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={form.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tax & Payment */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-700">Tax & Payment Details</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.gstNumber || ''}
                  onChange={(e) => updateField('gstNumber', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">GST Rate (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.gstRate ?? 5}
                  onChange={(e) => updateField('gstRate', parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Beneficiary Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.beneficiaryName || ''}
                  onChange={(e) => updateField('beneficiaryName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cheque Payable To</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.chequePayableTo || ''}
                  onChange={(e) => updateField('chequePayableTo', e.target.value)}
                />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">E-Transfer Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.etransferEmail || ''}
                  onChange={(e) => updateField('etransferEmail', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Defaults */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-700">Invoice Defaults</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Invoice Prefix</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.invoicePrefix || ''}
                  onChange={(e) => updateField('invoicePrefix', e.target.value)}
                  placeholder="e.g., SSI, INV (leave blank for numbers only)"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Preview: {form.invoicePrefix ? `${form.invoicePrefix}-` : ''}{String(form.nextInvoiceNumber || 1).padStart(4, '0')}
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Next Invoice Number</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.nextInvoiceNumber ?? 1}
                  onChange={(e) => updateField('nextInvoiceNumber', parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Default Payment Terms (days)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.defaultPaymentTermDays ?? 21}
                  onChange={(e) => updateField('defaultPaymentTermDays', parseInt(e.target.value) || 21)}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Default Hourly Rate ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.defaultHourlyRate ?? 0}
                  onChange={(e) => updateField('defaultHourlyRate', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Data Management */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-700">Data Management</h2>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-500 mb-4">
              Export all your data (clients, invoices, templates, reminders, settings) as a JSON backup file, or restore from a previous backup.
            </p>
            <div className="flex gap-3">
              <button onClick={handleExport} className="btn btn-primary">
                <Download size={18} /> Export All Data
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={importing}
              >
                <Upload size={18} /> {importing ? 'Importing...' : 'Import Backup'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast toast-success">{toast}</div>
      )}
    </div>
  );
};
