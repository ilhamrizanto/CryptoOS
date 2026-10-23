import React, { useState, useEffect } from 'react';

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * CoinGecko image IDs — the numeric folder in their CDN.
 * Format: https://coin-images.coingecko.com/coins/images/{ID}/large/{filename}
 * These are verified IDs from CoinGecko API as of 2026-10.
 * 
 * HOW TO ADD A NEW TOKEN:
 * 1. Visit: https://www.coingecko.com/en/coins/{coin-id}
 * 2. Right-click the coin logo → "Copy image address"
 * 3. Extract the numeric ID from the URL: /coins/images/{ID}/large/...
 * 4. Add entry: SYMBOL: { id: NUMERIC_ID, file: 'filename.ext' }
 */
const COINGECKO_IMAGE_MAP: Record<string, { id: number; file: string }> = {
  // ── Tier 1: Blue-chip & Major Assets ──────────────────────────────────
  BTC:   { id: 1,     file: 'bitcoin.png?1696501400' },
  ETH:   { id: 279,   file: 'ethereum.png?1696501628' },
  SOL:   { id: 4128,  file: 'solana.png?1718769756' },
  USDT:  { id: 325,   file: 'Tether.png?1696501661' },
  USDC:  { id: 6319,  file: 'USDC.png?1769615602' },
  BNB:   { id: 825,   file: 'bnb-icon2_2x.png?1696501970' },
  XRP:   { id: 44,    file: 'xrp-symbol-white-128.png?1696501442' },
  DOGE:  { id: 5,     file: 'dogecoin.png?1696501409' },
  ADA:   { id: 975,   file: 'cardano.png?1696502090' },
  LTC:   { id: 2,     file: 'litecoin.png?1696501400' },
  DOT:   { id: 12171, file: 'polkadot.jpg?1766533446' },
  LINK:  { id: 877,   file: 'Chainlink_Logo_500.png?1760023405' },
  AVAX:  { id: 12559, file: 'Avalanche_Circle_RedWhite_Trans.png?1696512369' },
  NEAR:  { id: 10365, file: 'near.jpg?1696510367' },
  UNI:   { id: 12504, file: 'uniswap-logo.png?1720676669' },
  SHIB:  { id: 11939, file: 'shiba.png?1696511800' },
  PEPE:  { id: 29850, file: 'pepe-token.jpeg?1696528776' },
  SUI:   { id: 26375, file: 'sui-ocean-square.png?1727791290' },
  AAVE:  { id: 12645, file: 'aave-token-round.png?1720472354' },
  DAI:   { id: 9956,  file: 'dai-multi-collateral-mcd.png?1696509968' },
  // ── Tier 2: Mid-Cap & Ecosystem ───────────────────────────────────────
  INJ:   { id: 12882, file: 'Other_200x200.png?1738782212' },
  TAO:   { id: 28452, file: 'ARUsPeNQ_400x400.jpeg?1696527447' },
  WLD:   { id: 31069, file: 'worldcoin.jpeg?1696529903' },
  HYPE:  { id: 50882, file: 'hyperliquid.jpg?1729431300' },
  ONDO:  { id: 26580, file: 'ONDO.png?1696525656' },
  FET:   { id: 5681,  file: 'ASI.png?1719827289' },
  // ── Tier 3: Smaller / Niche ──────────────────────────────────────────
  RENDER:{ id: 11636, file: 'Render.png?1735965115' },
  RNDR:  { id: 11636, file: 'Render.png?1735965115' },
  POL:   { id: 4713,  file: 'matic-token.png?1736726376' },
  MATIC: { id: 4713,  file: 'matic-token.png?1736726376' },
  EDEN:  { id: 68283, file: 'eden.png' },        // OpenEden (EDEN symbol)
  CT:    { id: 2570,  file: 'connected-token.png?1547482425' },
  ETHW:  { id: 23591, file: 'ETHPoW-icon.png?1696522977' },
};

// Curated brand background colors — used only when ALL image sources fail
const TOKEN_COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', SOL: '#9945FF', USDT: '#26A17B',
  USDC: '#2775CA', BNB: '#F3BA2F', XRP: '#23292F', DOGE: '#C2A633',
  SUI: '#2A82E4', ADA: '#0033AD', AVAX: '#E84142', LINK: '#375BD2',
  NEAR: '#000000', DOT: '#E6007A', PEPE: '#4C9540', SHIB: '#FFA409',
  LTC: '#345D9D', UNI: '#FF007A', TAO: '#141414', WLD: '#000000',
  INJ: '#1B5ADE', EDEN: '#059669', HYPE: '#00C2FF', ONDO: '#4361EE',
  FET: '#1B205E', RENDER: '#FF5B22', AAVE: '#B6509E', DAI: '#F5AC37',
};

// TradingView CDN overrides — only when CoinGecko map has NO entry for a symbol.
// TradingView symbol may differ from ticker (e.g. ticker RENDER → TV code RNDR)
const TRADINGVIEW_ALIASES: Record<string, string> = {
  RENDER: 'RNDR',
  POL:    'MATIC',
};

export const TokenIcon: React.FC<TokenIconProps> = ({
  symbol,
  size = 22,
  className = '',
  style = {},
}) => {
  const sym = (symbol || '').toUpperCase().trim();
  const cgEntry = COINGECKO_IMAGE_MAP[sym];

  // Build URL chain (highest priority → lowest)
  const cgUrl = cgEntry
    ? `https://coin-images.coingecko.com/coins/images/${cgEntry.id}/large/${cgEntry.file}`
    : null;

  const tvCode = TRADINGVIEW_ALIASES[sym] || sym;
  const tvUrl = `https://s3-symbol-logo.tradingview.com/crypto/XTVC${tvCode}.svg`;
  const ccUrl = `https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`;

  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setActiveSrc(null);
    setLoadFailed(false);

    const tryLoad = (src: string, onSuccess: () => void, onFail: () => void) => {
      const img = new Image();
      img.src = src;
      img.crossOrigin = 'anonymous';
      img.onload = () => { if (!cancelled) onSuccess(); };
      img.onerror = () => { if (!cancelled) onFail(); };
    };

    const tryCoinCap = () => {
      tryLoad(ccUrl,
        () => setActiveSrc(ccUrl),
        () => setLoadFailed(true)
      );
    };

    const tryTradingView = () => {
      tryLoad(tvUrl,
        () => setActiveSrc(tvUrl),
        () => tryCoinCap()
      );
    };

    if (cgUrl) {
      // 1. Try CoinGecko (most accurate — verified mapping)
      tryLoad(cgUrl,
        () => setActiveSrc(cgUrl),
        () => tryTradingView()  // 2. Fallback: TradingView
      );
    } else {
      // No CoinGecko mapping, go straight to TradingView
      tryTradingView();
    }

    return () => { cancelled = true; };
  }, [sym, cgUrl, tvUrl, ccUrl]);

  // ── Render: loaded image ─────────────────────────────────────────────
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

  // ── Render: graceful typographic fallback (when all CDNs fail) ────────
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
