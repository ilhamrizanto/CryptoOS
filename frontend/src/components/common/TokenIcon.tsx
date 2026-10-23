import React, { useState, useEffect } from 'react';

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// TradingView official crypto logo symbol overrides & aliases
const TRADINGVIEW_ALIASES: Record<string, string> = {
  RENDER: 'RNDR',
  POL: 'MATIC',
  MATIC: 'MATIC',
  USD: 'USDC',
};

// Curated brand background colors for crypto tokens
const TOKEN_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#14F195',
  USDT: '#26A17B',
  USDC: '#2775CA',
  BNB: '#F3BA2F',
  XRP: '#23292F',
  DOGE: '#C2A633',
  SUI: '#2A82E4',
  ADA: '#0033AD',
  AVAX: '#E84142',
  LINK: '#375BD2',
  NEAR: '#000000',
  DOT: '#E6007A',
  PEPE: '#4C9540',
  SHIB: '#FFA409',
  LTC: '#345D9D',
  UNI: '#FF007A',
  TAO: '#222222',
  WLD: '#000000',
  EDEN: '#10B981',
  ETHW: '#627EEA',
  CT: '#3B82F6',
  FET: '#1B205E',
  AAVE: '#B6509E',
  DAI: '#F5AC37',
};

export const TokenIcon: React.FC<TokenIconProps> = ({
  symbol,
  size = 22,
  className = '',
  style = {},
}) => {
  const sym = (symbol || '').toUpperCase().trim();
  const tvCode = TRADINGVIEW_ALIASES[sym] || sym;

  // TradingView official SVG logo CDN
  const tvLogoUrl = `https://s3-symbol-logo.tradingview.com/crypto/XTVC${tvCode}.svg`;
  const fallbackCdnUrl = `https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`;

  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setActiveSrc(null);
    setLoadFailed(false);

    // 1. Try TradingView official SVG first
    const imgTv = new Image();
    imgTv.src = tvLogoUrl;
    imgTv.crossOrigin = 'anonymous';

    imgTv.onload = () => {
      if (!cancelled) setActiveSrc(tvLogoUrl);
    };

    imgTv.onerror = () => {
      if (cancelled) return;
      // 2. Try CoinCap secondary CDN
      const imgFallback = new Image();
      imgFallback.src = fallbackCdnUrl;
      imgFallback.crossOrigin = 'anonymous';

      imgFallback.onload = () => {
        if (!cancelled) setActiveSrc(fallbackCdnUrl);
      };

      imgFallback.onerror = () => {
        if (!cancelled) setLoadFailed(true);
      };
    };

    return () => {
      cancelled = true;
    };
  }, [sym, tvLogoUrl, fallbackCdnUrl]);

  // When loaded successfully from TradingView or CDN, render crisp image
  if (activeSrc && !loadFailed) {
    return (
      <img
        src={activeSrc}
        alt={sym}
        width={size}
        height={size}
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          ...style,
        }}
      />
    );
  }

  // Graceful fallback: Typographic Apple Pro Badge (Never shows broken image box)
  const bgColor = TOKEN_COLORS[sym] || '#3B82F6';

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${bgColor}, rgba(0,0,0,0.6))`,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.max(8.5, Math.round(size * 0.42))}px`,
        fontWeight: 900,
        fontFamily: 'var(--font-mono)',
        flexShrink: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        letterSpacing: '-0.02em',
        ...style,
      }}
    >
      {sym.slice(0, 3)}
    </div>
  );
};
