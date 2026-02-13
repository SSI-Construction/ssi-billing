import React, { useState } from 'react';
import { useServiceTemplateStore } from '../store/serviceTemplateStore';
import { Plus, Edit2, Trash2, Wrench, Save, X } from 'lucide-react';

export const ServiceTemplates: React.FC = () => {
  const templates = useServiceTemplateStore((s) => s.templates);
  const addTemplate = useServiceTemplateStore((s) => s.addTemplate);
  const updateTemplate = useServiceTemplateStore((s) => s.updateTemplate);
  const deleteTemplate = useServiceTemplateStore((s) => s.deleteTemplate);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', defaultRate: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ name: '', description: '', defaultRate: 0 });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (id: string) => {
    const t = templates.find((t) => t.id === id);
    if (!t) return;
    setForm({ name: t.name, description: t.description, defaultRate: t.defaultRate });
    setEditingId(id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setError(null);
    try {
      if (editingId) {
        await updateTemplate(editingId, form);
      } else {
        await addTemplate(form);
      }
      resetForm();
    } catch (err) {
      setError('Failed to save template. Please try again.');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    setShowDeleteConfirm(null);
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Templates</h1>
          <p className="text-gray-500 text-sm mt-1">
            Define reusable service descriptions with default hourly rates.
            These can be quickly added to invoices.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} /> Add Template
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6 animate-slide-in">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              {editingId ? 'Edit Template' : 'New Service Template'}
            </h2>
            <button onClick={resetForm} className="btn btn-ghost btn-sm p-1">
              <X size={16} />
            </button>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Service Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Project Management"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description for invoice line item"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Default Rate ($/hr)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.defaultRate || ''}
                  onChange={(e) =>
                    setForm({ ...form, defaultRate: parseFloat(e.target.value) || 0 })
                  }
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              {error && (
                <p className="text-red-500 text-sm self-center mr-auto">{error}</p>
              )}
              <button onClick={handleSave} className="btn btn-primary" disabled={!form.name.trim()}>
                <Save size={16} /> {editingId ? 'Update' : 'Add'} Template
              </button>
              <button onClick={resetForm} className="btn btn-outline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template List */}
      {templates.length === 0 ? (
        <div className="card p-12 text-center">
          <Wrench size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No service templates yet</h3>
          <p className="text-gray-400 mb-4">
            Create templates for services you commonly provide. They'll appear as
            quick-add options when creating invoices.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus size={18} /> Create First Template
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Description</th>
                <th>Rate ($/hr)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.name}</td>
                  <td className="text-gray-500">{t.description || '-'}</td>
                  <td className="font-medium">${t.defaultRate.toFixed(2)}</td>
                  <td className="text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => handleEdit(t.id)}
                        className="btn btn-ghost btn-sm p-1"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(t.id)}
                        className="btn btn-ghost btn-sm p-1 text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal max-w-sm animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Template?</h3>
              <p className="text-gray-500 text-sm mb-4">This won't affect existing invoices.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowDeleteConfirm(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="btn btn-danger"
                >
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
