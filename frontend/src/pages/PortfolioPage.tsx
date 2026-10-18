import React from 'react';
import { PieChart, RefreshCw, Plus } from 'lucide-react';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';

export const PortfolioPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={24} color="var(--color-accent-primary)" />
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Portfolio Tracker</h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Pelacak portofolio multi-exchange (Binance, Bybit, OKX) + Cold Wallet dengan kalkulasi kurs realtime.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary">
            <RefreshCw size={16} />
            <span>Sync Exchange API</span>
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            <span>Add Manual Holding</span>
          </button>
        </div>
      </div>

      {/* Aggregate Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card-panel">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            TOTAL PORTFOLIO NET WORTH
          </span>
          <div style={{ marginTop: '8px' }}>
            <DualCurrencyValue usd={78450} size="xl" sentiment="bullish" />
          </div>
        </div>

        <div className="card-panel">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            BINANCE BALANCE
          </span>
          <div style={{ marginTop: '8px' }}>
            <DualCurrencyValue usd={35200} size="lg" />
          </div>
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-bullish)' }}>API Read-Only Active</span>
        </div>

        <div className="card-panel">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            BYBIT BALANCE
          </span>
          <div style={{ marginTop: '8px' }}>
            <DualCurrencyValue usd={22800} size="lg" />
          </div>
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-bullish)' }}>API Read-Only Active</span>
        </div>

        <div className="card-panel">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            COLD STORAGE (LEDGER)
          </span>
          <div style={{ marginTop: '8px' }}>
            <DualCurrencyValue usd={20450} size="lg" />
          </div>
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)' }}>Manual Holdings</span>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Daftar Aset & Alokasi</h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Auto-refreshed 30s</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                <th style={{ padding: '12px 16px' }}>ASET</th>
                <th style={{ padding: '12px 16px' }}>EXCHANGE</th>
                <th style={{ padding: '12px 16px' }}>JUMLAH</th>
                <th style={{ padding: '12px 16px' }}>HARGA RATA-RATA</th>
                <th style={{ padding: '12px 16px' }}>HARGA SAAT INI</th>
                <th style={{ padding: '12px 16px' }}>NILAI PORTOFOLIO (USD / IDR)</th>
                <th style={{ padding: '12px 16px' }}>PNL</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-border-muted)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#f7931a', fontSize: '18px' }}>₿</span>
                    <span>BTC</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}><span className="neutral-badge">COLD STORAGE</span></td>
                <td style={{ padding: '14px 16px' }} className="value-number">0.4200 BTC</td>
                <td style={{ padding: '14px 16px' }} className="value-number">$62,400</td>
                <td style={{ padding: '14px 16px' }} className="value-number">$94,500</td>
                <td style={{ padding: '14px 16px' }}><DualCurrencyValue usd={39690} size="sm" layout="row" /></td>
                <td style={{ padding: '14px 16px', fontWeight: 600 }} className="value-number bullish-text">+51.4%</td>
              </tr>

              <tr style={{ borderBottom: '1px solid var(--color-border-muted)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#627eea', fontSize: '18px' }}>Ξ</span>
                    <span>ETH</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}><span className="bullish-badge">BINANCE</span></td>
                <td style={{ padding: '14px 16px' }} className="value-number">7.0500 ETH</td>
                <td style={{ padding: '14px 16px' }} className="value-number">$2,450</td>
                <td style={{ padding: '14px 16px' }} className="value-number">$2,780</td>
                <td style={{ padding: '14px 16px' }}><DualCurrencyValue usd={19599} size="sm" layout="row" /></td>
                <td style={{ padding: '14px 16px', fontWeight: 600 }} className="value-number bullish-text">+13.4%</td>
              </tr>

              <tr>
                <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#14f195', fontSize: '18px' }}>◎</span>
                    <span>SOL</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}><span className="bullish-badge">BYBIT</span></td>
                <td style={{ padding: '14px 16px' }} className="value-number">62.000 SOL</td>
                <td style={{ padding: '14px 16px' }} className="value-number">$145</td>
                <td style={{ padding: '14px 16px' }} className="value-number">$188.5</td>
                <td style={{ padding: '14px 16px' }}><DualCurrencyValue usd={11687} size="sm" layout="row" /></td>
                <td style={{ padding: '14px 16px', fontWeight: 600 }} className="value-number bullish-text">+30.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
