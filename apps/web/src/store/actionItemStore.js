import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const useActionItemStore = create((set, get) => ({
  items: [],
  isLoading: false,

  fetchItems: async (workspaceId, filters = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/action-items/workspace/${workspaceId}?${params}`);
      set({ items: res.data.items, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  createItem: async (workspaceId, data, currentUser) => {
    const tempId = `temp-${uuidv4()}`;
    const optimistic = {
      id: tempId,
      ...data,
      workspaceId,
      assignee: data.assigneeId ? { id: data.assigneeId, name: 'Assigning...' } : null,
      goal: null,
      status: data.status || 'TODO',
      priority: data.priority || 'MEDIUM',
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };

    set((state) => ({ items: [...state.items, optimistic] }));

    try {
      const res = await api.post(`/action-items/workspace/${workspaceId}`, data);
      set((state) => ({
        items: state.items.map((i) => (i.id === tempId ? res.data.item : i)),
      }));
      return res.data.item;
    } catch (err) {
      set((state) => ({ items: state.items.filter((i) => i.id !== tempId) }));
      toast.error('Failed to create action item');
      throw err;
    }
  },

  // ── Optimistic status update (core of Kanban drag) ─────────────────────────
  updateItemStatus: async (itemId, status) => {
    const prev = get().items.find((i) => i.id === itemId);

    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, status } : i)),
    }));

    try {
      const res = await api.put(`/action-items/${itemId}`, { status });
      set((state) => ({
        items: state.items.map((i) => (i.id === itemId ? res.data.item : i)),
      }));
    } catch (err) {
      set((state) => ({
        items: state.items.map((i) => (i.id === itemId ? prev : i)),
      }));
      toast.error('Failed to update status');
    }
  },

  updateItem: async (itemId, data) => {
    const prev = get().items.find((i) => i.id === itemId);
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, ...data } : i)),
    }));
    try {
      const res = await api.put(`/action-items/${itemId}`, data);
      set((state) => ({
        items: state.items.map((i) => (i.id === itemId ? res.data.item : i)),
      }));
      return res.data.item;
    } catch (err) {
      set((state) => ({
        items: state.items.map((i) => (i.id === itemId ? prev : i)),
      }));
      toast.error('Failed to update item');
      throw err;
    }
  },

  deleteItem: async (itemId) => {
    const prev = get().items;
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
    try {
      await api.delete(`/action-items/${itemId}`);
    } catch (err) {
      set({ items: prev });
      toast.error('Failed to delete item');
      throw err;
    }
  },

  // Socket updates
  onItemCreated: (item) => set((state) => ({
    items: state.items.some((i) => i.id === item.id)
      ? state.items
      : [...state.items, item],
  })),
  onItemUpdated: (item) => set((state) => ({
    items: state.items.map((i) => (i.id === item.id ? item : i)),
  })),
  onItemDeleted: ({ id }) => set((state) => ({
    items: state.items.filter((i) => i.id !== id),
  })),
}));

export default useActionItemStore;
