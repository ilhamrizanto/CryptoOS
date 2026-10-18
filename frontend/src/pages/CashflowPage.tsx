import React from 'react';
import { ArrowLeftRight, TrendingUp, ArrowDownLeft, ArrowUpRight, Plus, Coins } from 'lucide-react';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';

export const CashflowPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeftRight size={24} color="var(--color-accent-primary)" />
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Treasury & Cashflow Ledger</h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Buku kas modal riil: Rekap setoran (deposit), penarikan (withdrawal), dan hasil staking (yield).
          </p>
        </div>

        <button className="btn btn-primary">
          <Plus size={16} />
          <span>Log Transaksi Kas</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowDownLeft size={16} color="var(--color-bullish)" />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              TOTAL DEPOSIT (MODAL MASUK)
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <DualCurrencyValue usd={50000} size="lg" />
          </div>
        </div>

        <div className="card-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpRight size={16} color="var(--color-neutral)" />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              TOTAL WITHDRAWAL (PENARIKAN)
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <DualCurrencyValue usd={12000} size="lg" />
          </div>
        </div>

        <div className="card-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="var(--color-accent-primary)" />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              NET PRINCIPAL INVESTED
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <DualCurrencyValue usd={38000} size="lg" sentiment="bullish" />
          </div>
        </div>

        <div className="card-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Coins size={16} color="#f59e0b" />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              STAKING YIELD & REWARDS
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <DualCurrencyValue usd={2450} size="lg" sentiment="bullish" />
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Riwayat Mutasi Kas Riil</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                <th style={{ padding: '12px 16px' }}>TANGGAL</th>
                <th style={{ padding: '12px 16px' }}>TIPE</th>
                <th style={{ padding: '12px 16px' }}>EXCHANGE / SUMBER</th>
                <th style={{ padding: '12px 16px' }}>NILAI USD & IDR</th>
                <th style={{ padding: '12px 16px' }}>CATATAN</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-border-muted)' }}>
                <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)' }} className="value-number">2026-10-15</td>
                <td style={{ padding: '14px 16px' }}><span className="bullish-badge">STAKING YIELD</span></td>
                <td style={{ padding: '14px 16px' }}>Solana Native Validator</td>
                <td style={{ padding: '14px 16px' }}><DualCurrencyValue usd={320} size="sm" layout="row" sentiment="bullish" /></td>
                <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)' }}>Epoch 680 rewards</td>
              </tr>

              <tr style={{ borderBottom: '1px solid var(--color-border-muted)' }}>
                <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)' }} className="value-number">2026-10-01</td>
                <td style={{ padding: '14px 16px' }}><span className="neutral-badge">WITHDRAWAL</span></td>
                <td style={{ padding: '14px 16px' }}>Binance &rarr; Bank BCA</td>
                <td style={{ padding: '14px 16px' }}><DualCurrencyValue usd={2000} size="sm" layout="row" sentiment="bearish" /></td>
                <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)' }}>Ambil profit bulanan</td>
              </tr>

              <tr>
                <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)' }} className="value-number">2026-09-10</td>
                <td style={{ padding: '14px 16px' }}><span className="bullish-badge">DEPOSIT</span></td>
                <td style={{ padding: '14px 16px' }}>Bank BCA &rarr; Bybit</td>
                <td style={{ padding: '14px 16px' }}><DualCurrencyValue usd={5000} size="sm" layout="row" sentiment="bullish" /></td>
                <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)' }}>Tambah modal DCA</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
