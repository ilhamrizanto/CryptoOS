export interface MarketSummary {
  btcPriceUsd: number;
  ethPriceUsd: number;
  solPriceUsd: number;
  usdToIdrRate: number;
  btcDominance: number; // e.g. 58.4
  fearAndGreedIndex: {
    value: number; // 0-100
    classification: string; // 'Extreme Greed', 'Greed', 'Neutral', 'Fear', 'Extreme Fear'
    timestamp: number;
  };
  altcoinSeasonIndex?: {
    value: number; // 0-100
    isAltseason: boolean;
  };
  dxyIndex?: {
    value: number;
    change24h?: number;
  };
  wtiOilPrice?: number;
  fedFundsRate?: {
    currentRate: number; // e.g. 4.75
    nextMeetingDate?: string;
    targetProbability?: number; // CME FedWatch probability
  };
  lastUpdated: number;
}
