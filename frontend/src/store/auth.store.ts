import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('cryptoos_auth_token'),
  isAuthenticated: !!localStorage.getItem('cryptoos_auth_token'),
  setToken: (token: string) => {
    localStorage.setItem('cryptoos_auth_token', token);
    set({ token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('cryptoos_auth_token');
    set({ token: null, isAuthenticated: false });
  },
}));
