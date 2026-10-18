import React from 'react';
import { SlidersHorizontal, AlertCircle, ArrowRightLeft } from 'lucide-react';

export const RebalancingPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={24} color="var(--color-accent-primary)" />
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Portfolio Rebalancing Matrix</h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
          Matriks alokasi target vs bobot riil saat ini (rebalance time-based 1-2 bulan atau deviasi threshold).
        </p>
      </div>

      {/* Rebalance Status Notice */}
      <div
        style={{
          padding: 'var(--space-4)',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={22} color="var(--color-neutral)" />
          <div>
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Rebalancing Disarankan: Deviasi SOL melampaui toleransi +5%
            </span>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Kenaikan pesat SOL membuat bobotnya mencapai 14.9% (target 10.0%). Ambil profit untuk menjaga manajemen risiko.
            </p>
          </div>
        </div>

        <button className="btn btn-primary" style={{ padding: '6px 14px' }}>
          <ArrowRightLeft size={16} />
          <span>Generate Rebalance Orders</span>
        </button>
      </div>

      {/* Target Matrix Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {/* BTC */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>Bitcoin (BTC)</span>
            <span className="bullish-badge">TARGET IN-RANGE</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Target Alokasi:</span>
            <span className="value-number" style={{ fontWeight: 700 }}>50.0%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Bobot Aktual:</span>
            <span className="value-number" style={{ fontWeight: 700 }}>50.6%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Deviasi:</span>
            <span className="value-number bullish-text">+0.6% (Ideal)</span>
          </div>
        </div>

        {/* ETH */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>Ethereum (ETH)</span>
            <span className="neutral-badge">UNDERWEIGHT</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Target Alokasi:</span>
            <span className="value-number" style={{ fontWeight: 700 }}>25.0%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Bobot Aktual:</span>
            <span className="value-number" style={{ fontWeight: 700 }}>24.9%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Deviasi:</span>
            <span className="value-number bearish-text">-0.1%</span>
          </div>
        </div>

        {/* SOL */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>Solana (SOL)</span>
            <span className="bearish-badge">OVERWEIGHT +4.9%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Target Alokasi:</span>
            <span className="value-number" style={{ fontWeight: 700 }}>10.0%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Bobot Aktual:</span>
            <span className="value-number" style={{ fontWeight: 700 }}>14.9%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Rekomendasi:</span>
            <span style={{ color: 'var(--color-neutral)', fontWeight: 600 }}>Jual $3,840 SOL &rarr; Cash</span>
          </div>
        </div>

        {/* Cash / Stables */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>USDT / Cash Reserve</span>
            <span className="neutral-badge">UNDERWEIGHT</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Target Alokasi:</span>
            <span className="value-number" style={{ fontWeight: 700 }}>15.0%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Bobot Aktual:</span>
            <span className="value-number" style={{ fontWeight: 700 }}>9.6%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Rekomendasi:</span>
            <span style={{ color: 'var(--color-accent-primary)', fontWeight: 600 }}>Tambah Cadangan Kas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
