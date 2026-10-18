export type TradeDirection = 'LONG' | 'SHORT';

export type IdeaStatus = 'WATCHLIST' | 'READY' | 'ACTIVE' | 'CLOSED' | 'INVALIDATED';

export type JournalStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface MacroPillarData {
  dxyTrend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  fedExpectation?: string;
  btcDominance?: number;
  marketRegime?: 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL';
  notes?: string;
}

export interface FundamentalPillarData {
  coinGeckoId?: string;
  name?: string;
  symbol?: string;
  marketCapUsd?: number;
  fdvUsd?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  fdvToMcapRatio?: number;
  volume24hUsd?: number;
  revenue24hUsd?: number;
  tvlUsd?: number;
  tokenUnlocksNotice?: string;
  narrativeTags?: string[];
  notes?: string;
}

export interface PriceActionPillarData {
  timeframe?: string;
  marketStructure?: 'BULLISH_BOS' | 'BEARISH_BOS' | 'RANGE' | 'CHoCH';
  orderBlockLocation?: string;
  liquiditySwept?: boolean;
  confluenceFactors?: string[];
  notes?: string;
}

export interface EvidencePillarData {
  screenshotIds: string[];
  coinglassChecklist?: {
    openInterestTrend?: 'INCREASING' | 'DECREASING' | 'STABLE';
    fundingRateStatus?: 'POSITIVE_EXTREME' | 'NEGATIVE_EXTREME' | 'HEALTHY';
    cvdDivergence?: 'BULLISH_DIV' | 'BEARISH_DIV' | 'CONVERGENT';
    liquidationHeatmapNote?: string;
  };
  notes?: string;
}

export interface TradeIdea {
  id: string;
  symbol: string;
  direction: TradeDirection;
  timeframe: string;
  status: IdeaStatus;
  createdAt: number;
  updatedAt: number;
  macroData?: MacroPillarData;
  fundamentalData?: FundamentalPillarData;
  priceActionData?: PriceActionPillarData;
  evidenceData?: EvidencePillarData;
  entryPrice?: number;
  stopLossPrice?: number;
  tp1Price?: number;
  tp2Price?: number;
  tp3Price?: number;
  riskPercent?: number;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  ideaId?: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  positionSize: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  status: JournalStatus;
  pnlUsd?: number;
  pnlIdr?: number;
  pnlPercent?: number;
  rMultiple?: number;
  psychologicalState?: string;
  lessonsLearned?: string;
  openedAt: number;
  closedAt?: number;
  screenshotsMeta?: string[];
}
