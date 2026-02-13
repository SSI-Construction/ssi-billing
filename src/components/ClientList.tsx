import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientStore } from '../store/clientStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { useSettingsStore } from '../store/settingsStore';
import { getGrandTotal } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  Users,
  X,
} from 'lucide-react';

export const ClientList: React.FC = () => {
  const navigate = useNavigate();
  const clients = useClientStore((s) => s.clients);
  const deleteClient = useClientStore((s) => s.deleteClient);
  const invoices = useInvoiceStore((s) => s.invoices);
  const settings = useSettingsStore((s) => s.settings);
  const [search, setSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const gstRate = settings?.gstRate ?? 5;

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.projectName.toLowerCase().includes(search.toLowerCase()) ||
      c.attention.toLowerCase().includes(search.toLowerCase())
  );

  const getClientStats = (clientId: string) => {
    const clientInvoices = invoices.filter((i) => i.clientId === clientId);
    const totalBilled = clientInvoices.reduce(
      (sum, i) => sum + getGrandTotal(i.lineItems, i.discount, i.discountType, gstRate),
      0
    );
    const outstanding = clientInvoices
      .filter((i) => i.status === 'sent' || i.status === 'overdue')
      .reduce(
        (sum, i) => sum + getGrandTotal(i.lineItems, i.discount, i.discountType, gstRate),
        0
      );
    return { count: clientInvoices.length, totalBilled, outstanding };
  };

  const handleDelete = async (id: string) => {
    const clientInvoices = invoices.filter((i) => i.clientId === id);
    if (clientInvoices.length > 0) {
      alert('Cannot delete a client that has invoices. Delete the invoices first.');
      return;
    }
    await deleteClient(id);
    setShowDeleteConfirm(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} total clients</p>
        </div>
        <button onClick={() => navigate('/clients/new')} className="btn btn-primary">
          <Plus size={18} />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          className="form-input pl-10"
          placeholder="Search clients by name, project, or contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Client Grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {search ? 'No clients match your search' : 'No clients yet'}
          </h3>
          <p className="text-gray-400 mb-4">
            {search ? 'Try a different search term' : 'Add your first client to get started'}
          </p>
          {!search && (
            <button onClick={() => navigate('/clients/new')} className="btn btn-primary">
              <Plus size={18} /> Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => {
            const stats = getClientStats(client.id);
            return (
              <div
                key={client.id}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.name}</h3>
                      {client.projectName && (
                        <p className="text-sm text-gray-500">{client.projectName}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients/${client.id}/edit`);
                        }}
                        className="btn btn-ghost btn-sm p-1"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(client.id);
                        }}
                        className="btn btn-ghost btn-sm p-1 text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {client.attention && (
                    <p className="text-xs text-gray-500 mb-2">Attn: {client.attention}</p>
                  )}

                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <FileText size={12} />
                      <span>{stats.count} invoices</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Billed: ${stats.totalBilled.toFixed(2)}
                    </div>
                    {stats.outstanding > 0 && (
                      <div className="text-xs text-orange-600 font-medium">
                        Owing: ${stats.outstanding.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal max-w-sm animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Client?</h3>
              <p className="text-gray-500 text-sm mb-4">
                This action cannot be undone. All client data will be permanently removed.
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
