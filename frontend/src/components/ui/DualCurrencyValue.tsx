import React from 'react';
import { useSettingsStore } from '../../store/settings.store';
import { formatUsd, formatIdr } from '../../utils/formatters';

interface DualCurrencyValueProps {
  usd?: number | null;
  idr?: number | null;
  layout?: 'row' | 'stacked';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  sentiment?: 'bullish' | 'bearish' | 'neutral' | 'normal';
  className?: string;
}

export const DualCurrencyValue: React.FC<DualCurrencyValueProps> = ({
  usd,
  idr,
  layout = 'stacked',
  size = 'md',
  sentiment = 'normal',
  className = '',
}) => {
  const defaultRate = useSettingsStore((state) => state.usdToIdrRate);

  const finalUsd = usd ?? 0;
  const finalIdr = idr ?? finalUsd * defaultRate;

  const fontSizes = {
    xs: { usd: '0.75rem', idr: '0.6875rem' },
    sm: { usd: '0.875rem', idr: '0.75rem' },
    md: { usd: '1rem', idr: '0.8125rem' },
    lg: { usd: '1.25rem', idr: '0.875rem' },
    xl: { usd: '1.5rem', idr: '1rem' },
    hero: { usd: '2rem', idr: '1.125rem' },
  }[size];

  const sentimentColor = {
    bullish: 'var(--color-bullish)',
    bearish: 'var(--color-bearish)',
    neutral: 'var(--color-neutral)',
    normal: 'var(--color-text-primary)',
  }[sentiment];

  if (layout === 'row') {
    return (
      <span className={`dual-currency-row ${className}`} style={{ alignItems: 'baseline', gap: '6px' }}>
        <span
          className="value-number currency-usd"
          style={{ fontSize: fontSizes.usd, color: sentimentColor, fontWeight: 600 }}
        >
          {formatUsd(finalUsd)}
        </span>
        <span
          className="value-number currency-idr"
          style={{ fontSize: fontSizes.idr, color: 'var(--color-text-secondary)' }}
        >
          ({formatIdr(finalIdr)})
        </span>
      </span>
    );
  }

  return (
    <div className={`dual-currency ${className}`} style={{ gap: '2px' }}>
      <span
        className="value-number currency-usd"
        style={{ fontSize: fontSizes.usd, color: sentimentColor, fontWeight: 600 }}
      >
        {formatUsd(finalUsd)}
      </span>
      <span
        className="value-number currency-idr"
        style={{ fontSize: fontSizes.idr, color: 'var(--color-text-secondary)' }}
      >
        {formatIdr(finalIdr)}
      </span>
    </div>
  );
};
