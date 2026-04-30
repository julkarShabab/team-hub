'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import useActionItemStore from '../../store/actionItemStore';
import useWorkspaceStore from '../../store/workspaceStore';
import useGoalStore from '../../store/goalStore';
import useAuthStore from '../../store/authStore';

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];
const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE'];

export default function ActionItemModal({ workspaceId, item, onClose }) {
  const isEdit = !!item;
  const { user } = useAuthStore();
  const { members } = useWorkspaceStore();
  const { goals } = useGoalStore();
  const { createItem, updateItem } = useActionItemStore();

  const [form, setForm] = useState({
    title: item?.title || '',
    description: item?.description || '',
    status: item?.status || 'TODO',
    priority: item?.priority || 'MEDIUM',
    assigneeId: item?.assignee?.id || item?.assigneeId || '',
    goalId: item?.goal?.id || item?.goalId || '',
    dueDate: item?.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        assigneeId: form.assigneeId || null,
        goalId: form.goalId || null,
        dueDate: form.dueDate || null,
      };

      if (isEdit) {
        await updateItem(item.id, payload);
        toast.success('Updated');
      } else {
        await createItem(workspaceId, payload, user);
        toast.success('Action item created!');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit Action Item' : 'New Action Item'} onClose={onClose}>
      <div className="p-5 space-y-4">
        <div>
          <label className="label">Title *</label>
          <input
            className="input"
            placeholder="e.g. Write API tests"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Add more context..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Priority</label>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Assignee</label>
            <select
              className="input"
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {members?.map((m) => {
                const u = m.user || m;
                const uid = m.userId || m.user?.id || m.id;
                return (
                  <option key={uid} value={uid}>{u.name}</option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
        </div>

        {goals?.length > 0 && (
          <div>
            <label className="label">Linked Goal</label>
            <select
              className="input"
              value={form.goalId}
              onChange={(e) => setForm({ ...form, goalId: e.target.value })}
            >
              <option value="">No goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Item'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
