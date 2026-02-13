import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientStore } from '../store/clientStore';
import { ArrowLeft, Save } from 'lucide-react';

export const ClientForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id && id !== 'new';

  const clients = useClientStore((s) => s.clients);
  const addClient = useClientStore((s) => s.addClient);
  const updateClient = useClientStore((s) => s.updateClient);

  const [form, setForm] = useState({
    name: '',
    projectName: '',
    projectAddress: '',
    cityProvince: '',
    attention: '',
    email: '',
    phone: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const client = clients.find((c) => c.id === id);
      if (client) {
        setForm({
          name: client.name,
          projectName: client.projectName,
          projectAddress: client.projectAddress,
          cityProvince: client.cityProvince,
          attention: client.attention,
          email: client.email,
          phone: client.phone,
          notes: client.notes,
        });
      }
    }
  }, [isEditing, id, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      if (isEditing) {
        await updateClient(id!, form);
        navigate(`/clients/${id}`);
      } else {
        const client = await addClient(form);
        navigate(`/clients/${client.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <button onClick={() => navigate(-1)} className="btn btn-ghost mb-4">
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Client' : 'New Client'}
      </h1>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label className="form-label">Company / Client Name *</label>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Acme Construction Ltd."
                required
              />
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label">Project Name</label>
              <input
                type="text"
                className="form-input"
                value={form.projectName}
                onChange={(e) => updateField('projectName', e.target.value)}
                placeholder="e.g., Downtown Tower Phase 2"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Project Address</label>
              <input
                type="text"
                className="form-input"
                value={form.projectAddress}
                onChange={(e) => updateField('projectAddress', e.target.value)}
                placeholder="Street address"
              />
            </div>

            <div className="form-group">
              <label className="form-label">City, Province</label>
              <input
                type="text"
                className="form-input"
                value={form.cityProvince}
                onChange={(e) => updateField('cityProvince', e.target.value)}
                placeholder="e.g., Edmonton, AB"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attention (Contact Person)</label>
              <input
                type="text"
                className="form-input"
                value={form.attention}
                onChange={(e) => updateField('attention', e.target.value)}
                placeholder="Contact name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="client@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(780) 555-0123"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any additional notes about this client..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="submit" className="btn btn-primary" disabled={saving || !form.name.trim()}>
              <Save size={18} />
              {saving ? 'Saving...' : isEditing ? 'Update Client' : 'Add Client'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
