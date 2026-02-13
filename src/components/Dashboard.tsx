import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceStore } from '../store/invoiceStore';
import { useClientStore } from '../store/clientStore';
import { useReminderStore } from '../store/reminderStore';
import { useSettingsStore } from '../store/settingsStore';
import { getGrandTotal } from '../types';
import { format, parseISO } from 'date-fns';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  FileText,
  TrendingUp,
  Users,
  ArrowRight,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const invoices = useInvoiceStore((s) => s.invoices);
  const clients = useClientStore((s) => s.clients);
  const reminders = useReminderStore((s) => s.reminders);
  const settings = useSettingsStore((s) => s.settings);
  const createBlankInvoice = useInvoiceStore((s) => s.createBlankInvoice);

  const gstRate = settings?.gstRate ?? 5;

  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + getGrandTotal(i.lineItems, i.discount, i.discountType, gstRate), 0);

  const pendingAmount = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + getGrandTotal(i.lineItems, i.discount, i.discountType, gstRate), 0);

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const overdueAmount = overdueInvoices.reduce(
    (sum, i) => sum + getGrandTotal(i.lineItems, i.discount, i.discountType, gstRate),
    0
  );

  const draftInvoices = invoices.filter((i) => i.status === 'draft');
  const pendingReminders = reminders.filter((r) => !r.completed);

  const recentInvoices = invoices.slice(0, 5);

  // This month's revenue
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthRevenue = invoices
    .filter((i) => i.status === 'paid' && i.paidDate && i.paidDate >= thisMonthStart)
    .reduce((sum, i) => sum + getGrandTotal(i.lineItems, i.discount, i.discountType, gstRate), 0);

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name || 'Unknown Client';

  const handleNewInvoice = async () => {
    const inv = await createBlankInvoice();
    navigate(`/invoices/${inv.id}`);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back! Here's your billing overview.
          </p>
        </div>
        <button onClick={handleNewInvoice} className="btn btn-primary btn-lg">
          <Plus size={20} />
          New Invoice
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Revenue</span>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-gray-500 mt-1">
            ${thisMonthRevenue.toLocaleString('en-CA', { minimumFractionDigits: 2 })} this month
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending</span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">${pendingAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-gray-500 mt-1">
            {invoices.filter((i) => i.status === 'sent').length} invoice(s) awaiting payment
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Overdue</span>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">${overdueAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-gray-500 mt-1">
            {overdueInvoices.length} overdue invoice(s)
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Clients</span>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
          <div className="text-xs text-gray-500 mt-1">
            {invoices.length} total invoices
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            <button onClick={() => navigate('/invoices')} className="btn btn-ghost btn-sm">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p>No invoices yet. Create your first invoice!</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className="font-medium">#{inv.invoiceNumber}</td>
                      <td>{getClientName(inv.clientId)}</td>
                      <td>{format(parseISO(inv.invoiceDate), 'MMM d, yyyy')}</td>
                      <td className="font-medium">
                        ${getGrandTotal(inv.lineItems, inv.discount, inv.discountType, gstRate).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar: Reminders & Action Items */}
        <div className="space-y-6">
          {/* Drafts needing attention */}
          {draftInvoices.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" />
                  Draft Invoices ({draftInvoices.length})
                </h3>
              </div>
              <div className="card-body p-0">
                {draftInvoices.slice(0, 3).map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">#{inv.invoiceNumber}</div>
                    <div className="text-xs text-gray-500">{getClientName(inv.clientId)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Invoices */}
          {overdueInvoices.length > 0 && (
            <div className="card border-red-200">
              <div className="card-header bg-red-50">
                <h3 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  Overdue ({overdueInvoices.length})
                </h3>
              </div>
              <div className="card-body p-0">
                {overdueInvoices.slice(0, 3).map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    className="w-full text-left px-4 py-3 hover:bg-red-50/50 border-b border-gray-50 last:border-0 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">#{inv.invoiceNumber}</div>
                    <div className="text-xs text-gray-500">
                      Due: {format(parseISO(inv.dueDate), 'MMM d, yyyy')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pending Reminders */}
          {pendingReminders.length > 0 && (
            <div className="card border-yellow-200">
              <div className="card-header bg-yellow-50">
                <h3 className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                  <TrendingUp size={16} className="text-yellow-600" />
                  Reminders ({pendingReminders.length})
                </h3>
              </div>
              <div className="card-body p-0">
                {pendingReminders.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="px-4 py-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="text-sm text-gray-900">{r.notes || r.type}</div>
                    <div className="text-xs text-gray-500">
                      {format(parseISO(r.dueDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Quick Actions
              </h3>
            </div>
            <div className="card-body space-y-2">
              <button
                onClick={handleNewInvoice}
                className="w-full btn btn-outline btn-sm justify-start"
              >
                <Plus size={16} /> Create New Invoice
              </button>
              <button
                onClick={() => navigate('/clients')}
                className="w-full btn btn-outline btn-sm justify-start"
              >
                <Users size={16} /> Manage Clients
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="w-full btn btn-outline btn-sm justify-start"
              >
                <TrendingUp size={16} /> View Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
