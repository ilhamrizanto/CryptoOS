import { create } from 'zustand';
import { api } from '../services/api';

interface DemoStatusData {
  demoMode: boolean;
  lastReset: number;
  nextReset: number;
  timeRemainingMs: number;
  roles?: Array<{
    id: string;
    label: string;
    badge: string;
    description: string;
    email: string;
  }>;
}

interface DemoState {
  isDemoMode: boolean;
  lastReset: number;
  nextReset: number;
  isResetting: boolean;
  isLoading: boolean;
  checkDemoStatus: () => Promise<boolean>;
  resetDemo: () => Promise<boolean>;
}

export const useDemoStore = create<DemoState>((set) => ({
  // Default to true if VITE_DEMO_MODE is set, will be confirmed via backend
  isDemoMode: import.meta.env.VITE_DEMO_MODE === 'True' || import.meta.env.VITE_DEMO_MODE === 'true' || true,
  lastReset: Date.now(),
  nextReset: Date.now() + 3600 * 1000,
  isResetting: false,
  isLoading: false,

  checkDemoStatus: async () => {
    try {
      const res = await api.get<DemoStatusData>('/demo/status');
      set({
        isDemoMode: !!res.demoMode,
        lastReset: res.lastReset,
        nextReset: res.nextReset,
      });
      return !!res.demoMode;
    } catch {
      // If endpoint fails, fallback to environment or false
      const fallback = import.meta.env.VITE_DEMO_MODE === 'True' || import.meta.env.VITE_DEMO_MODE === 'true';
      set({ isDemoMode: fallback });
      return fallback;
    }
  },

  resetDemo: async () => {
    set({ isResetting: true });
    try {
      await api.post('/demo/reset', {});
      set({
        isResetting: false,
        lastReset: Date.now(),
        nextReset: Date.now() + 3600 * 1000,
      });
      return true;
    } catch (err) {
      console.error('[DemoStore] Reset failed:', err);
      set({ isResetting: false });
      return false;
    }
  },
}));

