'use client';
import { useEffect, useState } from 'react';
import { UserPlus, Shield, User, Trash2, Mail, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import useWorkspaceStore from '../../../store/workspaceStore';
import useAuthStore from '../../../store/authStore';
import Avatar from '../../../components/Avatar';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@team-hub/shared';

const ROLE_BADGES = {
  ADMIN: { label: 'Admin', icon: Crown, class: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' },
  MEMBER: { label: 'Member', icon: User, class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const PERMISSION_LABELS = {
  CREATE_GOAL: 'Create Goals',
  EDIT_GOAL: 'Edit Goals',
  DELETE_GOAL: 'Delete Goals',
  POST_ANNOUNCEMENT: 'Post Announcements',
  PIN_ANNOUNCEMENT: 'Pin Announcements',
  INVITE_MEMBER: 'Invite Members',
  REMOVE_MEMBER: 'Remove Members',
  CHANGE_ROLE: 'Change Roles',
  CREATE_ACTION_ITEM: 'Create Action Items',
  EDIT_ANY_ACTION_ITEM: 'Edit Any Action Item',
  EDIT_WORKSPACE: 'Edit Workspace',
  EXPORT_DATA: 'Export Data',
};

export default function MembersPage() {
  const { currentWorkspace, members, fetchWorkspace, inviteMember, updateMemberRole, removeMember } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [showPermMatrix, setShowPermMatrix] = useState(false);

  const myMembership = members?.find((m) => m.userId === user?.id || m.user?.id === user?.id);
  const myRole = myMembership?.role || 'MEMBER';
  const isAdmin = myRole === 'ADMIN';

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspace(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteMember(currentWorkspace.id, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateMemberRole(currentWorkspace.id, userId, newRole);
      toast.success('Role updated');
    } catch {}
  };

  const handleRemove = async (userId, name) => {
    if (!confirm(`Remove ${name} from this workspace?`)) return;
    try {
      await removeMember(currentWorkspace.id, userId);
      toast.success('Member removed');
    } catch {}
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Members</h1>
          <p className="text-gray-500 text-sm mt-1">{members?.length || 0} members in this workspace</p>
        </div>
        <button
          onClick={() => setShowPermMatrix(!showPermMatrix)}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Shield size={16} /> Permission Matrix
        </button>
      </div>

      {/* Permission Matrix */}
      {showPermMatrix && (
        <div className="card p-5 mb-6 overflow-x-auto animate-slide-in">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Role Permissions</h3>
          <table className="text-sm w-full">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 font-medium text-gray-500">Permission</th>
                <th className="text-center py-2 px-4 font-medium text-brand-500">Admin</th>
                <th className="text-center py-2 px-4 font-medium text-gray-500">Member</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(PERMISSION_LABELS).map(([perm, label]) => (
                <tr key={perm} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{label}</td>
                  <td className="py-2 px-4 text-center">
                    {ROLE_PERMISSIONS.ADMIN.includes(perm) ? '✅' : '—'}
                  </td>
                  <td className="py-2 px-4 text-center">
                    {ROLE_PERMISSIONS.MEMBER.includes(perm) ? '✅' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite form */}
      {isAdmin && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus size={18} className="text-brand-500" />
            Invite Member
          </h3>
          <div className="flex gap-3">
            <input
              type="email"
              className="input flex-1"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="input w-32"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="btn-primary px-5"
            >
              {inviting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="card overflow-hidden">
        {members?.map((m, idx) => {
          const memberUser = m.user || m;
          const userId = m.userId || m.user?.id;
          const role = m.role;
          const isMe = userId === user?.id;
          const roleCfg = ROLE_BADGES[role] || ROLE_BADGES.MEMBER;

          return (
            <div
              key={m.id || idx}
              className={`flex items-center gap-4 p-4 ${idx !== members.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
            >
              <Avatar user={memberUser} size="md" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">{memberUser?.name}</p>
                  {isMe && <span className="text-xs text-gray-400">(you)</span>}
                </div>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Mail size={12} />
                  {memberUser?.email}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleCfg.class}`}>
                  <roleCfg.icon size={12} />
                  {roleCfg.label}
                </span>

                {isAdmin && !isMe && (
                  <div className="flex items-center gap-2">
                    <select
                      value={role}
                      onChange={(e) => handleRoleChange(userId, e.target.value)}
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemove(userId, memberUser?.name)}
                      className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
