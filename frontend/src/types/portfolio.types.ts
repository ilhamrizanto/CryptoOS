export type ExchangeName = 'BINANCE' | 'BYBIT' | 'OKX' | 'MANUAL' | 'WALLET';

export interface PortfolioHolding {
  id: string;
  symbol: string;
  amount: number;
  averageBuyPrice?: number;
  currentPriceUsd?: number;
  currentValueUsd?: number;
  currentValueIdr?: number;
  targetPercent?: number;
  actualPercent?: number;
  exchange: ExchangeName;
  isManual: boolean;
  pnlUsd?: number;
  pnlPercent?: number;
  updatedAt: number;
}

export interface PortfolioSummary {
  totalUsd: number;
  totalIdr: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPercent: number;
  exchangeBreakdown: {
    exchange: ExchangeName;
    usdValue: number;
    idrValue: number;
    percent: number;
  }[];
  holdings: PortfolioHolding[];
  lastUpdated: number;
}
