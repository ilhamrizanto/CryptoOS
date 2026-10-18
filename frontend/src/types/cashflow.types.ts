export type CashflowType = 'DEPOSIT' | 'WITHDRAWAL' | 'STAKING_YIELD' | 'AIRDROP' | 'FEE';

export interface CashflowTransaction {
  id: string;
  type: CashflowType;
  amountUsd: number;
  amountIdr: number;
  sourceOrDestination?: string;
  exchange?: string;
  transactionDate: number;
  notes?: string;
}

export interface CashflowSummary {
  totalDepositedUsd: number;
  totalDepositedIdr: number;
  totalWithdrawnUsd: number;
  totalWithdrawnIdr: number;
  netInvestedUsd: number;
  netInvestedIdr: number;
  totalYieldUsd: number;
  totalYieldIdr: number;
}
