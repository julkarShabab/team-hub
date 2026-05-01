import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user, accessToken) => {
    if (typeof window !== 'undefined') {
      if (accessToken) window.__accessToken = accessToken;
      if (user) localStorage.setItem('auth_user', JSON.stringify(user));
      if (accessToken) localStorage.setItem('auth_token', accessToken);
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
    if (typeof window !== 'undefined') {
      window.__accessToken = null;
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    }
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  refreshUser: async () => {
    // First try localStorage (instant, no network)
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('auth_user');
      const savedToken = localStorage.getItem('auth_token');
      if (savedUser && savedToken) {
        const user = JSON.parse(savedUser);
        window.__accessToken = savedToken;
        set({ user, accessToken: savedToken, isAuthenticated: true, isLoading: false });
        // Also try to refresh in background silently
        api.post('/auth/refresh').then((res) => {
          get().setUser(res.data.user, res.data.accessToken);
        }).catch(() => {});
        return true;
      }
    }
    // Fallback: try cookie-based refresh
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

  updateUser: (updates) => {
    const updated = { ...get().user, ...updates };
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
    set((state) => ({ user: updated }));
  },
}));

export default useAuthStore;