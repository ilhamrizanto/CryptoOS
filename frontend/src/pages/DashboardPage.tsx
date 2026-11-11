import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  Target,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  Check,
  AlertCircle,
  ArrowRightLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { GlobalIntelligencePanel } from '../components/features/intelligence/GlobalIntelligencePanel';
import { formatUsd, formatIdr } from '../utils/formatters';
import { TokenIcon } from '../components/common/TokenIcon';
import { getCategory } from './RebalancingPage';

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

  const totalTrades = journalAnalytics?.totalTrades > 0 ? journalAnalytics.totalTrades : 0;
  const winRate = totalTrades > 0 ? journalAnalytics.winRate : 0;
  const winCount = totalTrades > 0 ? journalAnalytics.winCount : 0;
  const lossCount = totalTrades > 0 ? journalAnalytics.lossCount : 0;
  const profitFactor = totalTrades > 0 ? journalAnalytics.profitFactor : 0;

  const holdings = portfolioSummary?.holdings || [];
  const sortedHoldings = [...holdings].sort((a: any, b: any) => {
    const valA = Number(a.currentValueUsd) || Number(a.allocationPercent) || 0;
    const valB = Number(b.currentValueUsd) || Number(b.allocationPercent) || 0;
    return valB - valA;
  });
  const topHoldings = sortedHoldings.slice(0, 5);

  // Category Targets (from localStorage or default 50/20/30)
  const categoryTargets = (() => {
    try {
      const saved = localStorage.getItem('cryptoos_rebalance_category_targets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { btc: 50, cash: 20, altcoins: 30 };
  })();

  let btcValueUsd = 0;
  let cashValueUsd = 0;
  let altcoinsValueUsd = 0;

  for (const h of holdings) {
    const val = Number(h.currentValueUsd) || 0;
    const cat = getCategory(h.symbol);
    if (cat === 'BTC') btcValueUsd += val;
    else if (cat === 'CASH') cashValueUsd += val;
    else altcoinsValueUsd += val;
  }

  const totalPortfolioUsd = portfolioSummary?.totalNetWorthUsd || (btcValueUsd + cashValueUsd + altcoinsValueUsd) || 1;
  const btcActualPercent = parseFloat(((btcValueUsd / totalPortfolioUsd) * 100).toFixed(1));
  const cashActualPercent = parseFloat(((cashValueUsd / totalPortfolioUsd) * 100).toFixed(1));
  const altcoinsActualPercent = parseFloat(((altcoinsValueUsd / totalPortfolioUsd) * 100).toFixed(1));

  const btcDeviation = parseFloat((btcActualPercent - categoryTargets.btc).toFixed(1));
  const cashDeviation = parseFloat((cashActualPercent - categoryTargets.cash).toFixed(1));
  const altcoinsDeviation = parseFloat((altcoinsActualPercent - categoryTargets.altcoins).toFixed(1));

  const maxCategoryDrift = Math.max(Math.abs(btcDeviation), Math.abs(cashDeviation), Math.abs(altcoinsDeviation));
  const isDriftHigh = maxCategoryDrift >= 3.0;

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
            <span>+ Analyze New Token</span>
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
              EXECUTION WIN RATE
            </span>
            <span className={winCount > 0 ? 'bullish-badge' : 'badge'} style={{ fontSize: '9px', padding: '1px 5px' }}>
              {winCount}W - {lossCount}L
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span className="value-number" style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
              {winRate}%
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              from {totalTrades} completed setups
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
              {profitFactor > 0 ? `${profitFactor} PF` : '0.00 PF'}
            </span>
            <span className="value-number" style={{ fontSize: '12px', color: '#ffffff', fontWeight: 700 }}>
              {journalAnalytics?.expectancyUsd !== undefined && totalTrades > 0 ? `${journalAnalytics.expectancyUsd >= 0 ? '+' : ''}$${journalAnalytics.expectancyUsd.toFixed(0)} / trade` : '$0 / trade'}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {totalTrades > 0 ? 'SMC Confluence + On-Chain CVD Confirmation' : 'No closed trades recorded yet'}
          </span>
        </div>

        {/* KPI 3: Avg Risk/Reward & Duration */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              AVERAGE RISK TO REWARD
            </span>
            <Target size={13} color="var(--color-accent-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span className="value-number bullish-text" style={{ fontSize: '24px', fontWeight: 900 }}>
              {journalAnalytics?.averageRMultiple && totalTrades > 0 ? `1 : ${journalAnalytics.averageRMultiple.toFixed(2)} R` : '0.00 R'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              {totalTrades > 0 ? 'Disciplined Execution' : 'No trades executed'}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {totalTrades > 0 ? 'Disciplined stop-loss without moving SL' : 'Awaiting position close'}
          </span>
        </div>

        {/* KPI 4: Total Portfolio Net Worth */}
        <div
          className="cardless-cell"
          style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
          onClick={() => navigate('/portfolio')}
          title="View Portfolio Tracker details"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              PORTFOLIO NET WORTH
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                {portfolioSummary?.holdings?.length || 0} ASSETS
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/rebalancing');
                }}
                className={isDriftHigh ? "bearish-badge" : "neutral-badge"}
                style={{ fontSize: '9px', padding: '1px 5px', cursor: 'pointer' }}
                title="Open Rebalancing Matrix"
              >
                {isDriftHigh ? `±${maxCategoryDrift}% DRIFT` : 'BALANCED'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span className="value-number" style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
              {formatUsd(portfolioSummary?.totalNetWorthUsd || 0)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <span className="value-number" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
              {formatIdr(portfolioSummary?.totalNetWorthIdr || 0)} &bull; Multi-Exchange
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
                  PIPELINE INCUBATOR (ACTIVE TRADE SETUPS)
                </span>
                <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  {ideas.length} READY
                </span>
              </div>
              <button
                onClick={() => navigate('/pipeline')}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
              >
                Open Pipeline &rarr;
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="cardless-table">
                <thead>
                  <tr>
                    <th>TOKEN</th>
                    <th>DIRECTION / TF</th>
                    <th>CONFIDENCE & STRATEGY</th>
                    <th style={{ textAlign: 'right' }}>ENTRY</th>
                    <th style={{ textAlign: 'right' }}>STOP LOSS</th>
                    <th style={{ textAlign: 'right' }}>TARGET (TP)</th>
                    <th style={{ textAlign: 'center' }}>R:R</th>
                    <th style={{ textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {ideas.length > 0 ? (
                    ideas.slice(0, 5).map((item) => {
                      const rr =
                        item.entryPrice && item.stopLossPrice && item.tp1Price && Math.abs(item.entryPrice - item.stopLossPrice) > 0
                          ? Math.abs(item.tp1Price - item.entryPrice) / Math.abs(item.entryPrice - item.stopLossPrice)
                          : 0;
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 800 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <TokenIcon symbol={item.symbol.replace('USDT', '')} size={16} />
                              <span style={{ color: '#ffffff' }}>{item.symbol}</span>
                            </div>
                          </td>
                          <td>
                            <span className={item.direction === 'LONG' ? 'bullish-badge' : 'bearish-badge'} style={{ fontSize: '9px', padding: '1px 5px' }}>
                              {item.direction} {item.timeframe || '4H'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 800, color: (item.confidenceScore ?? 8) >= 8 ? 'var(--color-bullish)' : 'var(--color-accent-primary)' }}>
                                ⭐ {item.confidenceScore ?? 8}/10
                              </span>
                              <span className="neutral-badge" style={{ fontSize: '8.5px', padding: '0 4px' }}>
                                {item.strategy || item.playstyle || 'PRICE_ACTION'}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }} className="value-number">
                            ${item.entryPrice?.toLocaleString() || '-'}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--color-bearish)' }} className="value-number">
                            ${item.stopLossPrice?.toLocaleString() || '-'}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--color-bullish)' }} className="value-number">
                            ${item.tp1Price?.toLocaleString() || '-'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="bullish-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>
                              1 : {rr.toFixed(2)} R
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() =>
                                navigate('/calculator', {
                                  state: {
                                    ticker: item.symbol,
                                    direction: item.direction,
                                    entryPrice: item.entryPrice,
                                    stopLossPrice: item.stopLossPrice,
                                    takeProfitPrice: item.tp1Price,
                                    riskPercent: item.riskPercent,
                                  },
                                })
                              }
                              style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
                            >
                              <Zap size={11} color="var(--color-accent-primary)" />
                              <span>Sizer</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                        No active trade setups in pipeline. Click "+ Analyze New Token" to draft a setup.
                      </td>
                    </tr>
                  )}
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
                  RECENT TRADE EXECUTIONS & EMOTIONAL AUDIT
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  (Trading Plan Discipline Audit)
                </span>
              </div>
              <button
                onClick={() => navigate('/journal')}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
              >
                Open Journal &rarr;
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="cardless-table">
                <thead>
                  <tr>
                    <th>TOKEN</th>
                    <th>STATUS</th>
                    <th>ENTRY EMOTION & PSYCHOLOGY</th>
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
                          {t.psychologyState || 'Plan Disciplined'}
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
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                        No recent trade executions logged in journal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Seamless Asset Allocation & Risk Dock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Portfolio Macro Allocation & Rebalance Drift (Command Dock) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                  MACRO ALLOCATION & DRIFT
                </span>
                <span className={isDriftHigh ? 'bearish-badge' : 'bullish-badge'} style={{ fontSize: '8px', padding: '1px 5px', fontWeight: 800 }}>
                  {isDriftHigh ? `±${maxCategoryDrift}% DRIFT` : 'IN RANGE'}
                </span>
              </div>
              <button
                onClick={() => navigate('/rebalancing')}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}
              >
                Rebalance &rarr;
              </button>
            </div>

            {/* Visual Multi-Segment Barbell Track */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                <span>ACTUAL DISTRIBUTION</span>
                <span className="mono">Target: {categoryTargets.btc}% / {categoryTargets.cash}% / {categoryTargets.altcoins}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                {btcActualPercent > 0 && (
                  <div
                    style={{
                      width: `${btcActualPercent}%`,
                      height: '100%',
                      backgroundColor: '#F7931A',
                      transition: 'width 0.3s ease',
                    }}
                    title={`Bitcoin (BTC): ${btcActualPercent}% (Target ${categoryTargets.btc}%)`}
                  />
                )}
                {cashActualPercent > 0 && (
                  <div
                    style={{
                      width: `${cashActualPercent}%`,
                      height: '100%',
                      backgroundColor: '#30D158',
                      transition: 'width 0.3s ease',
                    }}
                    title={`Cash & Stables: ${cashActualPercent}% (Target ${categoryTargets.cash}%)`}
                  />
                )}
                {altcoinsActualPercent > 0 && (
                  <div
                    style={{
                      width: `${altcoinsActualPercent}%`,
                      height: '100%',
                      backgroundColor: '#AF52DE',
                      transition: 'width 0.3s ease',
                    }}
                    title={`Altcoins: ${altcoinsActualPercent}% (Target ${categoryTargets.altcoins}%)`}
                  />
                )}
              </div>
            </div>

            {/* 3 Categories Comparison Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {/* BTC Mini Card */}
              <div
                onClick={() => navigate('/rebalancing')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(247, 147, 26, 0.04)',
                  border: '1px solid rgba(247, 147, 26, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  cursor: 'pointer',
                }}
                title="View Bitcoin allocation in Rebalance Matrix"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F7931A' }} />
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff' }}>BTC</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                  <span className="mono" style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>
                    {btcActualPercent}%
                  </span>
                  <span className="mono" style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                    /{categoryTargets.btc}%
                  </span>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: btcDeviation < -2 ? 'var(--color-amber)' : 'var(--color-bullish)',
                  }}
                >
                  {btcDeviation > 0 ? '+' : ''}{btcDeviation}%
                </span>
              </div>

              {/* Cash Mini Card */}
              <div
                onClick={() => navigate('/rebalancing')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(48, 209, 88, 0.04)',
                  border: '1px solid rgba(48, 209, 88, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  cursor: 'pointer',
                }}
                title="View Cash & Stables allocation in Rebalance Matrix"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#30D158' }} />
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff' }}>CASH</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                  <span className="mono" style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>
                    {cashActualPercent}%
                  </span>
                  <span className="mono" style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                    /{categoryTargets.cash}%
                  </span>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: cashDeviation < -2 ? 'var(--color-amber)' : 'var(--color-bullish)',
                  }}
                >
                  {cashDeviation > 0 ? '+' : ''}{cashDeviation}%
                </span>
              </div>

              {/* Altcoins Mini Card */}
              <div
                onClick={() => navigate('/rebalancing')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(175, 82, 222, 0.04)',
                  border: '1px solid rgba(175, 82, 222, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  cursor: 'pointer',
                }}
                title="View Altcoins allocation in Rebalance Matrix"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#AF52DE' }} />
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff' }}>ALTS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                  <span className="mono" style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>
                    {altcoinsActualPercent}%
                  </span>
                  <span className="mono" style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                    /{categoryTargets.altcoins}%
                  </span>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: altcoinsDeviation > 2 ? 'var(--color-amber)' : 'var(--color-bullish)',
                  }}
                >
                  {altcoinsDeviation > 0 ? '+' : ''}{altcoinsDeviation}%
                </span>
              </div>
            </div>

            {/* Drift Recommendation Directive Banner */}
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: isDriftHigh ? 'rgba(255, 159, 10, 0.06)' : 'rgba(48, 209, 88, 0.06)',
                borderRadius: 'var(--radius-sm)',
                border: isDriftHigh ? '1px solid rgba(255, 159, 10, 0.25)' : '1px solid rgba(48, 209, 88, 0.25)',
                fontSize: '11px',
                lineHeight: 1.4,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isDriftHigh ? (
                    <AlertCircle size={13} color="var(--color-amber)" />
                  ) : (
                    <Check size={13} color="var(--color-bullish)" />
                  )}
                  <span style={{ fontWeight: 800, color: isDriftHigh ? 'var(--color-amber)' : 'var(--color-bullish)' }}>
                    {isDriftHigh ? `±${maxCategoryDrift}% Drift Detected` : 'Portfolio Allocation Balanced'}
                  </span>
                </div>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                  Threshold ±2.5%
                </span>
              </div>

              <span style={{ color: 'var(--color-text-secondary)', fontSize: '10.5px' }}>
                {isDriftHigh
                  ? `Altcoin exposure at ${altcoinsActualPercent}% (Target ${categoryTargets.altcoins}%). Rotate into BTC & Cash reserves to protect capital.`
                  : `Proportions of Bitcoin, Cash, and Altcoins are within calibrated risk corridors.`}
              </span>

              {isDriftHigh && (
                <button
                  onClick={() => navigate('/rebalancing')}
                  className="btn btn-secondary"
                  style={{
                    height: '26px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    marginTop: '2px',
                    border: '1px solid rgba(255, 159, 10, 0.3)',
                    color: 'var(--color-amber)',
                  }}
                >
                  <ArrowRightLeft size={11} />
                  <span>Open Rebalance Matrix & Execute &rarr;</span>
                </button>
              )}
            </div>

            {/* Top Individual Spot Assets Compact Preview */}
            {topHoldings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  <span>PRIMARY ASSET CONTRIBUTORS:</span>
                  <button
                    onClick={() => navigate('/portfolio')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '10px', cursor: 'pointer' }}
                  >
                    View All ({sortedHoldings.length}) &rarr;
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {topHoldings.slice(0, 3).map((h: any) => {
                    const cat = getCategory(h.symbol);
                    const catColor = cat === 'BTC' ? '#F7931A' : cat === 'CASH' ? '#30D158' : '#AF52DE';
                    return (
                      <div
                        key={h.symbol}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '5px 8px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <TokenIcon symbol={h.symbol} size={14} />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{h.symbol}</span>
                          <span
                            style={{
                              fontSize: '8px',
                              fontWeight: 800,
                              padding: '0 4px',
                              borderRadius: '2px',
                              color: catColor,
                              backgroundColor: `${catColor}15`,
                              border: `1px solid ${catColor}30`,
                            }}
                          >
                            {cat}
                          </span>
                        </div>
                        <span className="mono" style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>
                          ${(Number(h.currentValueUsd) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({h.allocationPercent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                <span className="value-number" style={{ color: '#ffffff', fontWeight: 700 }}>
                  2% ({portfolioSummary?.totalNetWorthUsd ? formatUsd(portfolioSummary.totalNetWorthUsd * 0.02) : '$0.00'})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                <span>Max Concurrent Trades:</span>
                <span className="value-number" style={{ color: '#ffffff', fontWeight: 700 }}>3 Positions</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                <span>Kelly Criterion Sizing:</span>
                <span className="value-number" style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>Half-Kelly</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/calculator')}
                style={{ width: '100%', height: '36px', fontSize: '12px' }}
              >
                <Zap size={13} />
                <span>Open Position Sizer</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => navigate('/journal')}
                style={{ width: '100%', height: '34px', fontSize: '12px' }}
              >
                <BookOpen size={13} />
                <span>Open Trade Journal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
