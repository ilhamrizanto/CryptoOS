import { create } from 'zustand';
import { api } from '../services/api';

interface UserProfile {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  verifySession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('cryptoos_auth_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('cryptoos_auth_token'),
  isLoading: false,
  error: null,

  login: async (password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{
        token: string;
        user: UserProfile;
      }>('/auth/login', { password });

      localStorage.setItem('cryptoos_auth_token', res.token);
      set({
        token: res.token,
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || 'Password salah atau gagal menghubungkan ke server',
        isAuthenticated: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('cryptoos_auth_token');
    api.post('/auth/logout').catch(() => {});
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  verifySession: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }

    try {
      const res = await api.get<{
        valid: boolean;
        user: UserProfile;
      }>('/auth/verify');

      set({
        isAuthenticated: true,
        user: res.user,
      });
      return true;
    } catch {
      localStorage.removeItem('cryptoos_auth_token');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      });
      return false;
    }
  },
}));
