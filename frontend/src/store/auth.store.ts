import { create } from 'zustand';
import { api } from '../services/api';

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  loginWithGoogle: (email?: string, name?: string, idToken?: string, accessToken?: string, picture?: string) => Promise<boolean>;
  logout: () => void;
  verifySession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('cryptoos_auth_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('cryptoos_auth_token'),
  isLoading: false,
  error: null,

  loginWithGoogle: async (email?: string, name?: string, idToken?: string, accessToken?: string, picture?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{
        token: string;
        user: UserProfile;
      }>('/auth/google', { email, name, idToken, accessToken, picture });

      localStorage.setItem('cryptoos_auth_token', res.token);
      if (res.user?.avatarUrl) {
        localStorage.setItem('cryptoos_user_avatar', res.user.avatarUrl);
      }
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
      const cachedAvatar = localStorage.getItem('cryptoos_user_avatar') || undefined;
      set({
        token: res.token,
        user: { ...res.user, avatarUrl: res.user.avatarUrl || cachedAvatar },
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
    localStorage.removeItem('cryptoos_user_avatar');
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

      const cachedAvatar = localStorage.getItem('cryptoos_user_avatar') || undefined;
      const resolvedAvatar = res.user?.avatarUrl || cachedAvatar;
      if (res.user?.avatarUrl) {
        localStorage.setItem('cryptoos_user_avatar', res.user.avatarUrl);
      }

      set({
        isAuthenticated: true,
        user: { ...res.user, avatarUrl: resolvedAvatar },
      });
      return true;
    } catch {
      localStorage.removeItem('cryptoos_auth_token');
      localStorage.removeItem('cryptoos_user_avatar');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      });
      return false;
    }
  },
}));
