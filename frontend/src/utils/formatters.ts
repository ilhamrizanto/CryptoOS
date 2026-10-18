// Formatting utilities for CryptoOS financial data

export function formatUsd(val?: number | null, decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  
  // For small altcoin prices (e.g. < $1) show more decimals
  if (Math.abs(val) > 0 && Math.abs(val) < 0.1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(val);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatIdr(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatPercent(val?: number | null, includeSign = true): string {
  if (val === undefined || val === null || isNaN(val)) return '0.00%';
  const sign = includeSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

export function formatCompactUsd(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return '$0';
  if (Math.abs(val) >= 1_000_000_000) {
    return `$${(val / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(val) >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(val) >= 1_000) {
    return `$${(val / 1_000).toFixed(1)}K`;
  }
  return formatUsd(val, 2);
}
