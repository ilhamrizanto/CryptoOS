import React, { useState, useEffect } from 'react';

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * In-memory URL cache to avoid redundant network probes when the same token
 * is rendered across multiple components/cards simultaneously.
 */
const RESOLVED_URL_CACHE: Record<string, string | null> = {};

/**
 * CoinGecko image IDs — verified numeric folders on CoinGecko CDN.
 * Format: https://coin-images.coingecko.com/coins/images/{ID}/large/{filename}
 */
const COINGECKO_IMAGE_MAP: Record<string, { id: number; file: string }> = {
  // ── Tier 1: Blue-chip & Major Assets ──────────────────────────────────
  BTC:     { id: 1,     file: 'bitcoin.png?1696501400' },
  ETH:     { id: 279,   file: 'ethereum.png?1696501628' },
  SOL:     { id: 4128,  file: 'solana.png?1718769756' },
  USDT:    { id: 325,   file: 'Tether.png?1696501661' },
  USDC:    { id: 6319,  file: 'USDC.png?1769615602' },
  BNB:     { id: 825,   file: 'bnb-icon2_2x.png?1696501970' },
  XRP:     { id: 44,    file: 'xrp-symbol-white-128.png?1696501442' },
  DOGE:    { id: 5,     file: 'dogecoin.png?1696501409' },
  ADA:     { id: 975,   file: 'cardano.png?1696502090' },
  LTC:     { id: 2,     file: 'litecoin.png?1696501400' },
  DOT:     { id: 12171, file: 'polkadot.jpg?1766533446' },
  LINK:    { id: 877,   file: 'Chainlink_Logo_500.png?1760023405' },
  AVAX:    { id: 12559, file: 'Avalanche_Circle_RedWhite_Trans.png?1696512369' },
  NEAR:    { id: 10365, file: 'near.jpg?1696510367' },
  UNI:     { id: 12504, file: 'uniswap-logo.png?1720676669' },
  SHIB:    { id: 11939, file: 'shiba.png?1696511800' },
  PEPE:    { id: 29850, file: 'pepe-token.jpeg?1696528776' },
  SUI:     { id: 26375, file: 'sui-ocean-square.png?1727791290' },
  AAVE:    { id: 12645, file: 'aave-token-round.png?1720472354' },
  DAI:     { id: 9956,  file: 'dai-multi-collateral-mcd.png?1696509968' },

  // ── Tier 2: Major Layer 1, Layer 2 & Ecosystem ─────────────────────────
  ARB:     { id: 16547, file: 'arbitrum.png?1696516130' },
  OP:      { id: 25244, file: 'optimism.png?1696524385' },
  APT:     { id: 26455, file: 'aptos.png?1696525508' },
  TIA:     { id: 31967, file: 'celestia.png?1698717830' },
  SEI:     { id: 28205, file: 'Sei_Logo_Ocean.png?1696527202' },
  INJ:     { id: 12882, file: 'Other_200x200.png?1738782212' },
  TAO:     { id: 28452, file: 'ARUsPeNQ_400x400.jpeg?1696527447' },
  WLD:     { id: 31069, file: 'worldcoin.jpeg?1696529903' },
  HYPE:    { id: 50882, file: 'hyperliquid.jpg?1729431300' },
  ONDO:    { id: 26580, file: 'ONDO.png?1696525656' },
  FET:     { id: 5681,  file: 'ASI.png?1719827289' },
  KAS:     { id: 28752, file: 'kaspa.png?1696527732' },
  ICP:     { id: 14495, file: 'internet_computer.png?1696514180' },
  FIL:     { id: 12817, file: 'filecoin.png?1696512609' },
  STX:     { id: 2069,  file: 'Stacks.png?1696503023' },
  ATOM:    { id: 1481,  file: 'cosmos_hub.png?1696502510' },
  FTM:     { id: 4001,  file: 'Fantom_round.png?1696504680' },
  TRX:     { id: 1094,  file: 'tron.png?1696502193' },
  XLM:     { id: 100,   file: 'stellar.png?1696501479' },
  ALGO:    { id: 4380,  file: 'Algorand.png?1696505018' },
  HBAR:    { id: 3688,  file: 'hedera.png?1696504414' },
  VET:     { id: 3077,  file: 'vechain.png?1696503831' },
  RUNE:    { id: 6595,  file: 'THORChain.png?1696506972' },

  // ── Tier 3: High Momentum DeFi & Meme Tokens ──────────────────────────
  JUP:     { id: 34188, file: 'jup.png?1706680424' },
  PYTH:    { id: 32902, file: 'pyth.png?1700469037' },
  PENDLE:  { id: 15069, file: 'Pendle_Logo_Normal-03.png?1696514728' },
  ENA:     { id: 36560, file: 'ethena.png?1711704257' },
  RAY:     { id: 13928, file: 'raydium.png?1696513664' },
  WIF:     { id: 33566, file: 'dogwifhat.jpg?1702499789' },
  BONK:    { id: 28600, file: 'bonk.jpg?1696527587' },
  FLOKI:   { id: 16746, file: 'FLOKI.png?1696516323' },
  POPCAT:  { id: 33760, file: 'popcat.png?1702978393' },
  BRETT:   { id: 35561, file: 'brett.png?1708849767' },
  RENDER:  { id: 11636, file: 'Render.png?1735965115' },
  RNDR:    { id: 11636, file: 'Render.png?1735965115' },
  POL:     { id: 4713,  file: 'matic-token.png?1736726376' },
  MATIC:   { id: 4713,  file: 'matic-token.png?1736726376' },
  EDEN:    { id: 68283, file: 'eden.png' },
  CT:      { id: 2570,  file: 'connected-token.png?1547482425' },
  ETHW:    { id: 23591, file: 'ETHPoW-icon.png?1696522977' },
};

/**
 * Brand color palette for prominent assets
 */
const TOKEN_COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', SOL: '#9945FF', USDT: '#26A17B',
  USDC: '#2775CA', BNB: '#F3BA2F', XRP: '#23292F', DOGE: '#C2A633',
  SUI: '#2A82E4', ADA: '#0033AD', AVAX: '#E84142', LINK: '#375BD2',
  NEAR: '#000000', DOT: '#E6007A', PEPE: '#4C9540', SHIB: '#FFA409',
  LTC: '#345D9D', UNI: '#FF007A', TAO: '#141414', WLD: '#000000',
  INJ: '#1B5ADE', EDEN: '#059669', HYPE: '#00C2FF', ONDO: '#4361EE',
  FET: '#1B205E', RENDER: '#FF5B22', AAVE: '#B6509E', DAI: '#F5AC37',
  ARB: '#28A0F0', OP: '#FF0420', APT: '#000000', TIA: '#7B2BF9',
  SEI: '#9B1B30', KAS: '#70C7BA', JUP: '#24D69D', PENDLE: '#00E8C6',
};

/**
 * TradingView CDN overrides for ticker aliases
 */
const TRADINGVIEW_ALIASES: Record<string, string> = {
  RENDER: 'RNDR',
  POL:    'MATIC',
  WLD:    'WORLDCOIN',
};

/**
 * Normalizes user ticker input into a clean base asset symbol.
 * Example: 'SOLUSDT' -> 'SOL', 'BTC_USDC' -> 'BTC', '1000PEPEPERP' -> 'PEPE'
 */
export function extractBaseSymbol(input: string): string {
  if (!input) return '';
  return input
    .toUpperCase()
    .trim()
    .replace(/^(1000|1M|10000|K)/i, '')
    .replace(/(USDT|BUSD|USDC|USD|PERP|DOWN|UP)$/i, '')
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Deterministically generates an attractive HSL color from a string hash.
 * Used for unknown or unlisted tokens so every asset has a unique visual identity.
 */
function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

export const TokenIcon: React.FC<TokenIconProps> = ({
  symbol,
  size = 22,
  className = '',
  style = {},
}) => {
  const cleanSym = extractBaseSymbol(symbol) || (symbol || '').toUpperCase().trim();
  const cgEntry = COINGECKO_IMAGE_MAP[cleanSym];

  // Check persistent or in-memory cache first
  const cachedUrl = RESOLVED_URL_CACHE[cleanSym];

  const [activeSrc, setActiveSrc] = useState<string | null>(cachedUrl !== undefined ? cachedUrl : null);
  const [loadFailed, setLoadFailed] = useState<boolean>(cachedUrl === null);

  useEffect(() => {
    let cancelled = false;

    // If already resolved in cache, skip probe
    if (RESOLVED_URL_CACHE[cleanSym] !== undefined) {
      setActiveSrc(RESOLVED_URL_CACHE[cleanSym]);
      setLoadFailed(RESOLVED_URL_CACHE[cleanSym] === null);
      return;
    }

    setActiveSrc(null);
    setLoadFailed(false);

    // Build the dynamic multi-CDN resolution waterfall:
    const candidates: string[] = [];

    // 1. Curated CoinGecko CDN (Highest fidelity)
    if (cgEntry) {
      candidates.push(`https://coin-images.coingecko.com/coins/images/${cgEntry.id}/large/${cgEntry.file}`);
    }

    // 2. jsDelivr Open Cryptocurrency Icons (Covers 500+ cryptocurrencies by ticker)
    candidates.push(`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${cleanSym.toLowerCase()}.png`);

    // 3. TradingView Crypto Symbol Logo CDN
    const tvCode = TRADINGVIEW_ALIASES[cleanSym] || cleanSym;
    candidates.push(`https://s3-symbol-logo.tradingview.com/crypto/XTVC${tvCode}.svg`);

    // 4. CoinCap Open Icons CDN
    candidates.push(`https://assets.coincap.io/assets/icons/${cleanSym.toLowerCase()}@2x.png`);

    // 5. TrustWallet Assets Repository CDN
    candidates.push(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${cleanSym}/logo.png`);

    // Try each candidate sequentially
    let candidateIndex = 0;

    const tryNext = () => {
      if (cancelled) return;
      if (candidateIndex >= candidates.length) {
        // All CDN options exhausted -> gracefully fallback to monogram
        RESOLVED_URL_CACHE[cleanSym] = null;
        setLoadFailed(true);
        return;
      }

      const currentUrl = candidates[candidateIndex++];
      const img = new Image();
      img.src = currentUrl;
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        if (!cancelled) {
          RESOLVED_URL_CACHE[cleanSym] = currentUrl;
          setActiveSrc(currentUrl);
          setLoadFailed(false);
        }
      };

      img.onerror = () => {
        tryNext();
      };
    };

    tryNext();

    return () => {
      cancelled = true;
    };
  }, [cleanSym, cgEntry]);

  // ── Render: loaded image ─────────────────────────────────────────────
  if (activeSrc && !loadFailed) {
    return (
      <img
        src={activeSrc}
        alt={cleanSym}
        width={size}
        height={size}
        className={className}
        loading="lazy"
        onError={() => {
          // If runtime error occurs after onload, fall back to monogram
          RESOLVED_URL_CACHE[cleanSym] = null;
          setLoadFailed(true);
        }}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          ...style,
        }}
      />
    );
  }

  // ── Render: graceful typographic monogram fallback (when unlisted/all CDNs fail) ──
  const bgColor = TOKEN_COLORS[cleanSym] || getDeterministicColor(cleanSym);
  const displayLetters = cleanSym.slice(0, 3) || '???';

  return (
    <div
      className={className}
      title={`${cleanSym} (Dynamic Logo)`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${bgColor}, rgba(0,0,0,0.75))`,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.max(8, Math.round(size * 0.42))}px`,
        fontWeight: 900,
        fontFamily: 'var(--font-mono)',
        flexShrink: 0,
        boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
        letterSpacing: '-0.02em',
        userSelect: 'none',
        ...style,
      }}
    >
      {displayLetters}
    </div>
  );
};
