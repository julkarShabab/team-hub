'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import useGoalStore from '../../store/goalStore';
import useAuthStore from '../../store/authStore';

const STATUS_OPTIONS = ['ON_TRACK', 'AT_RISK', 'COMPLETED', 'CANCELLED'];

export default function GoalModal({ workspaceId, goal, onClose }) {
  const isEdit = !!goal;
  const { user } = useAuthStore();
  const { createGoal, updateGoal } = useGoalStore();

  const [form, setForm] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    status: goal?.status || 'ON_TRACK',
    dueDate: goal?.dueDate ? new Date(goal.dueDate).toISOString().split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await updateGoal(goal.id, form);
        toast.success('Goal updated');
      } else {
        await createGoal(workspaceId, form, user);
        toast.success('Goal created!');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit Goal' : 'Create Goal'} onClose={onClose}>
      <div className="p-5 space-y-4">
        <div>
          <label className="label">Title *</label>
          <input
            className="input"
            placeholder="e.g. Launch v2.0 by Q2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="What does success look like?"
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
            <label className="label">Due Date</label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Goal'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
