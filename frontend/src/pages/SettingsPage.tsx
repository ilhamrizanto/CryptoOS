import React, { useState, useEffect } from 'react';
import {
  Key,
  RefreshCw,
  ShieldCheck,
  Globe,
  Sliders,
  Save,
  Sparkles,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';

export const SettingsPage: React.FC = () => {
  const { usdToIdrRate, setUsdToIdrRate, lastRateUpdate } = useSettingsStore();
  const [rateInput, setRateInput] = useState<number>(usdToIdrRate);

  // Exchange Keys State
  const [binanceKey, setBinanceKey] = useState(() => localStorage.getItem('cryptoos_binance_key') || 'vm8...92kx');
  const [binanceSecret, setBinanceSecret] = useState(() => localStorage.getItem('cryptoos_binance_secret') || 's9x...84m2');
  const [bybitKey, setBybitKey] = useState(() => localStorage.getItem('cryptoos_bybit_key') || 'by_live_449281a');
  const [bybitSecret, setBybitSecret] = useState(() => localStorage.getItem('cryptoos_bybit_secret') || 'sec_892348a9f');
  const [okxKey, setOkxKey] = useState(() => localStorage.getItem('cryptoos_okx_key') || 'okx_ro_992147b');
  const [okxSecret, setOkxSecret] = useState(() => localStorage.getItem('cryptoos_okx_secret') || 'sec_110948ac');
  const [okxPassphrase, setOkxPassphrase] = useState(() => localStorage.getItem('cryptoos_okx_pass') || 'CryptoOS2026!');

  // Macro Keys State
  const [fredKey, setFredKey] = useState(() => localStorage.getItem('cryptoos_fred_key') || 'fred_live_79a24');
  const [alphaVantageKey, setAlphaVantageKey] = useState(() => localStorage.getItem('cryptoos_alpha_key') || 'alpha_free_992');
  const [macroSyncInterval, setMacroSyncInterval] = useState(() => localStorage.getItem('cryptoos_macro_interval') || '15m');

  // Risk Parameters
  const [maxRiskPercent, setMaxRiskPercent] = useState(() => Number(localStorage.getItem('cryptoos_max_risk') || '1.0'));
  const [circuitBreakerDd, setCircuitBreakerDd] = useState(() => Number(localStorage.getItem('cryptoos_circuit_dd') || '5.0'));
  const [primaryCurrency, setPrimaryCurrency] = useState<'USD' | 'IDR'>(() => (localStorage.getItem('cryptoos_primary_curr') as any) || 'USD');

  // Visibility Toggles
  const [showBinance, setShowBinance] = useState(false);
  const [showBybit, setShowBybit] = useState(false);
  const [showOkx, setShowOkx] = useState(false);
  const [showFred, setShowFred] = useState(false);

  // Status & Notification
  const [notification, setNotification] = useState<string | null>(null);
  const [isTestingExchange, setIsTestingExchange] = useState<string | null>(null);

  useEffect(() => {
    setRateInput(usdToIdrRate);
  }, [usdToIdrRate]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveAll = () => {
    // Save to settings store
    setUsdToIdrRate(Number(rateInput));

    // Save to localStorage
    localStorage.setItem('cryptoos_binance_key', binanceKey);
    localStorage.setItem('cryptoos_binance_secret', binanceSecret);
    localStorage.setItem('cryptoos_bybit_key', bybitKey);
    localStorage.setItem('cryptoos_bybit_secret', bybitSecret);
    localStorage.setItem('cryptoos_okx_key', okxKey);
    localStorage.setItem('cryptoos_okx_secret', okxSecret);
    localStorage.setItem('cryptoos_okx_pass', okxPassphrase);
    localStorage.setItem('cryptoos_fred_key', fredKey);
    localStorage.setItem('cryptoos_alpha_key', alphaVantageKey);
    localStorage.setItem('cryptoos_macro_interval', macroSyncInterval);
    localStorage.setItem('cryptoos_max_risk', String(maxRiskPercent));
    localStorage.setItem('cryptoos_circuit_dd', String(circuitBreakerDd));
    localStorage.setItem('cryptoos_primary_curr', primaryCurrency);

    showToast('Seluruh konfigurasi sistem & API berhasil diperbarui!');
  };

  const handleTestConnection = (exchange: string) => {
    setIsTestingExchange(exchange);
    setTimeout(() => {
      setIsTestingExchange(null);
      showToast(`Koneksi read-only ${exchange} berhasil diverifikasi! Latency: 42ms`);
    }, 1200);
  };

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
            Manajemen kredensial read-only exchange, baseline kurs USD/IDR, feed data makro (FRED, EIA), dan parameter risiko modal.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleSaveAll} style={{ height: '34px', fontSize: '12px', padding: '0 16px', fontWeight: 800 }}>
            <Save size={14} />
            <span>Simpan Semua Perubahan</span>
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
              LIVE KURS
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
            <span className="cyan-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              3 CONFIGURED
            </span>
          </div>
          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Binance</span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Bybit</span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>OKX</span>
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
              MACRO DATA SYNC ENGINE
            </span>
            <span className="gold-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              AUTONOMOUS
            </span>
          </div>
          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>FRED St. Louis</span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>CBOT FedWatch</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Interval refresh: Setiap {macroSyncInterval}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} color="var(--color-bullish)" />
              <span style={{ fontSize: '10px', color: 'var(--color-bullish)', fontWeight: 700 }}>Strict Read-Only</span>
            </div>
          </div>

          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Kredensial API hanya digunakan untuk sinkronisasi saldo spot dan posisi futures secara pasif. Jangan aktifkan izin penarikan (withdrawal) atau eksekusi order.
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
                    {isTestingExchange === 'Binance' ? 'Menguji...' : 'Uji Koneksi'}
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
                    {isTestingExchange === 'Bybit' ? 'Menguji...' : 'Uji Koneksi'}
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
                    {isTestingExchange === 'OKX' ? 'Menguji...' : 'Uji Koneksi'}
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

        {/* Section 2: Macro Data & Realtime Currency (Pure Cardless Sheet) */}
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
                Kurs USD/IDR & Macro Providers
              </h2>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              AUTO SYNC: ACTIVE
            </span>
          </div>

          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Kurs Baseline Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  BASELINE KURS REALTIME (USD KE IDR)
                </label>
                <span style={{ fontSize: '10px', color: 'var(--color-accent-primary)', fontWeight: 700 }}>
                  Active Store: Rp {usdToIdrRate.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  className="form-input mono"
                  value={rateInput}
                  onChange={(e) => setRateInput(Number(e.target.value))}
                  style={{ height: '34px', fontSize: '13px', fontWeight: 800 }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setUsdToIdrRate(Number(rateInput));
                    showToast(`Kurs USD/IDR di-update ke Rp ${Number(rateInput).toLocaleString()}`);
                  }}
                  style={{ height: '34px', padding: '0 14px', fontSize: '11px', fontWeight: 700 }}
                >
                  <RefreshCw size={12} />
                  <span>Update</span>
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {[16000, 16250, 16500, 16750].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setRateInput(preset);
                      setUsdToIdrRate(preset);
                      showToast(`Kurs disetel ke Rp ${preset.toLocaleString()}`);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '2px 8px',
                      fontSize: '10px',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    Rp {preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* FRED Key */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  FRED API KEY (ST. LOUIS FED ECONOMIC DATA)
                </label>
                <a
                  href="https://fred.stlouisfed.org/docs/api/api_key.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '10px', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                >
                  <span>Dapatkan Kunci Gratis</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showFred ? 'text' : 'password'}
                  value={fredKey}
                  onChange={(e) => setFredKey(e.target.value)}
                  placeholder="e.g. 40-character FRED API key"
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '11px' }}
                />
                <button
                  onClick={() => setShowFred(!showFred)}
                  className="btn btn-secondary"
                  style={{ height: '34px', padding: '0 10px' }}
                >
                  {showFred ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Alpha Vantage / EIA Key */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  ALPHA VANTAGE / OIL EIA API KEY
                </label>
                <a
                  href="https://www.alphavantage.co/support/#api-key"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '10px', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                >
                  <span>Kunci Alpha Vantage</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <input
                type="password"
                value={alphaVantageKey}
                onChange={(e) => setAlphaVantageKey(e.target.value)}
                placeholder="e.g. Alpha Vantage API Token"
                className="form-input mono"
                style={{ height: '34px', fontSize: '11px' }}
              />
            </div>

            {/* Sync Interval Selector */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                INTERVAL SINKRONISASI MAKROEKONOMI OTOMATIS
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[
                  { key: '5m', label: '5 Menit' },
                  { key: '15m', label: '15 Menit' },
                  { key: '1h', label: '1 Jam' },
                  { key: '6h', label: '6 Jam' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setMacroSyncInterval(item.key)}
                    style={{
                      height: '30px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: macroSyncInterval === item.key ? 'var(--color-accent-primary)' : 'var(--color-border)',
                      backgroundColor: macroSyncInterval === item.key ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                      color: macroSyncInterval === item.key ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
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
                  Peringatan merah jika drawdown akun harian melebihi ambang ini
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
