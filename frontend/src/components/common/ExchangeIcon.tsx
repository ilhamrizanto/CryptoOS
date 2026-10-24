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
        title="Binance Exchange"
      >
        <svg
          viewBox="0 0 24 24"
          width={innerSize}
          height={innerSize}
          fill="#F0B90B"
          xmlns="http://www.w3.org/2000/svg"
        >
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
        title="Bybit Exchange"
      >
        <svg
          viewBox="0 0 24 24"
          width={innerSize}
          height={innerSize}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bybit stylized "B" glyph in White */}
          <path
            d="M3.5 19V5H10.5C13.5 5 15.2 6.6 15.2 9.2C15.2 10.9 14.1 12 13.2 12.4C14.3 12.8 15.7 13.8 15.7 15.9C15.7 18.7 13.8 19 10.5 19H3.5ZM5.8 11.5H9.8C11.1 11.5 11.9 10.8 11.9 9.7C11.9 8.6 11.1 7.9 9.8 7.9H5.8V11.5ZM5.8 13.5V17.1H10.1C11.5 17.1 12.3 16.3 12.3 15.3C12.3 14.3 11.5 13.5 10.1 13.5H5.8Z"
            fill="#FFFFFF"
          />
          {/* Signature Bybit Vivid Yellow-Orange Vertical Accent Bar */}
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
        title="OKX Exchange"
      >
        <svg
          viewBox="0 0 24 24"
          width={innerSize}
          height={innerSize}
          fill="#FFFFFF"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Official OKX 5-Square Checkerboard & Typography */}
          <path d="M 7.15 8.685 C 7.18 8.705 7.2 8.745 7.2 8.785 L 7.2 15.225 C 7.2 15.265 7.18 15.305 7.15 15.325 C 7.121 15.355 7.082 15.372 7.04 15.375 L 0.16 15.375 C 0.118 15.372 0.079 15.355 0.05 15.325 C 0.02 15.3 0.002 15.264 0 15.225 L 0 8.785 C 0 8.745 0.02 8.705 0.05 8.685 C 0.079 8.655 0.118 8.638 0.16 8.635 L 7.04 8.635 C 7.08 8.635 7.12 8.655 7.15 8.685 Z M 4.8 11.035 C 4.798 10.996 4.78 10.96 4.75 10.935 C 4.721 10.905 4.682 10.887 4.64 10.885 L 2.56 10.885 C 2.52 10.885 2.481 10.899 2.45 10.925 C 2.42 10.95 2.402 10.986 2.4 11.025 L 2.4 12.975 C 2.4 13.015 2.42 13.055 2.45 13.075 C 2.48 13.115 2.52 13.125 2.56 13.125 L 4.64 13.125 C 4.68 13.125 4.72 13.115 4.75 13.085 C 4.78 13.06 4.798 13.024 4.8 12.985 L 4.8 11.035 Z M 21.6 11.035 L 21.6 12.975 C 21.6 13.065 21.53 13.125 21.44 13.125 L 19.36 13.125 C 19.27 13.125 19.2 13.065 19.2 12.975 L 19.2 11.035 C 19.2 10.955 19.27 10.885 19.36 10.885 L 21.44 10.885 C 21.53 10.885 21.6 10.945 21.6 11.035 Z M 19.2 8.785 L 19.2 10.735 C 19.2 10.815 19.13 10.885 19.04 10.885 L 16.96 10.885 C 16.87 10.885 16.8 10.815 16.8 10.735 L 16.8 8.785 C 16.8 8.705 16.87 8.635 16.96 8.635 L 19.04 8.635 C 19.13 8.635 19.2 8.705 19.2 8.785 Z M 24 8.785 L 24 10.735 C 24 10.815 23.93 10.885 23.84 10.885 L 21.76 10.885 C 21.67 10.885 21.6 10.815 21.6 10.735 L 21.6 8.785 C 21.6 8.705 21.67 8.635 21.76 8.635 L 23.84 8.635 C 23.93 8.635 24 8.705 24 8.785 Z M 19.2 13.285 L 19.2 15.225 C 19.2 15.305 19.13 15.375 19.04 15.375 L 16.96 15.375 C 16.87 15.375 16.8 15.305 16.8 15.225 L 16.8 13.275 C 16.8 13.195 16.87 13.125 16.96 13.125 L 19.04 13.125 C 19.13 13.125 19.2 13.195 19.2 13.275 L 19.2 13.285 Z M 24 13.285 L 24 15.225 C 24 15.305 23.93 15.375 23.84 15.375 L 21.76 15.375 C 21.67 15.375 21.6 15.305 21.6 15.225 L 21.6 13.275 C 21.6 13.195 21.67 13.125 21.76 13.125 L 23.84 13.125 C 23.93 13.125 24 13.195 24 13.275 L 24 13.285 Z M 15.6 8.785 L 15.6 10.735 C 15.6 10.815 15.53 10.885 15.44 10.885 L 13.36 10.885 C 13.27 10.885 13.2 10.815 13.2 10.735 L 13.2 8.785 C 13.2 8.705 13.27 8.635 13.36 8.635 L 15.44 8.635 C 15.53 8.635 15.6 8.705 15.6 8.785 Z M 15.6 13.285 L 15.6 15.225 C 15.6 15.305 15.53 15.375 15.44 15.375 L 13.36 15.375 C 13.27 15.375 13.2 15.305 13.2 15.225 L 13.2 13.275 C 13.2 13.195 13.27 13.125 13.36 13.125 L 15.44 13.125 C 15.53 13.125 15.6 13.195 15.6 13.275 L 15.6 13.285 Z M 13.2 12.985 C 13.195 13.069 13.125 13.135 13.04 13.135 L 10.8 13.135 L 10.8 15.215 C 10.8 15.255 10.78 15.295 10.75 15.325 C 10.719 15.351 10.68 15.365 10.64 15.365 L 8.56 15.365 C 8.516 15.368 8.473 15.353 8.44 15.325 C 8.414 15.298 8.399 15.262 8.4 15.225 L 8.4 8.775 C 8.4 8.735 8.41 8.695 8.44 8.675 C 8.472 8.643 8.515 8.625 8.56 8.625 L 10.64 8.625 C 10.68 8.625 10.72 8.645 10.75 8.675 C 10.78 8.695 10.8 8.735 10.8 8.775 L 10.8 10.875 L 13.04 10.875 C 13.08 10.875 13.12 10.885 13.15 10.915 C 13.18 10.945 13.2 10.985 13.2 11.015 L 13.2 12.965 L 13.2 12.985 Z" />
        </svg>
      </span>
    );
  }

  // 4. COLD STORAGE / HARDWARE WALLET (LEDGER / TREZOR)
  if (norm === 'WALLET' || norm.includes('LEDGER') || norm.includes('COLD') || norm.includes('TREZOR')) {
    return (
      <span
        className={`exchange-icon exchange-cold-wallet ${className}`}
        style={{
          ...badgeStyle,
          backgroundColor: showBadgeBackground ? 'rgba(0, 199, 190, 0.12)' : 'transparent',
          border: showBadgeBackground ? '1px solid rgba(0, 199, 190, 0.35)' : 'none',
        }}
        title="Cold Storage Vault"
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
          {/* Hardware Key / Vault Bracket */}
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="16" r="1.5" fill="#00C7BE" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </span>
    );
  }

  // 5. MANUAL / OTHER SPOT WALLET
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
