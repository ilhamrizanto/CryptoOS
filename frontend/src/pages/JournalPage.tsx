import React, { useState } from 'react';
import { BookOpen, Smile, Image as ImageIcon, Plus } from 'lucide-react';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';

export const JournalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={24} color="var(--color-accent-primary)" />
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Trading Journal & Psychology</h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Rekap posisi trading, live PnL, psikologi emosional saat entry, dan evaluasi pembelajaran.
          </p>
        </div>

        <button className="btn btn-primary">
          <Plus size={16} />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Analytics Summary Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card-panel">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            REALIZED NET PNL
          </span>
          <div style={{ marginTop: '6px' }}>
            <DualCurrencyValue usd={4820} size="lg" sentiment="bullish" />
          </div>
          <span className="bullish-text" style={{ fontSize: 'var(--text-xs)', marginTop: '4px', display: 'block' }}>
            +18.4% Account Growth
          </span>
        </div>

        <div className="card-panel">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            WIN RATE & PROFIT FACTOR
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
            <span className="value-number" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#10b981' }}>
              68.4%
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>PF: 2.45</span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
            13 Menang / 6 Kalah
          </span>
        </div>

        <div className="card-panel">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            AVERAGE R-MULTIPLE
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
            <span className="value-number bullish-text" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              +2.8 R
            </span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
            Disiplin Cut-loss ketat
          </span>
        </div>

        <div className="card-panel">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            EMOTIONAL DISCIPLINE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <Smile size={24} color="var(--color-bullish)" />
            <span style={{ fontWeight: 700, color: 'var(--color-bullish)' }}>Tenang & Terencana</span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
            0% FOMO entries minggu ini
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '2px' }}>
        <button
          className={`btn ${activeTab === 'OPEN' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('OPEN')}
          style={{ minHeight: '36px' }}
        >
          Posisi Aktif (1 Terbuka)
        </button>
        <button
          className={`btn ${activeTab === 'CLOSED' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('CLOSED')}
          style={{ minHeight: '36px' }}
        >
          Riwayat Transaksi Selesai (19 Trades)
        </button>
      </div>

      {/* Journal Table / Cards */}
      <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="bullish-badge">LONG</span>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>SOLUSDT • Perp 5x</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Entry: $185.00 • SL: $177.60 • TP: $205.00
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)' }}>UNREALIZED PNL</span>
              <DualCurrencyValue usd={320} size="md" sentiment="bullish" />
            </div>
          </div>

          {/* Psychology & Evidence Drawer */}
          <div
            style={{
              marginTop: 'var(--space-3)',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent-primary)' }}>
                Status Psikologis Saat Entry:
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>
                "Sangat tenang, menunggu liquidity sweep selesai di low sesi London sebelum pasang limit buy. Tidak terburu-buru."
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                <ImageIcon size={14} /> 2 Bukti Terlampir (Coinglass CVD + 4H Chart)
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: 'var(--text-2xs)', minHeight: 'unset' }}
              >
                Lihat Screenshot
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
