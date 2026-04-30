'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import useWorkspaceStore from '../../store/workspaceStore';

const ACCENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
];

export default function CreateWorkspaceModal({ onClose }) {
  const [form, setForm] = useState({ name: '', description: '', accentColor: '#6366f1' });
  const [loading, setLoading] = useState(false);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setLoading(true);
    try {
      const ws = await createWorkspace(form);
      setCurrentWorkspace(ws);
      toast.success('Workspace created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Workspace" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div>
          <label className="label">Workspace Name *</label>
          <input
            className="input"
            placeholder="Engineering Team"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="What is this workspace for?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Accent Color</label>
          <div className="flex gap-2 flex-wrap">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setForm({ ...form, accentColor: color })}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                  form.accentColor === color ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: form.accentColor }}
          >
            {form.name?.[0] || 'W'}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{form.name || 'Workspace Name'}</p>
            <p className="text-xs text-gray-400">{form.description || 'No description'}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
