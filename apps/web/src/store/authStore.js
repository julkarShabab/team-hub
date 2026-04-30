import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user, accessToken) => {
    if (typeof window !== 'undefined' && accessToken) {
      window.__accessToken = accessToken;
    }
    set({ user, accessToken, isAuthenticated: !!user, isLoading: false });
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, accessToken } = res.data;
    get().setUser(user, accessToken);
    return user;
  },

  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { user, accessToken } = res.data;
    get().setUser(user, accessToken);
    return user;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    if (typeof window !== 'undefined') window.__accessToken = null;
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    try {
      const res = await api.post('/auth/refresh');
      const { user, accessToken } = res.data;
      get().setUser(user, accessToken);
      return true;
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },

  updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
}));

export default useAuthStore;
