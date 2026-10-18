import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../services/api';
import { useSettingsStore } from '../store/settings.store';

export interface MarketIntelResponse {
  forex: {
    usdIdr: { value: number; change24h: number; updatedAt: number; isLive: boolean };
    dxy: { value: number; change24h: number; updatedAt: number; isLive: boolean };
  };
  commodities: {
    wtiOil: { value: number; change24h: number; updatedAt: number; isLive: boolean };
  };
  macro: {
    fedFundsRate: { value: number; updatedAt: number; isLive: boolean };
    nextFomcDate: string;
    cpiYoy: { value: number; updatedAt: number; isLive: boolean };
    coreInflation: { value: number; updatedAt: number; isLive: boolean };
  };
  fedwatch: {
    easeProb: number;
    noChangeProb: number;
    hikeProb: number;
    manuallyUpdatedAt: number | null;
    notes?: string;
    cmeFedwatchUrl: string;
  };
  sentiment: {
    fearAndGreed: { value: number; classification: string; updatedAt: number; isLive: boolean };
    altcoinSeasonIndex: { value: number; classification: string; updatedAt: number; isLive: boolean };
  };
  crypto: {
    btcDominance: { value: number; change24h: number; updatedAt: number; isLive: boolean };
    total3: { value: number; change24h: number; updatedAt: number; isLive: boolean };
    others: { value: number; change24h: number; updatedAt: number; isLive: boolean };
  };
  onchain: {
    mvrvZScore: { value: number; classification: string; updatedAt: number; isLive: boolean };
  };
}

export interface FedWatchUpdateInput {
  easeProb: number;
  noChangeProb: number;
  hikeProb: number;
  notes?: string;
}

export function useMarketData() {
  const queryClient = useQueryClient();
  const { setUsdToIdrRate } = useSettingsStore();

  const query = useQuery<MarketIntelResponse>({
    queryKey: ['market', 'intel'],
    queryFn: () => api.get<MarketIntelResponse>('/market/intel'),
    refetchInterval: 300_000, // 5 minutes polling
    staleTime: 60_000,
  });

  // Automatically synchronize USD/IDR rate to global settings store
  useEffect(() => {
    if (query.data?.forex?.usdIdr?.value) {
      setUsdToIdrRate(query.data.forex.usdIdr.value);
    }
  }, [query.data?.forex?.usdIdr?.value, setUsdToIdrRate]);

  const updateFedWatchMutation = useMutation({
    mutationFn: (input: FedWatchUpdateInput) => api.patch('/market/fedwatch', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market', 'intel'] });
    },
  });

  return {
    ...query,
    intel: query.data,
    updateFedWatch: updateFedWatchMutation.mutateAsync,
    isUpdatingFedWatch: updateFedWatchMutation.isPending,
  };
}
