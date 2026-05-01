'use client';
import { useEffect, useState } from 'react';
import { Plus, Pin, Trash2, MessageSquare, Smile } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import useWorkspaceStore from '../../../store/workspaceStore';
import useAuthStore from '../../../store/authStore';
import api from '../../../lib/api';
import Avatar from '../../../components/Avatar';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../../../lib/constants';

const EMOJI_LIST = ['👍', '❤️', '🎉', '🚀', '👏', '🔥'];

export default function AnnouncementsPage() {
  const { currentWorkspace, members } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: '', content: '' });
  const [commentInputs, setCommentInputs] = useState({});
  const [showEmojiFor, setShowEmojiFor] = useState(null);

  const myMembership = members?.find((m) => m.userId === user?.id || m.user?.id === user?.id);
  const myRole = myMembership?.role || 'MEMBER';
  const canPost = ROLE_PERMISSIONS[myRole]?.includes(PERMISSIONS.POST_ANNOUNCEMENT);

  const fetchAnnouncements = async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/announcements/workspace/${currentWorkspace.id}`);
      setAnnouncements(res.data.announcements);
    } catch (err) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, [currentWorkspace?.id]);

  const handleCreate = async () => {
    if (!newAnn.title.trim() || !newAnn.content.trim()) return;
    try {
      const res = await api.post(`/announcements/workspace/${currentWorkspace.id}`, newAnn);
      setAnnouncements([res.data.announcement, ...announcements]);
      setNewAnn({ title: '', content: '' });
      setShowCreate(false);
      toast.success('Announcement posted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post');
    }
  };

  const handlePin = async (id) => {
    try {
      const res = await api.put(`/announcements/${id}/pin`);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, pinned: res.data.announcement.pinned } : a))
          .sort((a, b) => b.pinned - a.pinned)
      );
    } catch (err) {
      toast.error('Failed to pin');
    }
  };

  const handleReact = async (annId, emoji) => {
    try {
      const res = await api.post(`/announcements/${annId}/react`, { emoji });
      setAnnouncements((prev) =>
        prev.map((a) => a.id === annId ? { ...a, reactions: res.data.reactions } : a)
      );
      setShowEmojiFor(null);
    } catch {}
  };

  const handleComment = async (annId) => {
    const content = commentInputs[annId]?.trim();
    if (!content) return;
    try {
      const res = await api.post(`/announcements/${annId}/comments`, { content });
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === annId ? { ...a, comments: [...(a.comments || []), res.data.comment] } : a
        )
      );
      setCommentInputs((prev) => ({ ...prev, [annId]: '' }));
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success('Deleted');
    } catch {}
  };

  // Group reactions
  const groupReactions = (reactions = []) => {
    const grouped = {};
    reactions.forEach((r) => {
      grouped[r.emoji] = (grouped[r.emoji] || 0) + 1;
    });
    return Object.entries(grouped);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
        {canPost && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Post
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-5 mb-6 animate-slide-in">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">New Announcement</h3>
          <input
            className="input mb-3"
            placeholder="Title"
            value={newAnn.title}
            onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
          />
          <textarea
            className="input mb-3 min-h-24 resize-none"
            placeholder="Write your announcement... (use @name to mention someone)"
            value={newAnn.content}
            onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary">Post Announcement</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Announcements list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann.id} className={`card p-5 ${ann.pinned ? 'ring-2 ring-brand-200 dark:ring-brand-800' : ''}`}>
              {ann.pinned && (
                <div className="flex items-center gap-1 text-xs text-brand-500 font-medium mb-2">
                  <Pin size={12} /> Pinned
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar user={ann.author} size="sm" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{ann.title}</p>
                    <p className="text-xs text-gray-400">
                      {ann.author?.name} · {format(new Date(ann.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {myRole === 'ADMIN' && (
                    <button
                      onClick={() => handlePin(ann.id)}
                      className={`p-1.5 rounded transition-colors ${ann.pinned ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Pin size={14} />
                    </button>
                  )}
                  {(myRole === 'ADMIN' || ann.authorId === user?.id) && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 rounded text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line mb-3">
                {ann.content}
              </p>

              {/* Reactions */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {groupReactions(ann.reactions).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(ann.id, emoji)}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  >
                    {emoji} <span className="text-xs text-gray-500">{count}</span>
                  </button>
                ))}

                <div className="relative">
                  <button
                    onClick={() => setShowEmojiFor(showEmojiFor === ann.id ? null : ann.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-brand-500 transition-colors text-sm"
                  >
                    <Smile size={14} />
                  </button>
                  {showEmojiFor === ann.id && (
                    <div className="absolute bottom-full mb-1 left-0 flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg z-10">
                      {EMOJI_LIST.map((e) => (
                        <button key={e} onClick={() => handleReact(ann.id, e)} className="text-lg hover:scale-125 transition-transform">
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Comments */}
              {ann.comments?.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mb-3 space-y-2">
                  {ann.comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <Avatar user={c.user} size="xs" />
                      <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.user.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment input */}
              <div className="flex gap-2">
                <Avatar user={user} size="xs" />
                <input
                  className="input flex-1 text-sm py-1.5"
                  placeholder="Write a comment... (@mention to notify)"
                  value={commentInputs[ann.id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [ann.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(ann.id)}
                />
                <button
                  onClick={() => handleComment(ann.id)}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  Post
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
