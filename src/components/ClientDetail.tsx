import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientStore } from '../store/clientStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { useSettingsStore } from '../store/settingsStore';
import { getGrandTotal } from '../types';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Edit2,
  Plus,
  FileText,
  Mail,
  Phone,
  MapPin,
  User,
} from 'lucide-react';

export const ClientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const client = useClientStore((s) => s.clients.find((c) => c.id === id));
  const allInvoices = useInvoiceStore((s) => s.invoices);
  const invoices = useMemo(() => allInvoices.filter((i) => i.clientId === id), [allInvoices, id]);
  const settings = useSettingsStore((s) => s.settings);
  const createBlankInvoice = useInvoiceStore((s) => s.createBlankInvoice);

  const gstRate = settings?.gstRate ?? 5;

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Client not found.</p>
        <button onClick={() => navigate('/clients')} className="btn btn-primary mt-4">
          Back to Clients
        </button>
      </div>
    );
  }

  const totalBilled = invoices.reduce(
    (sum, i) => sum + getGrandTotal(i.lineItems, i.discount, i.discountType, gstRate),
    0
  );
  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce(
      (sum, i) => sum + getGrandTotal(i.lineItems, i.discount, i.discountType, gstRate),
      0
    );
  const totalOutstanding = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce(
      (sum, i) => sum + getGrandTotal(i.lineItems, i.discount, i.discountType, gstRate),
      0
    );

  // Services summary: aggregate all line items across invoices
  const servicesMap = new Map<string, { hours: number; total: number }>();
  invoices.forEach((inv) => {
    inv.lineItems.forEach((item) => {
      if (!item.description) return;
      const existing = servicesMap.get(item.description) || { hours: 0, total: 0 };
      existing.hours += item.hours;
      existing.total += item.hours * item.unitPrice;
      servicesMap.set(item.description, existing);
    });
  });

  const handleNewInvoice = async () => {
    const inv = await createBlankInvoice(client.id);
    navigate(`/invoices/${inv.id}`);
  };

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate('/clients')} className="btn btn-ghost mb-4">
        <ArrowLeft size={18} /> Back to Clients
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          {client.projectName && (
            <p className="text-gray-500 mt-1">{client.projectName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/clients/${client.id}/edit`)} className="btn btn-outline">
            <Edit2 size={16} /> Edit
          </button>
          <button onClick={handleNewInvoice} className="btn btn-primary">
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-700">Client Information</h2>
          </div>
          <div className="card-body space-y-3 text-sm">
            {client.attention && (
              <div className="flex items-center gap-2 text-gray-600">
                <User size={14} className="text-gray-400" />
                <span>{client.attention}</span>
              </div>
            )}
            {client.projectAddress && (
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <div>{client.projectAddress}</div>
                  {client.cityProvince && <div>{client.cityProvince}</div>}
                </div>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={14} className="text-gray-400" />
                <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-gray-400" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Notes</p>
                <p className="text-gray-600">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="text-xs font-semibold text-gray-500 uppercase">Total Billed</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                ${totalBilled.toFixed(2)}
              </div>
            </div>
            <div className="stat-card">
              <div className="text-xs font-semibold text-gray-500 uppercase">Paid</div>
              <div className="text-xl font-bold text-green-600 mt-1">
                ${totalPaid.toFixed(2)}
              </div>
            </div>
            <div className="stat-card">
              <div className="text-xs font-semibold text-gray-500 uppercase">Outstanding</div>
              <div className="text-xl font-bold text-orange-600 mt-1">
                ${totalOutstanding.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Services Breakdown */}
          {servicesMap.size > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-sm font-semibold text-gray-700">Services Provided</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Total Hours</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(servicesMap.entries()).map(([desc, data]) => (
                      <tr key={desc}>
                        <td>{desc}</td>
                        <td>{data.hours.toFixed(1)}</td>
                        <td className="font-medium">${data.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invoice History */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Invoice History</h2>
              <span className="text-xs text-gray-400">{invoices.length} invoices</span>
            </div>
            {invoices.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p>No invoices yet for this client.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                      >
                        <td className="font-medium">#{inv.invoiceNumber}</td>
                        <td>{format(parseISO(inv.invoiceDate), 'MMM d, yyyy')}</td>
                        <td>{format(parseISO(inv.dueDate), 'MMM d, yyyy')}</td>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
