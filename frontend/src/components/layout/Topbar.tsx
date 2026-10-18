import React from 'react';
import { Menu, Activity } from 'lucide-react';
import { useUiStore } from '../../store/ui.store';
import { useSettingsStore } from '../../store/settings.store';
import { formatUsd, formatIdr } from '../../utils/formatters';
import { DataStatusBadge } from '../ui/DataStatusBadge';

export const Topbar: React.FC = () => {
  const { toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUiStore();
  const { usdToIdrRate } = useSettingsStore();

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-4)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Brand & Mobile Menu Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          className="btn btn-secondary mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
          style={{ padding: '6px', minHeight: 'unset', display: 'none' }}
        >
          <Menu size={18} />
        </button>

        <button
          className="btn btn-secondary desktop-collapse-btn"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar collapse"
          style={{ padding: '6px', minHeight: 'unset' }}
        >
          <Activity size={18} color="var(--color-accent-primary)" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: 'var(--text-lg)',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            CryptoOS
          </span>
          <span
            style={{
              fontSize: 'var(--text-2xs)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--color-accent-primary)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            v1.0
          </span>
        </div>
      </div>

      {/* Center: Live Ticker Stream (BTC, ETH, SOL) */}
      <div
        className="topbar-tickers"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-5)',
          overflowX: 'auto',
          padding: '0 var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            BTC
          </span>
          <span className="value-number" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
            {formatUsd(94500, 0)}
          </span>
          <span className="value-number bullish-text" style={{ fontSize: 'var(--text-2xs)' }}>
            +2.4%
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            ETH
          </span>
          <span className="value-number" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
            {formatUsd(2780, 0)}
          </span>
          <span className="value-number bearish-text" style={{ fontSize: 'var(--text-2xs)' }}>
            -0.8%
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            SOL
          </span>
          <span className="value-number" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
            {formatUsd(188.5, 1)}
          </span>
          <span className="value-number bullish-text" style={{ fontSize: 'var(--text-2xs)' }}>
            +4.1%
          </span>
        </div>
      </div>

      {/* Right: Realtime USD/IDR rate & Connection Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            backgroundColor: 'var(--color-bg-base)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
          }}
          title="Kurs Realtime USD ke IDR"
        >
          <span style={{ color: 'var(--color-text-muted)' }}>USD/IDR:</span>
          <span className="value-number" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
            {formatIdr(usdToIdrRate)}
          </span>
        </div>

        <DataStatusBadge status="live" label="FEED READY" />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .topbar-tickers {
            display: none !important;
          }
          .mobile-menu-btn {
            display: inline-flex !important;
          }
          .desktop-collapse-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
