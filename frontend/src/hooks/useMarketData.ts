import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../services/api';
import { useSettingsStore } from '../store/settings.store';

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface MetricWithHistory {
  value: number;
  change24h: number;
  change7d?: number;
  context?: string;
  updatedAt: number;
  isLive: boolean;
  history?: TimeSeriesPoint[];
  sparkline?: number[];
}

export interface MarketIntelResponse {
  forex: {
    usdIdr: MetricWithHistory;
    dxy: MetricWithHistory;
  };
  commodities: {
    wtiOil: MetricWithHistory;
  };
  macro: {
    fedFundsRate: { value: number; updatedAt: number; isLive: boolean };
    fedTargetRate?: string;
    nextFomcDate: string;
    fomcDaysRemaining?: number;
    fomcBias?: string;
    cpiYoy: {
      value: number;
      previous?: number;
      change?: number;
      expectation?: number;
      status?: string;
      source?: string;
      seriesId?: string;
      releaseDate?: string;
      updatedAt: number;
      isLive: boolean;
    };
    coreCpi?: {
      value: number;
      previous?: number;
      change?: number;
      status?: string;
      source?: string;
      seriesId?: string;
      releaseDate?: string;
      updatedAt: number;
      isLive: boolean;
    };
    pceYoy?: {
      value: number;
      previous?: number;
      change?: number;
      status?: string;
      source?: string;
      seriesId?: string;
      releaseDate?: string;
      updatedAt: number;
      isLive: boolean;
    };
    corePce?: {
      value: number;
      previous?: number;
      change?: number;
      target?: number;
      status?: string;
      source?: string;
      seriesId?: string;
      releaseDate?: string;
      updatedAt: number;
      isLive: boolean;
    };
    coreInflation: {
      value: number;
      previous?: number;
      target?: number;
      status?: string;
      updatedAt: number;
      isLive: boolean;
    };
    fomcCalendar?: Array<{
      date: string;
      daysRemaining: number;
      targetRate: string;
      pauseProb: number;
      hikeProb: number;
      cutProb: number;
      bias: string;
    }>;
    macroRegime?: string;
    regimeExplanation?: string;
  };
  fedwatch: {
    meetingDate?: string;
    targetRate?: string;
    easeProb: number;
    noChangeProb: number;
    hikeProb: number;
    nextMeetingForward?: {
      date: string;
      daysRemaining: number;
      targetRate: string;
      hikeProb: number;
      noChangeProb: number;
      easeProb: number;
    };
    manuallyUpdatedAt: number | null;
    notes?: string;
    source?: string;
    cmeFedwatchUrl: string;
  };
  sentiment: {
    fearAndGreed: {
      value: number;
      classification: string;
      updatedAt: number;
      isLive: boolean;
      history?: TimeSeriesPoint[];
      sparkline?: number[];
      yesterday?: number;
      lastWeek?: number;
      lastMonth?: number;
    };
    altcoinSeasonIndex: { value: number; classification: string; updatedAt: number; isLive: boolean };
  };
  crypto: {
    btcDominance: { value: number; change24h: number; change7d?: number; updatedAt: number; isLive: boolean; history?: TimeSeriesPoint[]; sparkline?: number[] };
    total3: {
      value: number;
      change24h: number;
      change7d?: number;
      sparkline?: number[];
      updatedAt: number;
      isLive: boolean;
    };
    others: { value: number; change24h: number; updatedAt: number; isLive: boolean };
  };
  onchain: {
    mvrvZScore: {
      value: number;
      change24h?: number;
      change7d?: number;
      context?: string;
      classification: string;
      updatedAt: number;
      isLive: boolean;
      history?: TimeSeriesPoint[];
      sparkline?: number[];
    };
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
  const { setUsdToIdrRate, syncIntervalMs } = useSettingsStore();

  const query = useQuery<MarketIntelResponse>({
    queryKey: ['market', 'intel'],
    queryFn: () => api.get<MarketIntelResponse>('/market/intel'),
    refetchInterval: syncIntervalMs || 300_000, // Dynamic polling based on user setting
    staleTime: Math.min(60_000, (syncIntervalMs || 300_000) / 2),
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

  const forceRefresh = async (): Promise<MarketIntelResponse> => {
    const data = await api.get<MarketIntelResponse>('/market/intel?refresh=true');
    queryClient.setQueryData(['market', 'intel'], data);
    return data;
  };

  return {
    ...query,
    intel: query.data,
    forceRefresh,
    updateFedWatch: updateFedWatchMutation.mutateAsync,
    isUpdatingFedWatch: updateFedWatchMutation.isPending,
  };
}
