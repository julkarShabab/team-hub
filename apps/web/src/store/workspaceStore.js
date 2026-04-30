import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';

const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  members: [],
  isLoading: false,

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/workspaces');
      set({ workspaces: res.data.workspaces, isLoading: false });
      return res.data.workspaces;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  fetchWorkspace: async (id) => {
    const res = await api.get(`/workspaces/${id}`);
    set({
      currentWorkspace: res.data.workspace,
      members: res.data.workspace.members || [],
    });
    return res.data.workspace;
  },

  createWorkspace: async (data) => {
    const res = await api.post('/workspaces', data);
    const workspace = res.data.workspace;
    set((state) => ({ workspaces: [workspace, ...state.workspaces] }));
    return workspace;
  },

  updateWorkspace: async (id, data) => {
    // Optimistic update
    const prev = get().currentWorkspace;
    set((state) => ({
      currentWorkspace: state.currentWorkspace?.id === id
        ? { ...state.currentWorkspace, ...data }
        : state.currentWorkspace,
      workspaces: state.workspaces.map((w) => w.id === id ? { ...w, ...data } : w),
    }));

    try {
      const res = await api.put(`/workspaces/${id}`, data);
      return res.data.workspace;
    } catch (err) {
      // Rollback
      set((state) => ({
        currentWorkspace: state.currentWorkspace?.id === id ? prev : state.currentWorkspace,
        workspaces: state.workspaces.map((w) => w.id === id ? prev : w),
      }));
      toast.error('Failed to update workspace');
      throw err;
    }
  },

  inviteMember: async (workspaceId, email, role = 'MEMBER') => {
    const res = await api.post(`/workspaces/${workspaceId}/invite`, { email, role });
    if (res.data.member) {
      set((state) => ({ members: [...state.members, res.data.member] }));
    }
    return res.data;
  },

  updateMemberRole: async (workspaceId, userId, role) => {
    // Optimistic
    const prevMembers = get().members;
    set((state) => ({
      members: state.members.map((m) =>
        m.userId === userId ? { ...m, role } : m
      ),
    }));
    try {
      await api.put(`/workspaces/${workspaceId}/members/${userId}/role`, { role });
    } catch (err) {
      set({ members: prevMembers });
      toast.error('Failed to update role');
      throw err;
    }
  },

  removeMember: async (workspaceId, userId) => {
    const prevMembers = get().members;
    set((state) => ({ members: state.members.filter((m) => m.userId !== userId) }));
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
    } catch (err) {
      set({ members: prevMembers });
      toast.error('Failed to remove member');
      throw err;
    }
  },
}));

export default useWorkspaceStore;
