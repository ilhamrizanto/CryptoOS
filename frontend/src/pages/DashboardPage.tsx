import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  Target,
  Sparkles,
  SlidersHorizontal,
  BookOpen,
  ArrowUpRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { GlobalIntelligencePanel } from '../components/features/intelligence/GlobalIntelligencePanel';
import { formatUsd, formatIdr } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [portfolioSummary, setPortfolioSummary] = useState<any>(null);
  const [journalAnalytics, setJournalAnalytics] = useState<any>(null);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const refreshDashboardData = async () => {
    const [portRes, jnlRes, ideasRes, tradesRes] = await Promise.all([
      api.get<any>('/portfolio/summary').catch(() => null),
      api.get<any>('/journal/analytics').catch(() => null),
      api.get<any[]>('/ideas').catch(() => []),
      api.get<any[]>('/journal/trades').catch(() => []),
    ]);
    if (portRes) setPortfolioSummary(portRes);
    if (jnlRes) setJournalAnalytics(jnlRes);
    if (ideasRes) setIdeas(ideasRes);
    if (tradesRes) setRecentTrades(tradesRes.slice(0, 5));
  };

  useEffect(() => {
    refreshDashboardData();
  }, []);

  const winRate = journalAnalytics?.totalTrades > 0 ? journalAnalytics.winRate : 85;
  const winCount = journalAnalytics?.totalTrades > 0 ? journalAnalytics.winCount : 17;
  const totalTrades = journalAnalytics?.totalTrades > 0 ? journalAnalytics.totalTrades : 20;
  const lossCount = journalAnalytics?.totalTrades > 0 ? journalAnalytics.lossCount : 2;
  const profitFactor = journalAnalytics?.totalTrades > 0 ? journalAnalytics.profitFactor : 2.85;

  const holdings = portfolioSummary?.holdings || [
    { symbol: 'BTC', allocationPercent: 58, targetPercent: 50, exchange: 'BINANCE/WALLET' },
    { symbol: 'ETH', allocationPercent: 21.1, targetPercent: 25, exchange: 'BINANCE' },
    { symbol: 'SOL', allocationPercent: 10, targetPercent: 15, exchange: 'BYBIT' },
    { symbol: 'USDT', allocationPercent: 10.9, targetPercent: 10, exchange: 'OKX' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', paddingBottom: 'var(--space-8)' }}>
      {/* Header (Cardless, Title aligned with Minimal Brand Identity) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.06em' }}>
              TERMINAL WORKSTATION
            </span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              MODE: RISK-ON (LIQUIDITY ACCELERATION)
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', marginTop: '2px', margin: 0 }}>
            Trading Intelligence & Command
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/calculator')}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
          >
            <Zap size={14} color="var(--color-accent-primary)" />
            <span>Position Sizer</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/pipeline')}
            style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}
          >
            <Sparkles size={14} />
            <span>+ Analisis Token Baru</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`terminal-toast toast-enter ${notification.type === 'error' ? 'error' : ''}`}>
          {notification.type === 'error' ? (
            <AlertCircle size={15} color="var(--color-bearish)" />
          ) : (
            <Check size={15} color="var(--color-accent-primary)" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Global Macro & FedWatch Intelligence Panel */}
      <GlobalIntelligencePanel onDashboardRefresh={refreshDashboardData} onShowToast={showToast} />

      {/* 4 Core Quantitative Trading KPIs (Cardless Metric Ribbon) */}
      <div
        className="cardless-sheet"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          backgroundColor: 'transparent',
        }}
      >
        {/* KPI 1: Win Rate & Trades */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              WIN RATE EKSEKUSI
            </span>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              {winCount}W - {lossCount}L
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span className="value-number" style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
              {winRate}%
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              dari {totalTrades} setup selesai
            </span>
          </div>
          <div className="progress-track" style={{ height: '3px', marginTop: '4px' }}>
            <div className="progress-fill" style={{ width: `${winRate}%` }} />
          </div>
        </div>

        {/* KPI 2: Profit Factor & Expectancy */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              PROFIT FACTOR & EXPECTANCY
            </span>
            <TrendingUp size={13} color="var(--color-accent-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span className="value-number" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-accent-primary)' }}>
              {profitFactor} PF
            </span>
            <span className="value-number" style={{ fontSize: '12px', color: '#ffffff', fontWeight: 700 }}>
              +$1,420 / trade
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Kombinasi SMC + Konfirmasi CVD On-Chain
          </span>
        </div>

        {/* KPI 3: Avg Risk/Reward & Duration */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              RATA-RATA RISK TO REWARD
            </span>
            <Target size={13} color="var(--color-accent-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span className="value-number bullish-text" style={{ fontSize: '24px', fontWeight: 900 }}>
              1 : 3.38 R
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Avg hold 18h 45m
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Disiplin Cut-loss terukur tanpa geser SL
          </span>
        </div>

        {/* KPI 4: Total Portfolio Net Worth */}
        <div
          className="cardless-cell"
          style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
          onClick={() => navigate('/portfolio')}
          title="Buka detail Portfolio Tracker"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              NET WORTH PORTOFOLIO
            </span>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              +34.84% ATH
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span className="value-number" style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
              {formatUsd(portfolioSummary?.totalNetWorthUsd || 138817.5)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <span className="value-number" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
              {formatIdr(portfolioSummary?.totalNetWorthIdr || 2255784375)} &bull; Multi-Exchange
            </span>
            <ArrowUpRight size={12} color="var(--color-text-muted)" />
          </div>
        </div>
      </div>

      {/* Main Grid: Cardless Financial Sheets (65%) + Right Dock (35%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
        className="dashboard-main-grid"
      >
        {/* Left Column: Cardless Data Sheets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Active Pipeline Incubator Table (Cardless Sheet) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '0 0 10px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                  PIPELINE INCUBATOR (ANALISIS 4-PILAR AKTIF)
                </span>
                <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  {ideas.length > 0 ? ideas.length : 1} READY
                </span>
              </div>
              <button
                onClick={() => navigate('/pipeline')}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
              >
                Buka Pipeline &rarr;
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="cardless-table">
                <thead>
                  <tr>
                    <th>TOKEN</th>
                    <th>ARAH / TF</th>
                    <th>4-PILAR STATUS</th>
                    <th style={{ textAlign: 'right' }}>ENTRY</th>
                    <th style={{ textAlign: 'right' }}>STOP LOSS</th>
                    <th style={{ textAlign: 'right' }}>TARGET (TP)</th>
                    <th style={{ textAlign: 'center' }}>R:R</th>
                    <th style={{ textAlign: 'center' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 800 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--color-accent-primary)' }}>✦</span>
                        <span style={{ color: '#ffffff' }}>SOLUSDT</span>
                      </div>
                    </td>
                    <td>
                      <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        LONG 4H
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                        SMC Bullish BOS + CVD Absorption
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="value-number">
                      $182.00
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--color-bearish)' }} className="value-number">
                      $177.50
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--color-bullish)' }} className="value-number">
                      $195.00
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="bullish-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        1 : 2.89 R
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/calculator')}
                        style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
                      >
                        <Zap size={11} color="var(--color-accent-primary)" />
                        <span>Sizer</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Trade Journal Execution History (Cardless Sheet) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '0 0 10px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                  RIWAYAT EKSEKUSI & PSIKOLOGI TRADE TERAKHIR
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  (Evaluasi Disiplin Trading Plan)
                </span>
              </div>
              <button
                onClick={() => navigate('/journal')}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
              >
                Buka Jurnal &rarr;
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="cardless-table">
                <thead>
                  <tr>
                    <th>TOKEN</th>
                    <th>STATUS</th>
                    <th>PSIKOLOGI ENTRY</th>
                    <th style={{ textAlign: 'right' }}>REALIZED PNL</th>
                    <th style={{ textAlign: 'center' }}>R-MULTIPLE</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.length > 0 ? (
                    recentTrades.map((t: any) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>{t.symbol}</td>
                        <td>
                          <span
                            className={t.status === 'CLOSED' ? (t.pnlAmount >= 0 ? 'bullish-badge' : 'bearish-badge') : 'badge'}
                            style={{ fontSize: '9px', padding: '1px 5px' }}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                          {t.psychologyState || 'Disiplin Rencana'}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: t.pnlAmount >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)',
                          }}
                          className="value-number"
                        >
                          {t.pnlAmount >= 0 ? `+${formatUsd(t.pnlAmount)}` : formatUsd(t.pnlAmount)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="value-number" style={{ color: t.rMultiple >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)', fontWeight: 700 }}>
                            {t.rMultiple ? `${t.rMultiple >= 0 ? '+' : ''}${t.rMultiple.toFixed(2)}R` : '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>BTCUSDT</td>
                        <td>
                          <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                            CLOSED WIN
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                          Tenang, mengikuti setup FVG 1H tanpa geser stop loss
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-bullish)' }} className="value-number">
                          +$2,450.00
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="value-number" style={{ color: 'var(--color-bullish)', fontWeight: 700 }}>
                            +3.15 R
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>ETHUSDT</td>
                        <td>
                          <span className="bearish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                            CLOSED LOSS
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                          Kena SL terencana saat rilis CPI, patuh tanpa revenge
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-bearish)' }} className="value-number">
                          -$500.00
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="value-number" style={{ color: 'var(--color-bearish)', fontWeight: 700 }}>
                            -1.00 R
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Seamless Asset Allocation & Risk Dock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Asset Allocation & Deviation (Seamless Dock) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                ALOKASI ASET & DEVIASI
              </span>
              <button
                onClick={() => navigate('/rebalancing')}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}
              >
                Rebalance &rarr;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {holdings.map((h: any) => {
                const diff = h.allocationPercent - h.targetPercent;
                return (
                  <div key={h.symbol} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>{h.symbol}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="value-number" style={{ color: '#ffffff', fontWeight: 700 }}>
                          {h.allocationPercent}%
                        </span>
                        <span style={{ fontSize: '10px', color: diff > 5 ? 'var(--color-neutral)' : 'var(--color-text-muted)' }}>
                          (Target {h.targetPercent}%)
                        </span>
                      </div>
                    </div>
                    <div className="progress-track" style={{ height: '3px', backgroundColor: 'var(--color-border)' }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, h.allocationPercent)}%`,
                          backgroundColor: diff > 5 ? '#f59e0b' : 'var(--color-accent-primary)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.4,
                marginTop: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 700, marginBottom: '2px' }}>
                <SlidersHorizontal size={12} />
                <span>Status Rebalancing</span>
              </div>
              BTC deviasi +8% melebihi target alokasi. Siklus berkala tersisa <strong>24 hari</strong>.
            </div>
          </div>

          {/* Risk Engine & Sizing Shortcut (Seamless Dock) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                RISK ENGINE & SIZING DOCK
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                <span>Risk per Trade (Default):</span>
                <span className="value-number" style={{ color: '#ffffff', fontWeight: 700 }}>2% ($2,776)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                <span>Max Concurrent Trades:</span>
                <span className="value-number" style={{ color: '#ffffff', fontWeight: 700 }}>3 Posisi</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                <span>Kelly Criterion Sizing:</span>
                <span className="value-number" style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>Half-Kelly (12.5%)</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/calculator')}
                style={{ width: '100%', height: '36px', fontSize: '12px' }}
              >
                <Zap size={13} />
                <span>Hitung Lot Sizer Sekarang</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => navigate('/journal')}
                style={{ width: '100%', height: '34px', fontSize: '12px' }}
              >
                <BookOpen size={13} />
                <span>Buka Log Trade Journal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
