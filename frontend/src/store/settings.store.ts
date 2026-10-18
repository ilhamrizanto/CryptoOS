import { create } from 'zustand';

interface SettingsState {
  usdToIdrRate: number;
  setUsdToIdrRate: (rate: number) => void;
  lastRateUpdate: number;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  usdToIdrRate: 16250, // Default baseline rate
  lastRateUpdate: Date.now(),
  setUsdToIdrRate: (rate: number) =>
    set({
      usdToIdrRate: rate,
      lastRateUpdate: Date.now(),
    }),
}));
