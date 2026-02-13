import React, { useState } from 'react';
import { useReminderStore } from '../store/reminderStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { useClientStore } from '../store/clientStore';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Bell,
  Plus,
  CheckCircle,
  Trash2,
  Clock,
  AlertTriangle,
  Send,
  X,
  Save,
} from 'lucide-react';

export const Reminders: React.FC = () => {
  const navigate = useNavigate();
  const reminders = useReminderStore((s) => s.reminders);
  const addReminder = useReminderStore((s) => s.addReminder);
  const completeReminder = useReminderStore((s) => s.completeReminder);
  const deleteReminder = useReminderStore((s) => s.deleteReminder);
  const invoices = useInvoiceStore((s) => s.invoices);
  const clients = useClientStore((s) => s.clients);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    invoiceId: '',
    type: 'send' as 'send' | 'overdue' | 'followup',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const today = new Date().toISOString().split('T')[0];

  const getInvoiceLabel = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return 'Unknown Invoice';
    const client = clients.find((c) => c.id === inv.clientId);
    return `#${inv.invoiceNumber} - ${client?.name || 'Unknown'}`;
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'pending') return !r.completed;
    if (filter === 'completed') return r.completed;
    return true;
  });

  const overdueReminders = reminders.filter(
    (r) => !r.completed && r.dueDate < today
  );
  const upcomingReminders = reminders.filter(
    (r) => !r.completed && r.dueDate >= today
  );

  const handleSave = async () => {
    await addReminder({
      ...form,
      completed: false,
    });
    setForm({
      invoiceId: '',
      type: 'send',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setShowForm(false);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <Send size={14} className="text-blue-500" />;
      case 'overdue':
        return <AlertTriangle size={14} className="text-red-500" />;
      case 'followup':
        return <Clock size={14} className="text-yellow-500" />;
      default:
        return <Bell size={14} className="text-gray-500" />;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'send': return 'Send Invoice';
      case 'overdue': return 'Overdue Follow-up';
      case 'followup': return 'Follow Up';
      default: return type;
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track when to send invoices and follow up on payments
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={18} /> Add Reminder
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-xs font-semibold text-gray-500 uppercase">Overdue</div>
          <div className="text-xl font-bold text-red-600 mt-1">{overdueReminders.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-semibold text-gray-500 uppercase">Upcoming</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{upcomingReminders.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-semibold text-gray-500 uppercase">Completed</div>
          <div className="text-xl font-bold text-green-600 mt-1">
            {reminders.filter((r) => r.completed).length}
          </div>
        </div>
      </div>

      {/* New Reminder Form */}
      {showForm && (
        <div className="card mb-6 animate-slide-in">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">New Reminder</h2>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm p-1">
              <X size={16} />
            </button>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Invoice</label>
                <select
                  className="form-input form-select"
                  value={form.invoiceId}
                  onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
                >
                  <option value="">Select an invoice (optional)...</option>
                  {invoices
                    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {getInvoiceLabel(inv.id)}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-input form-select"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as 'send' | 'overdue' | 'followup' })
                  }
                >
                  <option value="send">Send Invoice</option>
                  <option value="overdue">Overdue Follow-up</option>
                  <option value="followup">Follow Up</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Reminder details..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button onClick={handleSave} className="btn btn-primary">
                <Save size={16} /> Save Reminder
              </button>
              <button onClick={() => setShowForm(false)} className="btn btn-outline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {(['pending', 'all', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {filter === 'pending' ? 'No pending reminders' : 'No reminders'}
          </h3>
          <p className="text-gray-400">
            {filter === 'pending'
              ? "You're all caught up!"
              : 'Create a reminder to keep track of invoice deadlines.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredReminders.map((r) => (
            <div
              key={r.id}
              className={`card transition-all ${
                r.completed ? 'opacity-60' : ''
              } ${!r.completed && r.dueDate < today ? 'border-red-200 bg-red-50/30' : ''}`}
            >
              <div className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0">
                  {r.completed ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : (
                    typeIcon(r.type)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {typeLabel(r.type)}
                    </span>
                    {!r.completed && r.dueDate < today && (
                      <span className="badge badge-overdue text-xs">Overdue</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {r.invoiceId && (
                      <button
                        onClick={() => {
                          const inv = invoices.find((i) => i.id === r.invoiceId);
                          if (inv) navigate(`/invoices/${inv.id}`);
                        }}
                        className="text-primary hover:underline"
                      >
                        {getInvoiceLabel(r.invoiceId)}
                      </button>
                    )}
                    {r.notes && <span className="ml-2">— {r.notes}</span>}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {format(parseISO(r.dueDate), 'MMM d, yyyy')}
                </div>
                <div className="flex gap-1">
                  {!r.completed && (
                    <button
                      onClick={() => completeReminder(r.id)}
                      className="btn btn-ghost btn-sm text-green-600"
                      title="Mark complete"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteReminder(r.id)}
                    className="btn btn-ghost btn-sm text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
