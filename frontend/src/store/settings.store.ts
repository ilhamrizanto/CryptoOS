import { create } from 'zustand';

interface SettingsState {
  usdToIdrRate: number;
  setUsdToIdrRate: (rate: number) => void;
  lastRateUpdate: number;
  syncIntervalMs: number;
  setSyncIntervalMs: (ms: number) => void;
}

const getInitialInterval = (): number => {
  try {
    const saved = localStorage.getItem('cryptoos_sync_interval');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 30000) return parsed;
    }
  } catch {
    // fallback
  }
  return 300_000; // Default: 5 minutes
};

export const useSettingsStore = create<SettingsState>((set) => ({
  usdToIdrRate: 17943, // Default TradingView ACE baseline rate
  lastRateUpdate: Date.now(),
  syncIntervalMs: getInitialInterval(),
  setUsdToIdrRate: (rate: number) =>
    set({
      usdToIdrRate: rate,
      lastRateUpdate: Date.now(),
    }),
  setSyncIntervalMs: (ms: number) => {
    try {
      localStorage.setItem('cryptoos_sync_interval', ms.toString());
    } catch {
      // ignore
    }
    set({ syncIntervalMs: ms });
  },
}));

