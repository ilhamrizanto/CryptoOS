import { create } from 'zustand';
import { api } from '../services/api';

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  loginWithGoogle: (email?: string, name?: string, idToken?: string, accessToken?: string) => Promise<boolean>;
  logout: () => void;
  verifySession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('cryptoos_auth_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('cryptoos_auth_token'),
  isLoading: false,
  error: null,

  loginWithGoogle: async (email?: string, name?: string, idToken?: string, accessToken?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{
        token: string;
        user: UserProfile;
      }>('/auth/google', { email, name, idToken, accessToken });

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
        error: err?.message || 'Google login failed. Account does not have authorized access.',
        isAuthenticated: false,
      });
      return false;
    }
  },

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
        error: err?.message || 'Incorrect master key or failed to connect to terminal server',
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
