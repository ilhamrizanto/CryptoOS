import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Globe,
  Sliders,
  Save,
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  Trash2,
} from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { usdToIdrRate, setUsdToIdrRate, lastRateUpdate, syncIntervalMs, setSyncIntervalMs } = useSettingsStore();
  const [rateInput, setRateInput] = useState<number>(usdToIdrRate);

  // Exchange Keys State - default completely empty (no mock data)
  const [binanceKey, setBinanceKey] = useState(() => {
    const val = localStorage.getItem('cryptoos_binance_key');
    return val && val !== 'vm8...92kx' ? val : '';
  });
  const [binanceSecret, setBinanceSecret] = useState(() => {
    const val = localStorage.getItem('cryptoos_binance_secret');
    return val && val !== 's9x...84m2' ? val : '';
  });
  const [bybitKey, setBybitKey] = useState(() => {
    const val = localStorage.getItem('cryptoos_bybit_key');
    return val && val !== 'by_live_449281a' ? val : '';
  });
  const [bybitSecret, setBybitSecret] = useState(() => {
    const val = localStorage.getItem('cryptoos_bybit_secret');
    return val && val !== 'sec_892348a9f' ? val : '';
  });
  const [okxKey, setOkxKey] = useState(() => {
    const val = localStorage.getItem('cryptoos_okx_key');
    return val && val !== 'okx_ro_992147b' ? val : '';
  });
  const [okxSecret, setOkxSecret] = useState(() => {
    const val = localStorage.getItem('cryptoos_okx_secret');
    return val && val !== 'sec_110948ac' ? val : '';
  });
  const [okxPassphrase, setOkxPassphrase] = useState(() => {
    const val = localStorage.getItem('cryptoos_okx_pass');
    return val && val !== 'CryptoOS2026!' ? val : '';
  });


  // Risk Parameters
  const [maxRiskPercent, setMaxRiskPercent] = useState(() => Number(localStorage.getItem('cryptoos_max_risk') || '1.0'));
  const [circuitBreakerDd, setCircuitBreakerDd] = useState(() => Number(localStorage.getItem('cryptoos_circuit_dd') || '5.0'));
  const [primaryCurrency, setPrimaryCurrency] = useState<'USD' | 'IDR'>(() => (localStorage.getItem('cryptoos_primary_curr') as any) || 'USD');

  // Visibility Toggles
  const [showBinance, setShowBinance] = useState(false);
  const [showBybit, setShowBybit] = useState(false);
  const [showOkx, setShowOkx] = useState(false);

  // Status & Notification
  const [notification, setNotification] = useState<string | null>(null);
  const [isTestingExchange, setIsTestingExchange] = useState<string | null>(null);

  useEffect(() => {
    setRateInput(usdToIdrRate);
  }, [usdToIdrRate]);

  // Clean out legacy mock keys from localStorage on mount
  useEffect(() => {
    const mockKeys = ['vm8...92kx', 'by_live_449281a', 'okx_ro_992147b'];
    if (mockKeys.includes(localStorage.getItem('cryptoos_binance_key') || '')) {
      localStorage.removeItem('cryptoos_binance_key');
      localStorage.removeItem('cryptoos_binance_secret');
      setBinanceKey('');
      setBinanceSecret('');
    }
    if (mockKeys.includes(localStorage.getItem('cryptoos_bybit_key') || '')) {
      localStorage.removeItem('cryptoos_bybit_key');
      localStorage.removeItem('cryptoos_bybit_secret');
      setBybitKey('');
      setBybitSecret('');
    }
    if (mockKeys.includes(localStorage.getItem('cryptoos_okx_key') || '')) {
      localStorage.removeItem('cryptoos_okx_key');
      localStorage.removeItem('cryptoos_okx_secret');
      localStorage.removeItem('cryptoos_okx_pass');
      setOkxKey('');
      setOkxSecret('');
      setOkxPassphrase('');
    }
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleClearAllExchangeKeys = () => {
    setBinanceKey('');
    setBinanceSecret('');
    setBybitKey('');
    setBybitSecret('');
    setOkxKey('');
    setOkxSecret('');
    setOkxPassphrase('');

    localStorage.removeItem('cryptoos_binance_key');
    localStorage.removeItem('cryptoos_binance_secret');
    localStorage.removeItem('cryptoos_bybit_key');
    localStorage.removeItem('cryptoos_bybit_secret');
    localStorage.removeItem('cryptoos_okx_key');
    localStorage.removeItem('cryptoos_okx_secret');
    localStorage.removeItem('cryptoos_okx_pass');

    showToast('All Exchange API Keys successfully cleared and reset!');
  };

  const handleSaveAll = () => {
    // Save to settings store
    setUsdToIdrRate(Number(rateInput));

    // Save to localStorage or clear if empty
    if (binanceKey) {
      localStorage.setItem('cryptoos_binance_key', binanceKey);
      localStorage.setItem('cryptoos_binance_secret', binanceSecret);
    } else {
      localStorage.removeItem('cryptoos_binance_key');
      localStorage.removeItem('cryptoos_binance_secret');
    }

    if (bybitKey) {
      localStorage.setItem('cryptoos_bybit_key', bybitKey);
      localStorage.setItem('cryptoos_bybit_secret', bybitSecret);
    } else {
      localStorage.removeItem('cryptoos_bybit_key');
      localStorage.removeItem('cryptoos_bybit_secret');
    }

    if (okxKey) {
      localStorage.setItem('cryptoos_okx_key', okxKey);
      localStorage.setItem('cryptoos_okx_secret', okxSecret);
      localStorage.setItem('cryptoos_okx_pass', okxPassphrase);
    } else {
      localStorage.removeItem('cryptoos_okx_key');
      localStorage.removeItem('cryptoos_okx_secret');
      localStorage.removeItem('cryptoos_okx_pass');
    }

    localStorage.setItem('cryptoos_sync_interval', String(syncIntervalMs));
    localStorage.setItem('cryptoos_max_risk', String(maxRiskPercent));
    localStorage.setItem('cryptoos_circuit_dd', String(circuitBreakerDd));
    localStorage.setItem('cryptoos_primary_curr', primaryCurrency);

    showToast('All system configurations and API keys saved successfully!');
  };

  const handleTestConnection = async (exchange: string) => {
    const key = exchange === 'Binance' ? binanceKey : exchange === 'Bybit' ? bybitKey : okxKey;
    const secret = exchange === 'Binance' ? binanceSecret : exchange === 'Bybit' ? bybitSecret : okxSecret;
    const pass = exchange === 'OKX' ? okxPassphrase : undefined;

    setIsTestingExchange(exchange);
    try {
      const res = await api.post<{
        exchange: string;
        isConnected: boolean;
        latencyMs: number;
        authStatus: string;
        errorMessage?: string;
      }>('/portfolio/exchange/test', {
        exchange,
        apiKey: key || undefined,
        apiSecret: secret || undefined,
        passphrase: pass,
      });

      if (res?.isConnected) {
        const authNote = res.authStatus === 'VERIFIED' ? ' • Read-Only Credentials Verified' : '';
        showToast(`${exchange} connection online! Live network latency: ${res.latencyMs}ms${authNote}`);
      } else {
        showToast(`${exchange} connection delayed (${res?.latencyMs}ms): ${res?.errorMessage || 'Server unreachable'}`);
      }
    } catch (err: any) {
      showToast(`Failed to test ${exchange} connection: ${err.message || 'Network error'}`);
    } finally {
      setIsTestingExchange(null);
    }
  };

  const configuredExchanges = [
    binanceKey ? 'Binance' : null,
    bybitKey ? 'Bybit' : null,
    okxKey ? 'OKX' : null,
  ].filter(Boolean) as string[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      {/* Toast Notification */}
      {notification && (
        <div className="terminal-toast toast-enter">
          <Sparkles size={15} color="var(--color-accent-primary)" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header (Cardless Terminal Standard) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.06em' }}>
              ENVIRONMENT & SYSTEM PREFERENCES
            </span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              SECURE WORKSTATION KERNEL
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: '2px 0 0' }}>
            Settings & API Credentials
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
            Manage read-only exchange credentials, USD/IDR currency baseline, macroeconomic feeds (FRED, EIA), and capital risk parameters.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleSaveAll} style={{ height: '34px', fontSize: '12px', padding: '0 16px', fontWeight: 800 }}>
            <Save size={14} />
            <span>Save All Changes</span>
          </button>
        </div>
      </div>

      {/* Top System Status Ribbon (Pure Cardless Sheet) */}
      <div
        className="cardless-sheet"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
        }}
      >
        {/* Cell 1: USD/IDR Baseline */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              ACTIVE USD/IDR BASELINE
            </span>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              LIVE RATE
            </span>
          </div>
          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="mono" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-accent-primary)' }}>
              Rp {usdToIdrRate.toLocaleString()}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>/ 1.00 USD</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Updated: {new Date(lastRateUpdate).toLocaleTimeString()}
          </span>
        </div>

        {/* Cell 2: Exchange Status */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              EXCHANGE READ-ONLY APIS
            </span>
            {configuredExchanges.length > 0 ? (
              <span className="cyan-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                {configuredExchanges.length} CONFIGURED
              </span>
            ) : (
              <span className="neutral-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                OPTIONAL (EMPTY)
              </span>
            )}
          </div>
          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {configuredExchanges.length > 0 ? (
              configuredExchanges.map((ex, i) => (
                <React.Fragment key={ex}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{ex}</span>
                  {i < configuredExchanges.length - 1 && <span style={{ color: 'var(--color-border)' }}>&bull;</span>}
                </React.Fragment>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>No keys configured</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <ShieldCheck size={12} color="var(--color-bullish)" />
            <span style={{ fontSize: '10px', color: 'var(--color-bullish)', fontWeight: 700 }}>
              Zero-Withdrawal Strict Policy
            </span>
          </div>
        </div>

        {/* Cell 3: Macroeconomic Feed */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              DATA FEED ENGINE
            </span>
            <span className="gold-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              AUTONOMOUS
            </span>
          </div>
          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>CoinGecko</span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>ECB Forex</span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>CME FedWatch</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Feed Realtime Otomatis
          </span>
        </div>

        {/* Cell 4: Risk Threshold */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              RISK PROTOCOL LIMIT
            </span>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              CONSERVATIVE
            </span>
          </div>
          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="mono" style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>
              {maxRiskPercent}%
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Max Risk / Trade</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Circuit Breaker: {circuitBreakerDd}% DD Drawdown Stop
          </span>
        </div>
      </div>

      {/* Main Settings Sections Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Section 1: Exchange Read-Only API Keys (Pure Cardless Sheet) */}
        <div
          className="cardless-sheet"
          style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Section Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.01)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={16} color="var(--color-accent-primary)" />
              <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Exchange APIs (Read-Only)
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {(binanceKey || bybitKey || okxKey) && (
                <button
                  type="button"
                  onClick={handleClearAllExchangeKeys}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-bearish)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                  }}
                  title="Clear all exchange API keys"
                >
                  <Trash2 size={12} />
                  <span>Clear Keys</span>
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} color="var(--color-bullish)" />
                <span style={{ fontSize: '10px', color: 'var(--color-bullish)', fontWeight: 700 }}>Strict Read-Only</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              API credentials are strictly optional and only used for automated spot balance synchronization. You can also track your portfolio manually in the Portfolio Tracker without providing API keys.
            </p>

            {/* Binance API */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>BINANCE SPOT & FUTURES</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleTestConnection('Binance')}
                    disabled={isTestingExchange === 'Binance'}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '10px',
                      color: 'var(--color-accent-primary)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    {isTestingExchange === 'Binance' ? 'Testing...' : 'Test Ping'}
                  </button>
                  <button
                    onClick={() => setShowBinance(!showBinance)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                  >
                    {showBinance ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>API KEY</label>
                  <input
                    type={showBinance ? 'text' : 'password'}
                    value={binanceKey}
                    onChange={(e) => setBinanceKey(e.target.value)}
                    placeholder="Binance API Key"
                    className="form-input mono"
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>API SECRET</label>
                  <input
                    type={showBinance ? 'text' : 'password'}
                    value={binanceSecret}
                    onChange={(e) => setBinanceSecret(e.target.value)}
                    placeholder="Binance API Secret"
                    className="form-input mono"
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>
              </div>
            </div>

            {/* Bybit API */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>BYBIT UNIFIED ACCOUNT</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleTestConnection('Bybit')}
                    disabled={isTestingExchange === 'Bybit'}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '10px',
                      color: 'var(--color-accent-primary)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    {isTestingExchange === 'Bybit' ? 'Testing...' : 'Test Ping'}
                  </button>
                  <button
                    onClick={() => setShowBybit(!showBybit)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                  >
                    {showBybit ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>API KEY</label>
                  <input
                    type={showBybit ? 'text' : 'password'}
                    value={bybitKey}
                    onChange={(e) => setBybitKey(e.target.value)}
                    placeholder="Bybit API Key"
                    className="form-input mono"
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>API SECRET</label>
                  <input
                    type={showBybit ? 'text' : 'password'}
                    value={bybitSecret}
                    onChange={(e) => setBybitSecret(e.target.value)}
                    placeholder="Bybit API Secret"
                    className="form-input mono"
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>
              </div>
            </div>

            {/* OKX API */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>OKX TRADING ACCOUNT</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleTestConnection('OKX')}
                    disabled={isTestingExchange === 'OKX'}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '10px',
                      color: 'var(--color-accent-primary)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    {isTestingExchange === 'OKX' ? 'Testing...' : 'Test Ping'}
                  </button>
                  <button
                    onClick={() => setShowOkx(!showOkx)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                  >
                    {showOkx ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>API KEY</label>
                  <input
                    type={showOkx ? 'text' : 'password'}
                    value={okxKey}
                    onChange={(e) => setOkxKey(e.target.value)}
                    placeholder="OKX Key"
                    className="form-input mono"
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>SECRET</label>
                  <input
                    type={showOkx ? 'text' : 'password'}
                    value={okxSecret}
                    onChange={(e) => setOkxSecret(e.target.value)}
                    placeholder="OKX Secret"
                    className="form-input mono"
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>PASSPHRASE</label>
                  <input
                    type={showOkx ? 'text' : 'password'}
                    value={okxPassphrase}
                    onChange={(e) => setOkxPassphrase(e.target.value)}
                    placeholder="Passphrase"
                    className="form-input mono"
                    style={{ height: '32px', fontSize: '11px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Autonomous Market Feeds & Currency Baseline (Pure Cardless Sheet) */}
        <div
          className="cardless-sheet"
          style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Section Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.01)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} color="var(--color-bullish)" />
              <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Autonomous Data Feeds & Kurs Baseline
              </h2>
            </div>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
              LIVE REALTIME FEEDS
            </span>
          </div>

          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              CryptoOS secara mandiri terhubung ke provider global untuk menyajikan kurs, sentimen, dan data tokenomics tanpa memerlukan konfigurasi API manual dari user.
            </p>

            {/* Provider Status Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <div style={{ padding: '10px 12px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>KURS USD/IDR</span>
                  <span style={{ fontSize: '9px', color: 'var(--color-bullish)', fontWeight: 800 }}>LIVE</span>
                </div>
                <div className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                  Rp {usdToIdrRate.toLocaleString()}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  European Central Bank / Open ER
                </div>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>GLOBAL CRYPTO STATS</span>
                  <span style={{ fontSize: '9px', color: 'var(--color-bullish)', fontWeight: 800 }}>CONNECTED</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                  BTC.D & Total3
                </div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  CoinGecko Global Feed
                </div>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>SENTIMEN PASAR</span>
                  <span style={{ fontSize: '9px', color: 'var(--color-bullish)', fontWeight: 800 }}>CONNECTED</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                  Fear & Greed Index
                </div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Alternative.me 14D History
                </div>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>SUKU BUNGA & FOMC</span>
                  <span style={{ fontSize: '9px', color: 'var(--color-accent-primary)', fontWeight: 800 }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                  CME FedWatch Model
                </div>
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  CBOT 30-Day Fed Funds
                </div>
              </div>
            </div>

            {/* Autonomous Engine Status Banner */}
            <div
              style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(212, 175, 55, 0.04)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-bullish)',
                    boxShadow: '0 0 8px var(--color-bullish)',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>
                    Realtime Synchronization Engine Active
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                    USD/IDR exchange rate, macro indicators, and spot prices auto-refresh autonomously in the background.
                  </div>
                </div>
              </div>
              <span className="bullish-badge" style={{ fontSize: '8.5px', padding: '2px 6px', fontWeight: 800 }}>
                {Math.round(syncIntervalMs / 60000)}M CYCLE
              </span>
            </div>

            {/* Sync Interval Selector */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  AUTOMATIC DATA REFRESH INTERVAL
                </label>
                <span style={{ fontSize: '10px', color: 'var(--color-accent-primary)', fontWeight: 800 }}>
                  Active: Every {Math.round(syncIntervalMs / 60000)} Minutes
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {[
                  { ms: 60_000, label: '1 Minute', desc: '1m' },
                  { ms: 300_000, label: '5 Minutes', desc: '5m (Default)' },
                  { ms: 900_000, label: '15 Minutes', desc: '15m' },
                  { ms: 1_800_000, label: '30 Minutes', desc: '30m' },
                  { ms: 3_600_000, label: '1 Hour', desc: '60m' },
                ].map((item) => {
                  const isSelected = syncIntervalMs === item.ms;
                  return (
                    <button
                      key={item.ms}
                      type="button"
                      onClick={() => {
                        setSyncIntervalMs(item.ms);
                        showToast(`Auto-sync interval set to ${item.label}`);
                      }}
                      style={{
                        padding: '8px 4px',
                        fontSize: '11px',
                        fontWeight: isSelected ? 800 : 600,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--color-accent-primary)' : 'var(--color-border)',
                        backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'var(--color-bg-elevated)',
                        color: isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <span>{item.label}</span>
                      <span style={{ fontSize: '8.5px', opacity: 0.7 }}>{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Risk Parameters & Terminal Execution (Pure Cardless Sheet) */}
        <div
          className="cardless-sheet"
          style={{
            gridColumn: '1 / -1',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Section Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.01)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="#f59e0b" />
              <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Risk Engine & Terminal Display Configuration
              </h2>
            </div>
            <span className="bullish-badge" style={{ fontSize: '10px' }}>
              ENFORCED GLOBALLY
            </span>
          </div>

          <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Risk Control 1 */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                DEFAULT RISK PER TRADE (% PORTFOLIO)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  value={maxRiskPercent}
                  onChange={(e) => setMaxRiskPercent(Number(e.target.value))}
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '12px', width: '120px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  Digunakan sebagai default di Sizer Position Calculator
                </span>
              </div>
            </div>

            {/* Risk Control 2 */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                CIRCUIT BREAKER DRAWDOWN LIMIT (%)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  step="0.5"
                  min="1.0"
                  max="20.0"
                  value={circuitBreakerDd}
                  onChange={(e) => setCircuitBreakerDd(Number(e.target.value))}
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '12px', width: '120px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  Red alert triggered if daily account drawdown exceeds this threshold
                </span>
              </div>
            </div>

            {/* Display Control 3 */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                PRIMARY CURRENCY DISPLAY LAYOUT
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPrimaryCurrency('USD')}
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: primaryCurrency === 'USD' ? 'var(--color-accent-primary)' : 'var(--color-border)',
                    backgroundColor: primaryCurrency === 'USD' ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                    color: primaryCurrency === 'USD' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  USD Dominant ($)
                </button>
                <button
                  onClick={() => setPrimaryCurrency('IDR')}
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: primaryCurrency === 'IDR' ? 'var(--color-accent-primary)' : 'var(--color-border)',
                    backgroundColor: primaryCurrency === 'IDR' ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                    color: primaryCurrency === 'IDR' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  IDR Dominant (Rp)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
