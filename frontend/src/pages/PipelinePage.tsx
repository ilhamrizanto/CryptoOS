import React, { useState } from 'react';
import { Compass, CheckCircle2, Upload, Plus } from 'lucide-react';

export const PipelinePage: React.FC = () => {
  const [ticker, setTicker] = useState('SOLUSDT');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={24} color="var(--color-accent-primary)" />
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Pipeline & Idea Incubator</h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Formulir Analisis Terintegrasi 4-Pilar: Makro, Fundamental, Price Action, & Bukti On-Chain.
          </p>
        </div>

        <button className="btn btn-primary">
          <Plus size={16} />
          <span>New Pipeline Draft</span>
        </button>
      </div>

      {/* Symbol & Direction Selection Bar */}
      <div
        className="card-panel"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
              TOKEN / PAIR TICKER
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="form-input mono"
              style={{ width: '180px', fontWeight: 700 }}
              placeholder="e.g. BTCUSDT"
            />
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
              TRADE DIRECTION
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`btn ${direction === 'LONG' ? 'btn-bullish' : 'btn-secondary'}`}
                onClick={() => setDirection('LONG')}
                style={{ minHeight: '38px', padding: '0 18px' }}
              >
                LONG
              </button>
              <button
                className={`btn ${direction === 'SHORT' ? 'btn-bearish' : 'btn-secondary'}`}
                onClick={() => setDirection('SHORT')}
                style={{ minHeight: '38px', padding: '0 18px' }}
              >
                SHORT
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Status:</span>
          <span className="neutral-badge">INCUBATING DRAFT</span>
        </div>
      </div>

      {/* 4 Pillars Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Pilar 1: Makro Pasar */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#60a5fa' }}>
              1. Pilar Makro Pasar
            </h2>
            <CheckCircle2 size={16} color="var(--color-bullish)" />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Kondisi likuiditas global dan sentimen suku bunga sebelum entry posisi.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>DXY Dollar Trend:</span>
              <span className="bearish-badge">BEARISH (Bullish Crypto)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>CME FedWatch:</span>
              <span className="bullish-badge">86% Rate Cut Target</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>BTC Production Cost:</span>
              <span className="value-number">$68,500 vs $94,500</span>
            </div>
          </div>

          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Catatan personal makro (opsional)..."
            style={{ marginTop: 'auto', fontSize: 'var(--text-xs)' }}
          />
        </div>

        {/* Pilar 2: Fundamental & Tokenomics */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#34d399' }}>
              2. Fundamental & Tokenomics
            </h2>
            <span className="neutral-badge">HYBRID API</span>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Valuasi FDV, sirkulasi suplai, dan jadwal token unlocks.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Market Cap:</span>
              <span className="value-number">$88.4 Billion</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>FDV / MC Ratio:</span>
              <span className="bullish-badge">1.12x (Low Cliff Risk)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>24h Protocol Revenue:</span>
              <span className="value-number">$3.8 Million</span>
            </div>
          </div>

          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Catatan katalis naratif & tokenomics..."
            style={{ marginTop: 'auto', fontSize: 'var(--text-xs)' }}
          />
        </div>

        {/* Pilar 3: Price Action (Teknikal) */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#f59e0b' }}>
              3. Price Action (TradingView)
            </h2>
            <CheckCircle2 size={16} color="var(--color-bullish)" />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Struktur market SMC/ICT, liquidity sweep, & order block.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Market Structure:</span>
              <span className="bullish-badge">4H Bullish BOS</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Setup Confluence:</span>
              <span>Daily OB + Asian Low Swept</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Planned RR:</span>
              <span className="value-number bullish-text" style={{ fontWeight: 600 }}>1 : 3.8 R</span>
            </div>
          </div>

          <textarea
            className="form-textarea"
            rows={2}
            placeholder="TradingView chart notes & konfirmasi..."
            style={{ marginTop: 'auto', fontSize: 'var(--text-xs)' }}
          />
        </div>

        {/* Pilar 4: Bukti On-Chain & Coinglass Hub */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#ec4899' }}>
              4. Bukti On-Chain (Coinglass)
            </h2>
            <span className="bullish-badge">INDEXEDDB READY</span>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Paste screenshot analisis Coinglass (Ctrl+V) langsung tersimpan tanpa limit.
          </p>

          <div
            style={{
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              textAlign: 'center',
              backgroundColor: 'var(--color-bg-subtle)',
              cursor: 'pointer',
            }}
          >
            <Upload size={20} color="var(--color-accent-primary)" style={{ margin: '0 auto 6px' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block' }}>
              Tekan <kbd style={{ padding: '2px 4px', background: 'var(--color-border)', borderRadius: '4px' }}>Ctrl + V</kbd> untuk paste screenshot chart / Coinglass
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Open Interest Trend:</span>
            <span className="bullish-badge">Increasing (Fresh Capital)</span>
          </div>
        </div>
      </div>

      {/* Execution Plan Action Footer */}
      <div
        className="card-panel"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          backgroundColor: 'var(--color-bg-elevated)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)' }}>PLANNED ENTRY</span>
            <div className="value-number" style={{ fontWeight: 600 }}>$185.20</div>
          </div>
          <div>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)' }}>STOP LOSS</span>
            <div className="value-number bearish-text" style={{ fontWeight: 600 }}>$178.50</div>
          </div>
          <div>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)' }}>TARGET (TP1)</span>
            <div className="value-number bullish-text" style={{ fontWeight: 600 }}>$210.00</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary">Simpan Draft</button>
          <button className="btn btn-primary">
            <span>Kirim ke Journal Trading</span>
          </button>
        </div>
      </div>
    </div>
  );
};
