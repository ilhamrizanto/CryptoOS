import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Globe,
  PlusCircle,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';
import { DataStatusBadge } from '../components/ui/DataStatusBadge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
            }}
          >
            Trading Terminal & Intelligence
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Multi-Exchange Operations • Macro Regime: <span className="bullish-text" style={{ fontWeight: 600 }}>RISK-ON</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/calculator')}>
            <Zap size={16} color="var(--color-neutral)" />
            <span>Position Sizer</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/pipeline')}>
            <PlusCircle size={16} />
            <span>New Analysis Idea</span>
          </button>
        </div>
      </div>

      {/* Global Intelligence Quick Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              FEAR & GREED INDEX
            </span>
            <DataStatusBadge status="live" label="DAILY" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="value-number" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#10b981' }}>
              74
            </span>
            <span className="bullish-badge">GREED</span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Market sentiment strongly optimistic
          </span>
        </div>

        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              BTC DOMINANCE
            </span>
            <DataStatusBadge status="live" label="COINGECKO" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="value-number" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              58.6%
            </span>
            <span className="neutral-badge">BTC DRIVEN</span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Capital consolidating into Bitcoin
          </span>
        </div>

        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              FED FUNDS RATE
            </span>
            <DataStatusBadge status="live" label="FRED" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="value-number" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              4.75%
            </span>
            <span className="neutral-badge">PAUSE/CUT EXPECTED</span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Next FOMC: 86% cut probability
          </span>
        </div>

        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              DXY US DOLLAR INDEX
            </span>
            <DataStatusBadge status="live" label="STOOQ" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="value-number" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              103.85
            </span>
            <span className="bearish-badge">-0.35% WEAKENING</span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Dollar pullbacks support crypto assets
          </span>
        </div>
      </div>

      {/* Main Grid: Portfolio Overview + Active Pipeline */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Left: Portfolio Snapshot Card */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="var(--color-accent-primary)" />
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Total Net Worth (USD & IDR)</h2>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/portfolio')}
              style={{ padding: '4px 10px', fontSize: 'var(--text-xs)', minHeight: 'unset' }}
            >
              <span>Exchanges</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div
            style={{
              padding: 'var(--space-5)',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              AGGREGATED ACTIVE BALANCE
            </span>
            <DualCurrencyValue usd={78450} size="hero" sentiment="bullish" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span className="bullish-badge">+12.4% ALL TIME</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Across Binance, Bybit, OKX & Cold Wallet
              </span>
            </div>
          </div>

          {/* Allocation Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              CURRENT ASSET WEIGHTS
            </span>
            <div style={{ display: 'flex', height: '10px', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: '50%', backgroundColor: '#f7931a' }} title="BTC 50%" />
              <div style={{ width: '25%', backgroundColor: '#627eea' }} title="ETH 25%" />
              <div style={{ width: '15%', backgroundColor: '#14f195' }} title="SOL 15%" />
              <div style={{ width: '10%', backgroundColor: '#26a17b' }} title="USDT/Cash 10%" />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                marginTop: '4px',
              }}
            >
              <span>BTC: 50%</span>
              <span>ETH: 25%</span>
              <span>SOL: 15%</span>
              <span>Cash: 10%</span>
            </div>
          </div>
        </div>

        {/* Right: Active Pipeline & Incubator Watchlist */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--color-bullish)" />
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>4-Pillar Pipeline Incubator</h2>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/pipeline')}
              style={{ padding: '4px 10px', fontSize: 'var(--text-xs)', minHeight: 'unset' }}
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Trade Idea 1 */}
            <div
              onClick={() => navigate('/pipeline')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'border-color var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="bullish-badge">LONG</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>SOLUSDT</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>4H Swing</span>
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    P1 Macro ✓ • P2 FDV Safe ✓ • P3 4H Demand OB ✓
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="neutral-badge">READY TO ENTER</span>
              </div>
            </div>

            {/* Trade Idea 2 */}
            <div
              onClick={() => navigate('/pipeline')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="bearish-badge">SHORT</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>DOGEUSDT</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>1D Mean-Reversion</span>
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    High Funding Extreme • CVD Bearish Divergence
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="neutral-badge">INCUBATING</span>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: 'var(--space-3)',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px dashed rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Got a fresh token setup? Start your 4-pillar analysis checklist.
            </span>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/pipeline')}
              style={{ padding: '4px 12px', fontSize: 'var(--text-xs)', minHeight: 'unset' }}
            >
              Analyze Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
