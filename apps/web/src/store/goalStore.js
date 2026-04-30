import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const useGoalStore = create((set, get) => ({
  goals: [],
  currentGoal: null,
  isLoading: false,

  fetchGoals: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/goals/workspace/${workspaceId}`);
      set({ goals: res.data.goals, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  fetchGoal: async (goalId) => {
    const res = await api.get(`/goals/${goalId}`);
    set({ currentGoal: res.data.goal });
    return res.data.goal;
  },

  // ── Optimistic create ──────────────────────────────────────────────────────
  createGoal: async (workspaceId, data, currentUser) => {
    const tempId = `temp-${uuidv4()}`;
    const optimistic = {
      id: tempId,
      ...data,
      workspaceId,
      ownerId: currentUser.id,
      owner: currentUser,
      milestones: [],
      _count: { actionItems: 0, progressUpdates: 0 },
      status: data.status || 'ON_TRACK',
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };

    set((state) => ({ goals: [optimistic, ...state.goals] }));

    try {
      const res = await api.post(`/goals/workspace/${workspaceId}`, data);
      // Replace optimistic with real
      set((state) => ({
        goals: state.goals.map((g) => (g.id === tempId ? res.data.goal : g)),
      }));
      return res.data.goal;
    } catch (err) {
      // Rollback
      set((state) => ({ goals: state.goals.filter((g) => g.id !== tempId) }));
      toast.error('Failed to create goal');
      throw err;
    }
  },

  // ── Optimistic update ──────────────────────────────────────────────────────
  updateGoal: async (goalId, data) => {
    const prev = get().goals.find((g) => g.id === goalId);
    const prevCurrent = get().currentGoal;

    set((state) => ({
      goals: state.goals.map((g) => (g.id === goalId ? { ...g, ...data } : g)),
      currentGoal: state.currentGoal?.id === goalId
        ? { ...state.currentGoal, ...data }
        : state.currentGoal,
    }));

    try {
      const res = await api.put(`/goals/${goalId}`, data);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? res.data.goal : g)),
        currentGoal: state.currentGoal?.id === goalId ? res.data.goal : state.currentGoal,
      }));
      return res.data.goal;
    } catch (err) {
      // Rollback
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? prev : g)),
        currentGoal: state.currentGoal?.id === goalId ? prevCurrent : state.currentGoal,
      }));
      toast.error('Failed to update goal');
      throw err;
    }
  },

  deleteGoal: async (goalId) => {
    const prev = get().goals;
    set((state) => ({ goals: state.goals.filter((g) => g.id !== goalId) }));
    try {
      await api.delete(`/goals/${goalId}`);
    } catch (err) {
      set({ goals: prev });
      toast.error('Failed to delete goal');
      throw err;
    }
  },

  addMilestone: async (goalId, data) => {
    const res = await api.post(`/goals/${goalId}/milestones`, data);
    set((state) => ({
      currentGoal: state.currentGoal?.id === goalId
        ? { ...state.currentGoal, milestones: [...(state.currentGoal.milestones || []), res.data.milestone] }
        : state.currentGoal,
    }));
    return res.data.milestone;
  },

  updateMilestone: async (goalId, milestoneId, data) => {
    // Optimistic
    const prev = get().currentGoal;
    set((state) => ({
      currentGoal: state.currentGoal?.id === goalId
        ? {
            ...state.currentGoal,
            milestones: state.currentGoal.milestones.map((m) =>
              m.id === milestoneId ? { ...m, ...data } : m
            ),
          }
        : state.currentGoal,
    }));

    try {
      const res = await api.put(`/goals/${goalId}/milestones/${milestoneId}`, data);
      return res.data.milestone;
    } catch (err) {
      set({ currentGoal: prev });
      toast.error('Failed to update milestone');
      throw err;
    }
  },

  addProgressUpdate: async (goalId, content) => {
    const res = await api.post(`/goals/${goalId}/progress`, { content });
    set((state) => ({
      currentGoal: state.currentGoal?.id === goalId
        ? {
            ...state.currentGoal,
            progressUpdates: [res.data.update, ...(state.currentGoal.progressUpdates || [])],
          }
        : state.currentGoal,
    }));
    return res.data.update;
  },

  // Socket updates
  onGoalCreated: (goal) => set((state) => ({
    goals: state.goals.some((g) => g.id === goal.id)
      ? state.goals
      : [goal, ...state.goals],
  })),
  onGoalUpdated: (goal) => set((state) => ({
    goals: state.goals.map((g) => (g.id === goal.id ? goal : g)),
    currentGoal: state.currentGoal?.id === goal.id ? { ...state.currentGoal, ...goal } : state.currentGoal,
  })),
  onGoalDeleted: ({ id }) => set((state) => ({
    goals: state.goals.filter((g) => g.id !== id),
  })),
}));

export default useGoalStore;
