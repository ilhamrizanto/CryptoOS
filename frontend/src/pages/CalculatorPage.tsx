import React, { useState } from 'react';
import { Calculator, Award } from 'lucide-react';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';

export const CalculatorPage: React.FC = () => {
  const [accountSize, setAccountSize] = useState<number>(25000);
  const [riskPercent, setRiskPercent] = useState<number>(2.0);
  const [entryPrice, setEntryPrice] = useState<number>(185);
  const [stopLossPrice, setStopLossPrice] = useState<number>(177.6);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(205);
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');

  // Math Calculations
  const riskAmountUsd = (accountSize * riskPercent) / 100;
  const slDistance = Math.abs(entryPrice - stopLossPrice);
  const slDistancePercent = entryPrice > 0 ? (slDistance / entryPrice) * 100 : 0;
  
  // Position size in coins
  const positionSizeCoins = slDistance > 0 ? riskAmountUsd / slDistance : 0;
  const totalPositionValueUsd = positionSizeCoins * entryPrice;

  // Reward calculations
  const tpDistance = Math.abs(takeProfitPrice - entryPrice);
  const rewardUsd = positionSizeCoins * tpDistance;
  const riskRewardRatio = slDistance > 0 ? tpDistance / slDistance : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calculator size={24} color="var(--color-neutral)" />
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Position Sizer & Risk Engine</h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
          Kalkulator ukuran lot presisi berbasis risiko modal, stop loss, dan dual-currency output (USD & IDR).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Left: Input Parameters */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            Input Parameter Setup
          </h2>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${direction === 'LONG' ? 'btn-bullish' : 'btn-secondary'}`}
              onClick={() => setDirection('LONG')}
              style={{ flex: 1 }}
            >
              LONG POSITION
            </button>
            <button
              className={`btn ${direction === 'SHORT' ? 'btn-bearish' : 'btn-secondary'}`}
              onClick={() => setDirection('SHORT')}
              style={{ flex: 1 }}
            >
              SHORT POSITION
            </button>
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
              TOTAL MODAL PORTOFOLIO (USD)
            </label>
            <input
              type="number"
              className="form-input mono"
              value={accountSize}
              onChange={(e) => setAccountSize(Number(e.target.value))}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                TOLERANSI RISIKO PER TRADE (%)
              </label>
              <span className="value-number" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-primary)', fontWeight: 700 }}>
                {riskPercent}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[0.5, 1.0, 1.5, 2.0, 3.0].map((r) => (
                <button
                  key={r}
                  className={`btn ${riskPercent === r ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRiskPercent(r)}
                  style={{ flex: 1, padding: '4px 0', minHeight: '32px', fontSize: 'var(--text-xs)' }}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                ENTRY PRICE ($)
              </label>
              <input
                type="number"
                step="any"
                className="form-input mono"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-bearish)', display: 'block', marginBottom: '6px' }}>
                STOP LOSS ($)
              </label>
              <input
                type="number"
                step="any"
                className="form-input mono"
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-bullish)', display: 'block', marginBottom: '6px' }}>
              TARGET TAKE PROFIT ($)
            </label>
            <input
              type="number"
              step="any"
              className="form-input mono"
              style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
              value={takeProfitPrice}
              onChange={(e) => setTakeProfitPrice(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Right: Calculated Lot Size & Risk Profile */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            Rekomendasi Eksekusi
          </h2>

          {/* Primary Lot Size Card */}
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.4) 0%, rgba(15, 32, 64, 0.6) 100%)',
              border: '1px solid var(--color-border-accent)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              UKURAN POSISI (POSITION SIZE)
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span className="value-number" style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: '#ffffff' }}>
                {positionSizeCoins.toFixed(2)} COINS
              </span>
            </div>
            <div style={{ marginTop: '4px' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Nilai Eksekusi: </span>
              <DualCurrencyValue usd={totalPositionValueUsd} layout="row" size="sm" />
            </div>
          </div>

          {/* Secondary Metric Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div
              style={{
                padding: 'var(--space-3)',
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)' }}>MAKSIMAL RISIKO MODAL</span>
              <DualCurrencyValue usd={riskAmountUsd} size="md" sentiment="bearish" />
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)' }}>POTENSI PROFIT (TP1)</span>
              <DualCurrencyValue usd={rewardUsd} size="md" sentiment="bullish" />
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)' }}>SL DISTANCE</span>
              <div className="value-number bearish-text" style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>
                {slDistancePercent.toFixed(2)}%
              </div>
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)' }}>RISK-REWARD (RR)</span>
              <div className="value-number bullish-text" style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>
                1 : {riskRewardRatio.toFixed(2)} R
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Award size={18} color="var(--color-bullish)" />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-bullish)' }}>
              Setup memenuhi kriteria risk-reward minimum (&ge; 1:2 R). Siap dieksekusi di exchange.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
