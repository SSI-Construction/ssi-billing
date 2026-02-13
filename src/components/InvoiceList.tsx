import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceStore } from '../store/invoiceStore';
import { useClientStore } from '../store/clientStore';
import { useSettingsStore } from '../store/settingsStore';
import { getGrandTotal } from '../types';
import { format, parseISO } from 'date-fns';
import {
  Plus,
  Search,
  FileText,
  Trash2,
  X,
} from 'lucide-react';

type StatusFilter = 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const invoices = useInvoiceStore((s) => s.invoices);
  const deleteInvoice = useInvoiceStore((s) => s.deleteInvoice);
  const createBlankInvoice = useInvoiceStore((s) => s.createBlankInvoice);
  const clients = useClientStore((s) => s.clients);
  const settings = useSettingsStore((s) => s.settings);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const gstRate = settings?.gstRate ?? 5;

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name || 'Unknown Client';

  const filtered = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesSearch =
      !search ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      getClientName(inv.clientId).toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
    cancelled: invoices.filter((i) => i.status === 'cancelled').length,
  };

  const handleNewInvoice = async () => {
    const inv = await createBlankInvoice();
    navigate(`/invoices/${inv.id}`);
  };

  const handleDelete = async (id: string) => {
    await deleteInvoice(id);
    setShowDeleteConfirm(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">{invoices.length} total invoices</p>
        </div>
        <button onClick={handleNewInvoice} className="btn btn-primary">
          <Plus size={18} />
          New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 relative min-w-64">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Search by invoice # or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'draft', 'sent', 'paid', 'overdue'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {statusCounts[status] > 0 && (
                <span className="ml-1.5 text-gray-400">({statusCounts[status]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {search || statusFilter !== 'all' ? 'No matching invoices' : 'No invoices yet'}
          </h3>
          <p className="text-gray-400 mb-4">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first invoice to get started'}
          </p>
          {!search && statusFilter === 'all' && (
            <button onClick={handleNewInvoice} className="btn btn-primary">
              <Plus size={18} /> Create Invoice
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const amount = getGrandTotal(
                    inv.lineItems,
                    inv.discount,
                    inv.discountType,
                    gstRate
                  );
                  return (
                    <tr
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className="font-medium">#{inv.invoiceNumber}</td>
                      <td>{getClientName(inv.clientId)}</td>
                      <td>{format(parseISO(inv.invoiceDate), 'MMM d, yyyy')}</td>
                      <td>{format(parseISO(inv.dueDate), 'MMM d, yyyy')}</td>
                      <td className="font-semibold">${amount.toFixed(2)}</td>
                      <td>
                        <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(inv.id);
                          }}
                          className="btn btn-ghost btn-sm p-1 text-red-500"
                          title="Delete invoice"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal max-w-sm animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Invoice?</h3>
              <p className="text-gray-500 text-sm mb-4">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowDeleteConfirm(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button onClick={() => handleDelete(showDeleteConfirm)} className="btn btn-danger">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
