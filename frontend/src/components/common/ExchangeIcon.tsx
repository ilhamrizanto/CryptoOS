import React from 'react';

export interface ExchangeIconProps {
  exchange: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  showBadgeBackground?: boolean;
}

export const ExchangeIcon: React.FC<ExchangeIconProps> = ({
  exchange,
  size = 18,
  className = '',
  style = {},
  showBadgeBackground = true,
}) => {
  const norm = (exchange || '').trim().toUpperCase();

  // Common circular or rounded-rect wrapper when showBadgeBackground is true
  const badgeStyle: React.CSSProperties = showBadgeBackground
    ? {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: size <= 18 ? '4px' : '6px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        ...style,
      }
    : {
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      };

  const innerSize = showBadgeBackground ? Math.round(size * 0.72) : size;

  // 1. BINANCE
  if (norm === 'BINANCE' || norm.includes('BINANCE')) {
    return (
      <span
        className={`exchange-icon exchange-binance ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? '#181A20' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(240, 185, 11, 0.3)' : 'none',
        }}
        title="Binance Global"
      >
        <svg viewBox="0 0 24 24" width={innerSize} height={innerSize} fill="#F0B90B" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0115l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6595-2.7174-2.7154 7.353-7.353z" />
        </svg>
      </span>
    );
  }

  // 2. BYBIT
  if (norm === 'BYBIT' || norm.includes('BYBIT')) {
    return (
      <span
        className={`exchange-icon exchange-bybit ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? '#12141a' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(246, 165, 0, 0.3)' : 'none',
        }}
        title="Bybit Unified"
      >
        <svg viewBox="0 0 24 24" width={innerSize} height={innerSize} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3.5 19V5H10.5C13.5 5 15.2 6.6 15.2 9.2C15.2 10.9 14.1 12 13.2 12.4C14.3 12.8 15.7 13.8 15.7 15.9C15.7 18.7 13.8 19 10.5 19H3.5ZM5.8 11.5H9.8C11.1 11.5 11.9 10.8 11.9 9.7C11.9 8.6 11.1 7.9 9.8 7.9H5.8V11.5ZM5.8 13.5V17.1H10.1C11.5 17.1 12.3 16.3 12.3 15.3C12.3 14.3 11.5 13.5 10.1 13.5H5.8Z"
            fill="#FFFFFF"
          />
          <rect x="18" y="5" width="2.5" height="14" rx="0.6" fill="#F6A500" />
        </svg>
      </span>
    );
  }

  // 3. OKX
  if (norm === 'OKX' || norm.includes('OKX')) {
    return (
      <span
        className={`exchange-icon exchange-okx ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? '#000000' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(255, 255, 255, 0.25)' : 'none',
        }}
        title="OKX Trading"
      >
        <svg viewBox="0 0 24 24" width={innerSize} height={innerSize} fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
          <path d="M 7.15 8.685 L 7.2 15.225 C 7.2 15.265 7.18 15.305 7.15 15.325 L 0.16 15.375 L 0 8.785 L 7.04 8.635 Z M 4.8 11.035 L 2.4 11.025 L 2.4 12.975 L 4.8 12.985 Z M 21.6 11.035 L 21.6 12.975 L 19.2 12.975 L 19.2 11.035 Z M 19.2 8.785 L 19.2 10.735 L 16.8 10.735 L 16.8 8.785 Z M 24 8.785 L 24 10.735 L 21.6 10.735 L 21.6 8.785 Z M 19.2 13.285 L 19.2 15.225 L 16.8 15.225 L 16.8 13.275 Z M 24 13.285 L 24 15.225 L 21.6 15.225 L 21.6 13.275 Z M 15.6 8.785 L 15.6 10.735 L 13.2 10.735 L 13.2 8.785 Z M 15.6 13.285 L 15.6 15.225 L 13.2 15.225 L 13.2 13.275 Z M 13.04 13.135 L 10.8 13.135 L 10.8 15.215 L 8.4 15.225 L 8.4 8.775 L 10.8 8.775 L 10.8 10.875 L 13.04 10.875 Z" />
        </svg>
      </span>
    );
  }

  // 4. MEXC (Global Altcoin & Futures Exchange)
  if (norm === 'MEXC' || norm.includes('MEXC')) {
    return (
      <span
        className={`exchange-icon exchange-mexc ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? '#0b1322' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(0, 184, 151, 0.4)' : 'none',
        }}
        title="MEXC Global"
      >
        <svg viewBox="0 0 24 24" width={innerSize} height={innerSize} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* MEXC Signature M-Chevron with Blue & Emerald Teal gradients */}
          <path d="M2.5 19L8.2 5H11.2L6.8 16.2H17.2L12.8 5H15.8L21.5 19H17.6L14 9.8L10.4 19H2.5Z" fill="#00B897" />
          <path d="M12 9.8L14 14.8H10L12 9.8Z" fill="#1652F0" />
        </svg>
      </span>
    );
  }

  // 5. INDODAX (Indonesia Pioneer & Largest Regulated Exchange)
  if (norm === 'INDODAX' || norm.includes('INDODAX')) {
    return (
      <span
        className={`exchange-icon exchange-indodax ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? '#081426' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(0, 174, 239, 0.4)' : 'none',
        }}
        title="Indodax (Bappebti Regulated - Indonesia)"
      >
        <svg viewBox="0 0 24 24" width={innerSize} height={innerSize} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Dual circular curved arrow arcs representing Indodax loop */}
          <path
            d="M12 3C7.03 3 3 7.03 3 12C3 13.9 3.59 15.66 4.6 17.12L6.8 14.92C6.29 14.05 6 13.06 6 12C6 8.69 8.69 6 12 6C14.07 6 15.89 7.05 16.97 8.65L14.5 11.12H21V4.62L18.42 7.2C16.89 5.25 14.59 4 12 4V3Z"
            fill="#00AEEF"
          />
          <path
            d="M12 21C16.97 21 21 16.97 21 12C21 10.1 20.41 8.34 19.4 6.88L17.2 9.08C17.71 9.95 18 10.94 18 12C18 15.31 15.31 18 12 18C9.93 18 8.11 16.95 7.03 15.35L9.5 12.88H3V19.38L5.58 16.8C7.11 18.75 9.41 20 12 20V21Z"
            fill="#1B75BB"
          />
        </svg>
      </span>
    );
  }

  // 6. TRIV (Indonesia Regulated Multi-Asset Brokerage & Pro Exchange)
  if (norm === 'TRIV' || norm.includes('TRIV')) {
    return (
      <span
        className={`exchange-icon exchange-triv ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? '#09152b' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(255, 127, 0, 0.4)' : 'none',
        }}
        title="Triv Pro / Triv OTC (Indonesia)"
      >
        <svg viewBox="0 0 24 24" width={innerSize} height={innerSize} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stylized Triv Geometric "T" Token in Vivid Orange & Deep Blue */}
          <rect x="3" y="4" width="18" height="4.5" rx="1.2" fill="#0066CC" />
          <rect x="9.5" y="8.5" width="5" height="11.5" rx="1.2" fill="#FF7F00" />
          <circle cx="12" cy="14" r="1.5" fill="#FFFFFF" />
        </svg>
      </span>
    );
  }

  // 7. TOKOCRYPTO (Binance-backed Indonesian Bappebti Exchange)
  if (norm === 'TOKOCRYPTO' || norm.includes('TOKO') || norm.includes('TKX')) {
    return (
      <span
        className={`exchange-icon exchange-tokocrypto ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? '#071b12' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(0, 194, 111, 0.4)' : 'none',
        }}
        title="Tokocrypto (Binance Cloud Indonesia)"
      >
        <svg viewBox="0 0 24 24" width={innerSize} height={innerSize} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Tokocrypto Signature Green Hexagon Shield with "T" Pillar */}
          <path d="M12 2L20.5 6.5V17.5L12 22L3.5 17.5V6.5L12 2Z" stroke="#00C26F" strokeWidth="2" fill="none" />
          <path d="M7 8H17M12 8V17" stroke="#00C26F" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  // 8. KUCOIN (Global Major Exchange)
  if (norm === 'KUCOIN' || norm.includes('KUCOIN')) {
    return (
      <span
        className={`exchange-icon exchange-kucoin ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? '#0a1d17' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(36, 174, 143, 0.4)' : 'none',
        }}
        title="KuCoin Global"
      >
        <svg viewBox="0 0 24 24" width={innerSize} height={innerSize} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* KuCoin "K" Diamond Shield Logo in Mint Green */}
          <path d="M4 12L12 4L20 12L12 20L4 12Z" stroke="#24AE8F" strokeWidth="2" fill="none" />
          <path d="M9 8.5V15.5M15 8.5L11 12L15 15.5" stroke="#24AE8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  // 9. GATE.IO (Global Altcoin Leader)
  if (norm === 'GATEIO' || norm === 'GATE' || norm.includes('GATE')) {
    return (
      <span
        className={`exchange-icon exchange-gateio ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? '#190e14' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(224, 62, 62, 0.4)' : 'none',
        }}
        title="Gate.io Global"
      >
        <svg viewBox="0 0 24 24" width={innerSize} height={innerSize} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Gate.io Arch Ring with Blue & Crimson segments */}
          <circle cx="12" cy="12" r="8" stroke="#2354E6" strokeWidth="2.5" strokeDasharray="25 15" />
          <circle cx="12" cy="12" r="8" stroke="#E03E3E" strokeWidth="2.5" strokeDasharray="15 25" strokeDashoffset="20" />
          <circle cx="12" cy="12" r="3" fill="#E03E3E" />
        </svg>
      </span>
    );
  }

  // 10. BITGET (Global Leading Futures & Copy Trading Exchange)
  if (norm === 'BITGET' || norm.includes('BITGET')) {
    return (
      <span
        className={`exchange-icon exchange-bitget ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? '#061a22' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(0, 240, 255, 0.4)' : 'none',
        }}
        title="Bitget Global"
      >
        <svg viewBox="0 0 24 24" width={innerSize} height={innerSize} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Bitget Dual Directional Cyan Arrows */}
          <path d="M6 8L12 4L18 8L12 12L6 8Z" fill="#00F0FF" />
          <path d="M6 16L12 12L18 16L12 20L6 16Z" fill="#00B4D8" />
        </svg>
      </span>
    );
  }

  // 11. COLD STORAGE / HARDWARE WALLET (LEDGER / TREZOR)
  if (norm === 'WALLET' || norm.includes('LEDGER') || norm.includes('COLD') || norm.includes('TREZOR')) {
    return (
      <span
        className={`exchange-icon exchange-cold-wallet ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? 'rgba(0, 199, 190, 0.12)' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(0, 199, 190, 0.35)' : 'none',
        }}
        title="Cold Storage Vault (Ledger / Trezor)"
      >
        <svg
          viewBox="0 0 24 24"
          width={innerSize}
          height={innerSize}
          fill="none"
          stroke="#00C7BE"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="16" r="1.5" fill="#00C7BE" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </span>
    );
  }

  // 12. MANUAL / OTHER SPOT WALLET
  return (
    <span
      className={`exchange-icon exchange-manual ${className}`}
      style={{
        ...badgeStyle,
        backgroundColor: showBadgeBackground ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        border: showBadgeBackground ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
      }}
      title="Manual Spot Wallet"
    >
      <svg
        viewBox="0 0 24 24"
        width={innerSize}
        height={innerSize}
        fill="none"
        stroke="#8E8E93"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    </span>
  );
};
