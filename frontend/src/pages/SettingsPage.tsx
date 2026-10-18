import React, { useState } from 'react';
import { Settings, Key, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';

export const SettingsPage: React.FC = () => {
  const { usdToIdrRate, setUsdToIdrRate } = useSettingsStore();
  const [rateInput, setRateInput] = useState<number>(usdToIdrRate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={24} color="var(--color-accent-primary)" />
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Settings & API Configuration</h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
          Manajemen kredensial read-only exchange, API makroekonomi, dan preferensi kurs realtime.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Section 1: Exchange Read-Only APIs */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            <Key size={18} color="var(--color-accent-primary)" />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Exchange APIs (Read-Only)</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                BINANCE API KEY
              </label>
              <input type="password" placeholder="••••••••••••••••••••••••••••••" className="form-input mono" />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                BYBIT API KEY
              </label>
              <input type="password" placeholder="••••••••••••••••••••••••••••••" className="form-input mono" />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                OKX API KEY
              </label>
              <input type="password" placeholder="••••••••••••••••••••••••••••••" className="form-input mono" />
            </div>

            <button className="btn btn-primary" style={{ marginTop: 'var(--space-2)' }}>
              <span>Simpan & Verifikasi Koneksi</span>
            </button>
          </div>
        </div>

        {/* Section 2: Macro Data & Realtime Kurs */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            <RefreshCw size={18} color="var(--color-bullish)" />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Kurs & Provider Makro</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                REALTIME USD/IDR BASELINE (RP)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  className="form-input mono"
                  value={rateInput}
                  onChange={(e) => setRateInput(Number(e.target.value))}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => setUsdToIdrRate(rateInput)}
                  style={{ minHeight: '38px', padding: '0 16px' }}
                >
                  Update
                </button>
              </div>
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                Otomatis di-refresh dari ExchangeRate-API setiap 5 menit
              </span>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                FRED API KEY (ST. LOUIS FED)
              </label>
              <input type="password" placeholder="Kunci gratis fred.stlouisfed.org" className="form-input mono" />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                ALPHA VANTAGE / EIA OIL KEY
              </label>
              <input type="password" placeholder="Kunci gratis alphavantage.co" className="form-input mono" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
