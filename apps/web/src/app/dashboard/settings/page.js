'use client';
import { useState, useRef } from 'react';
import { Camera, Save, User } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../../store/authStore';
import Avatar from '../../../components/Avatar';
import api from '../../../lib/api';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleSaveName = async () => {
    if (!name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const res = await api.put('/users/profile', { name });
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.user);
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User size={18} className="text-brand-500" />
          Profile
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <Avatar user={user} size="lg" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white hover:bg-brand-600 transition-colors shadow-md"
            >
              {uploading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={12} />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1">Click the camera icon to change your avatar</p>
          </div>
        </div>

        {/* Name field */}
        <div className="space-y-4">
          <div>
            <label className="label">Display Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              className="input bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
              value={user?.email || ''}
              disabled
              title="Email cannot be changed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          <button
            onClick={handleSaveName}
            disabled={saving || name === user?.name}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* App info */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">About</h2>
        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono text-gray-700 dark:text-gray-300">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Advanced Features</span>
            <span className="text-brand-500 font-medium">Optimistic UI + Advanced RBAC</span>
          </div>
          <div className="flex justify-between">
            <span>Tech Stack</span>
            <span className="text-gray-700 dark:text-gray-300">Next.js · Express · PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
