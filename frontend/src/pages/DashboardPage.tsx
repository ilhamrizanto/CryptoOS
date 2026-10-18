import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  ArrowRight,
  Clock,
  Target,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Breadcrumb & Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          <span>Dashboard</span>
          <span>&rsaquo;</span>
          <span>Macro Intelligence</span>
          <span>&rsaquo;</span>
          <span style={{ color: 'var(--color-accent-primary)' }}>Terminal Executive Summary</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginTop: '8px' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Terminal Intelligence <span style={{ color: 'var(--color-accent-primary)' }}>(09/20 Setups)</span>
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
              Great market confluence! Liquidity conditions are currently <span className="bullish-text" style={{ fontWeight: 700 }}>RISK-ON</span> and favorable.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/calculator')}>
              <Zap size={16} color="var(--color-accent-primary)" />
              <span>Position Sizer</span>
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/pipeline')}>
              <Sparkles size={16} />
              <span>Analyze New Token &rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Main Intelligence + Right Sidebar Panel (Exact Layout from Reference Image) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
        className="dashboard-main-grid"
      >
        {/* Left Column: Top Score/Winrate Card + Bottom Performance Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Top Main Score & Metrics Card (Matches "Test Results 85%" in Reference Image) */}
          <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', alignItems: 'center' }}>
              {/* Circular Gauge / Winrate Dial (Neon Lime Ring) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '160px',
                }}
              >
                <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                  <svg width="130" height="130" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke="#151b20"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke="var(--color-accent-primary)"
                      strokeWidth="10"
                      strokeDasharray="264"
                      strokeDashoffset="39.6" /* 85% fill */
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(134, 239, 29, 0.6))' }}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="value-number" style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff' }}>
                      85%
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      17 / 20 Trades
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    color: 'var(--color-accent-primary)',
                    fontWeight: 700,
                    fontSize: 'var(--text-xs)',
                    marginTop: '8px',
                    letterSpacing: '0.02em',
                  }}
                >
                  Excellent Confluence!
                </span>
              </div>

              {/* Strategy Details Grid (Matches "Test Name / Total Questions" layout in Reference Image) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Core Strategy Confluence</span>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                    Multi-Timeframe SMC + Coinglass CVD Divergence
                  </h3>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 'var(--space-3)',
                    paddingTop: 'var(--space-3)',
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>TOTAL IDEAS</span>
                    <span className="value-number" style={{ fontSize: '18px', fontWeight: 800 }}>20</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>WINNING TRADES</span>
                    <span className="value-number bullish-text" style={{ fontSize: '18px', fontWeight: 800 }}>17</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>STOP LOSS HIT</span>
                    <span className="value-number bearish-text" style={{ fontSize: '18px', fontWeight: 800 }}>2</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 'var(--space-3)',
                    paddingTop: 'var(--space-3)',
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} color="var(--color-text-muted)" />
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>AVG DURATION</span>
                      <span className="value-number" style={{ fontSize: '13px', fontWeight: 700 }}>18h 45m</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={16} color="var(--color-text-muted)" />
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>PROFIT FACTOR</span>
                      <span className="value-number bullish-text" style={{ fontSize: '13px', fontWeight: 700 }}>2.85 PF</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Target size={16} color="var(--color-text-muted)" />
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>ACCURACY</span>
                      <span className="value-number" style={{ fontSize: '13px', fontWeight: 700 }}>85.0%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card: Performance Analysis & Equity Curve (Matches Doughnut + Line Chart in Reference Image) */}
          <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#ffffff' }}>
              Performance Analysis & Capital Curve
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--space-6)', alignItems: 'center' }}>
              {/* Doughnut Ratio Chart */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                  <svg width="120" height="120" viewBox="0 0 100 100">
                    {/* Unattempted / Open (Amber) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#fbbf24" strokeWidth="12" strokeDasharray="238.7" strokeDashoffset="0" />
                    {/* Lost (Red) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f87171" strokeWidth="12" strokeDasharray="238.7" strokeDashoffset="23.8" />
                    {/* Won (Neon Green 85%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="var(--color-accent-primary)"
                      strokeWidth="12"
                      strokeDasharray="238.7"
                      strokeDashoffset="47.7"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(134, 239, 29, 0.5))' }}
                    />
                  </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-accent-primary)' }} />
                      <span>Profitable Trades</span>
                    </div>
                    <span className="value-number" style={{ fontWeight: 700 }}>17 (85%)</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f87171' }} />
                      <span>Cut-Loss</span>
                    </div>
                    <span className="value-number" style={{ fontWeight: 700 }}>2 (10%)</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24' }} />
                      <span>Breakeven / Open</span>
                    </div>
                    <span className="value-number" style={{ fontWeight: 700 }}>1 (5%)</span>
                  </div>
                </div>
              </div>

              {/* Glowing Line Graph (Matches Score Progress Line Chart in Reference Image) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    CAPITAL GROWTH (EQUITY CURVE)
                  </span>
                  <span className="bullish-badge">+38.5% MONTHLY</span>
                </div>

                {/* SVG Curve with glowing neon line */}
                <div
                  style={{
                    height: '140px',
                    width: '100%',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 16px',
                    border: '1px solid var(--color-border)',
                    position: 'relative',
                  }}
                >
                  <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#182026" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#182026" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="300" y2="80" stroke="#182026" strokeDasharray="3 3" />

                    {/* Gradient fill under line */}
                    <defs>
                      <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 75 Q 70 65 130 45 T 210 30 T 290 12 L 290 100 L 10 100 Z"
                      fill="url(#neonGradient)"
                    />

                    {/* Glowing neon stroke line */}
                    <path
                      d="M 10 75 Q 70 65 130 45 T 210 30 T 290 12"
                      fill="transparent"
                      stroke="var(--color-accent-primary)"
                      strokeWidth="3"
                      style={{ filter: 'drop-shadow(0 0 5px rgba(134, 239, 29, 0.8))' }}
                    />

                    {/* Glowing node points */}
                    <circle cx="10" cy="75" r="4" fill="var(--color-accent-primary)" />
                    <circle cx="80" cy="60" r="4" fill="var(--color-accent-primary)" />
                    <circle cx="150" cy="40" r="4" fill="var(--color-accent-primary)" />
                    <circle cx="220" cy="28" r="4" fill="var(--color-accent-primary)" />
                    <circle cx="290" cy="12" r="5" fill="#ffffff" stroke="var(--color-accent-primary)" strokeWidth="2" />
                  </svg>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  <span>Week 01</span>
                  <span>Week 02</span>
                  <span>Week 03</span>
                  <span>Week 04</span>
                  <span>Current (ATH)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Asset Performance Progress Bars + Recommendations Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Asset Allocation & Health (Matches "Subject Performance" with green bars in Reference Image) */}
          <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#ffffff' }}>
              Asset Target Progress
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Bitcoin (BTC)</span>
                  <span className="value-number" style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>
                    17 / 20 (85%)
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: '85%' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Solana (SOL)</span>
                  <span className="value-number" style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>
                    18 / 20 (90%)
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: '90%' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Ethereum (ETH)</span>
                  <span className="value-number" style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>
                    14 / 20 (70%)
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: '70%' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Cash & Stables (USDT)</span>
                  <span className="value-number" style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>
                    16 / 20 (80%)
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: '80%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Recommendations (Matches "Recommendations" block in Reference Image) */}
          <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#ffffff' }}>
              Actionable Recommendations
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Item 1 */}
              <div
                onClick={() => navigate('/pipeline')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AlertTriangle size={16} color="#fbbf24" />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                      Review SOLUSDT Setup
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      Demand OB & CVD confluence ready
                    </span>
                  </div>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>

              {/* Item 2 */}
              <div
                onClick={() => navigate('/rebalancing')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(134, 239, 29, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrendingUp size={16} color="var(--color-accent-primary)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                      Rebalance Overweight
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      SOL +4.9% deviation above target
                    </span>
                  </div>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>

              {/* Item 3 */}
              <div
                onClick={() => navigate('/calculator')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(134, 239, 29, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap size={16} color="var(--color-accent-primary)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                      Calculate Lot Size
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      Apply 2.0% risk rule before entry
                    </span>
                  </div>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>
            </div>

            {/* Action Buttons (Matches Review Answers / Retake Test / Back to Dashboard in Reference Image) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--space-2)' }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/pipeline')}
                style={{ width: '100%', minHeight: '42px', fontSize: '13px' }}
              >
                <span>Execute Setup Review &rarr;</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => navigate('/calculator')}
                style={{ width: '100%', minHeight: '38px', fontSize: '12px' }}
              >
                <RotateCcw size={14} />
                <span>Re-evaluate Position Sizer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
