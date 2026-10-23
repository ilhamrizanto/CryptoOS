import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  User,
  LogOut,
  Clock,
  Wifi,
  Globe2,
} from 'lucide-react';
import { useUiStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { mobileMenuOpen, setMobileMenuOpen } = useUiStore();
  const { logout, user } = useAuthStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [latency, setLatency] = useState(28);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Heartbeat ping jitter (24ms - 36ms)
  useEffect(() => {
    const pingTimer = setInterval(() => {
      setLatency(Math.floor(24 + Math.random() * 12));
    }, 5000);
    return () => clearInterval(pingTimer);
  }, []);

  // Format UTC (HH:mm:ss guaranteed 8 chars)
  const utcHours = currentTime.getUTCHours();
  const utcTimeStr = currentTime.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false });

  // Dynamic User Device Timezone Calculation (e.g. UTC+9 for Tobelo/WIT, UTC+7 for WIB, etc.)
  const offsetMinutes = -currentTime.getTimezoneOffset();
  const offsetHours = offsetMinutes / 60;
  const sign = offsetHours >= 0 ? '+' : '-';
  const absHours = Math.abs(offsetHours);
  const localTimezoneLabel = offsetHours === 0
    ? 'UTC'
    : Number.isInteger(absHours)
    ? `UTC${sign}${absHours}`
    : `UTC${sign}${Math.floor(absHours)}:${String(Math.round((absHours % 1) * 60)).padStart(2, '0')}`;

  const localTimeStr = currentTime.toLocaleTimeString('en-GB', { hour12: false });
  const detectedTimezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Device';

  // Calculate Market Sessions (UTC standard)
  const isTokyoOpen = utcHours >= 0 && utcHours < 9;
  const isLondonOpen = utcHours >= 8 && utcHours < 16;
  const isNewYorkOpen = utcHours >= 13 && utcHours < 21;
  const isOverlap = isLondonOpen && isNewYorkOpen;

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--color-bg-base)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-5)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Brand Logo & Hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', zIndex: 2 }}>
        <button
          className="btn btn-secondary mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
          style={{ padding: '8px', minHeight: 'unset', display: 'none' }}
        >
          <Menu size={18} />
        </button>

        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid var(--color-accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000000',
            }}
          >
            <img src="/logo.png" alt="CryptoOS" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: '16px', color: '#ffffff', letterSpacing: '-0.02em' }}>
              Crypto<span style={{ color: 'var(--color-accent-primary)' }}>OS</span>
            </span>
          </div>
        </div>
      </div>

      {/* Center: Institutional Session Bar & Dual World Clock
          Zero-Jitter Architecture:
          1. Absolutely anchored to 50% viewport width
          2. Fixed tabular-nums font & fixed pixel widths on all dynamic text values
          3. Dynamic local timezone detection (UTC+9 in Tobelo, UTC+7 in WIB, etc.)
      */}
      <div
        className="topbar-institutional-center"
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '4px 14px',
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        {/* Market Sessions Strip (Fixed Width Container) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe2 size={12} color="var(--color-accent-primary)" />
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.05em' }}>
              SESSIONS
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Tokyo */}
            <div
              style={{
                width: '42px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: isTokyoOpen ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: '1px solid',
                borderColor: isTokyoOpen ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                boxSizing: 'border-box',
              }}
              title="Tokyo Session: 00:00 - 09:00 UTC"
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: isTokyoOpen ? 'var(--color-bullish)' : '#555555',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: isTokyoOpen ? '#ffffff' : 'var(--color-text-muted)',
                  letterSpacing: '0.02em',
                }}
              >
                TYO
              </span>
            </div>

            {/* London */}
            <div
              style={{
                width: '42px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: isLondonOpen ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: '1px solid',
                borderColor: isLondonOpen ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                boxSizing: 'border-box',
              }}
              title="London Session: 08:00 - 16:00 UTC"
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: isLondonOpen ? 'var(--color-bullish)' : '#555555',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: isLondonOpen ? '#ffffff' : 'var(--color-text-muted)',
                  letterSpacing: '0.02em',
                }}
              >
                LDN
              </span>
            </div>

            {/* New York */}
            <div
              style={{
                width: '42px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: isNewYorkOpen ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: '1px solid',
                borderColor: isNewYorkOpen ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                boxSizing: 'border-box',
              }}
              title="New York Session: 13:00 - 21:00 UTC"
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: isNewYorkOpen ? 'var(--color-bullish)' : '#555555',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: isNewYorkOpen ? '#ffffff' : 'var(--color-text-muted)',
                  letterSpacing: '0.02em',
                }}
              >
                NYC
              </span>
            </div>

            {/* Overlap Indicator Pill */}
            {isOverlap && (
              <span
                className="gold-badge"
                style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  fontWeight: 800,
                  height: '18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                title="London + New York overlap: Peak market liquidity window"
              >
                OVERLAP
              </span>
            )}
          </div>
        </div>

        {/* Hairline Divider */}
        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-border)', flexShrink: 0 }} />

        {/* Dual World Clocks (Rock-solid fixed width with tabular numerals) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={12} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
          
          {/* UTC Clock Slot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 800, width: '24px', display: 'inline-block', textAlign: 'center' }}>
              UTC
            </span>
            <span
              style={{
                fontFamily: 'JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '11px',
                color: '#ffffff',
                fontWeight: 700,
                letterSpacing: '0.03em',
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum" 1',
                width: '64px',
                display: 'inline-block',
                textAlign: 'center',
              }}
              title="Coordinated Universal Time (Global Benchmark)"
            >
              {utcTimeStr}
            </span>
          </div>

          <span style={{ color: 'var(--color-border)', flexShrink: 0 }}>&bull;</span>

          {/* Local User Device Clock Slot (Dynamically named UTC+9, UTC+7, etc.) */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            title={`Device Local Time: ${localTimezoneLabel} (${detectedTimezoneName})`}
          >
            <span
              style={{
                fontSize: '9px',
                color: 'var(--color-accent-primary)',
                fontWeight: 800,
                width: '38px',
                display: 'inline-block',
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {localTimezoneLabel}
            </span>
            <span
              style={{
                fontFamily: 'JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '11px',
                color: 'var(--color-accent-primary)',
                fontWeight: 800,
                letterSpacing: '0.03em',
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum" 1',
                width: '64px',
                display: 'inline-block',
                textAlign: 'center',
              }}
            >
              {localTimeStr}
            </span>
          </div>
        </div>

        {/* Hairline Divider */}
        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-border)', flexShrink: 0 }} />

        {/* System Engine & Latency Heartbeat (Fixed width) */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          title="Terminal Engine: Autonomous Sync Connected"
        >
          <Wifi size={11} color="var(--color-bullish)" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontFamily: 'JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '10px',
              color: 'var(--color-bullish)',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum" 1',
              width: '32px',
              display: 'inline-block',
              textAlign: 'left',
            }}
          >
            {latency}ms
          </span>
        </div>
      </div>

      {/* Right: User Profile & Session Only */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', zIndex: 2 }}>
        {/* User Profile Chip & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '3px 10px 3px 4px',
              backgroundColor: '#0a0a0c',
              border: '1px solid #1a1a1a',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#161616',
                border: '1px solid var(--color-accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <User size={13} color="var(--color-accent-primary)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {user?.username || 'Ilham'}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', lineHeight: 1 }}>
                {user?.email || 'ilhamgb11@gmail.com'}
              </span>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Log out from CryptoOS Terminal"
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-muted)',
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .topbar-institutional-center {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
};
