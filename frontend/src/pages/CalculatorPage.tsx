import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Layers,
  Flame,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  BookOpen,
  ArrowUpRight,
  Activity,
  Zap,
  ArrowRightLeft,
  X,
  Dice5,
} from 'lucide-react';
import { api } from '../services/api';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';
import { TradeIdea } from '../types/trade.types';
import { TokenIcon } from '../components/common/TokenIcon';
import { MonteCarloEngine } from '../components/montecarlo/MonteCarloEngine';

export const CalculatorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Mode and Base Inputs
  const [ticker, setTicker] = useState('SOLUSDT');
  const [accountSize, setAccountSize] = useState<number>(25000);
  const [riskPercent, setRiskPercent] = useState<number>(2.0);
  const [entryPrice, setEntryPrice] = useState<number>(185.0);
  const [stopLossPrice, setStopLossPrice] = useState<number>(177.6);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(210.0);
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [selectedLeverage, setSelectedLeverage] = useState<number>(5);
  // Rebalance Context (when redirected from Rebalancing Matrix)
  interface RebalanceContext {
    action: 'BUY' | 'SELL';
    targetDiffUsd: number;
    targetDiffCoins: number;
    currentWeight: number;
    targetWeight: number;
    category?: string;
    reason?: string;
    exchange?: string;
  }
  const [rebalanceData, setRebalanceData] = useState<RebalanceContext | null>(null);
  const [rebalanceTranche, setRebalanceTranche] = useState<number>(100);

  // Kelly Criterion Settings
  const [historicalWinRate, setHistoricalWinRate] = useState<number>(55); // 55%
  const [showMonteCarloModal, setShowMonteCarloModal] = useState(false);

  // Pipeline Ideas for Quick Import
  const [ideas, setIdeas] = useState<TradeIdea[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Clean symbol for TokenIcon (e.g. SOLUSDT -> SOL)
  const cleanSymbol = ticker.replace(/(USDT|BUSD|USDC|USD|PERP)$/i, '') || ticker;

  // Load ideas for quick select
  useEffect(() => {
    api
      .get<TradeIdea[]>('/ideas')
      .then((res) => {
        if (res && res.length > 0) {
          setIdeas(res);
        }
      })
      .catch((err) => console.error('Failed to load ideas in calculator:', err));
  }, []);

  // Handle passed location state from Pipeline or Rebalancing Matrix
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.source === 'rebalance') {
        if (state.ticker) setTicker(state.ticker);
        const dir = state.rebalanceAction === 'SELL' ? 'SHORT' : 'LONG';
        setDirection(state.direction || dir);
        const ep = Number(state.entryPrice) || 1;
        setEntryPrice(ep);
        if (state.portfolioNetWorth) setAccountSize(Number(state.portfolioNetWorth));
        setSelectedLeverage(1); // Default to 1x Spot for rebalancing

        const diffUsd = Number(state.targetDiffUsd) || 0;
        const diffCoins = Number(state.targetDiffCoins) || (ep > 0 ? diffUsd / ep : 0);

        // Pre-configure realistic 5% SL and 10% TP buffers
        if (dir === 'LONG') {
          setStopLossPrice(Number((ep * 0.95).toFixed(4)));
          setTakeProfitPrice(Number((ep * 1.10).toFixed(4)));
        } else {
          setStopLossPrice(Number((ep * 1.05).toFixed(4)));
          setTakeProfitPrice(Number((ep * 0.90).toFixed(4)));
        }

        const netWorth = Number(state.portfolioNetWorth) || 25000;
        const autoRiskPct = Math.min(25, Math.max(1, Number(((diffUsd * 0.05 / netWorth) * 100).toFixed(1))));
        setRiskPercent(autoRiskPct);

        setRebalanceData({
          action: state.rebalanceAction || (state.direction === 'SHORT' ? 'SELL' : 'BUY'),
          targetDiffUsd: diffUsd,
          targetDiffCoins: diffCoins,
          currentWeight: Number(state.currentWeight) || 0,
          targetWeight: Number(state.targetWeight) || 0,
          category: state.category,
          reason: state.reason,
          exchange: state.exchange,
        });
        setRebalanceTranche(100);

        showToast(`Mode Rebalance Aktif: ${state.rebalanceAction || 'ORDER'} ${state.ticker} ($${diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })})`);
      } else {
        if (state.ticker) setTicker(state.ticker);
        if (state.direction) setDirection(state.direction);
        if (state.entryPrice) setEntryPrice(Number(state.entryPrice));
        if (state.stopLossPrice) setStopLossPrice(Number(state.stopLossPrice));
        if (state.takeProfitPrice) setTakeProfitPrice(Number(state.takeProfitPrice));
        if (state.riskPercent) setRiskPercent(Number(state.riskPercent));

        showToast(`Setup ${state.ticker || ''} (${state.direction || 'LONG'}) imported from Pipeline!`);
      }
    }
  }, [location.state]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleImportIdea = (idea: TradeIdea) => {
    setTicker(idea.symbol);
    setDirection(idea.direction);
    if (idea.entryPrice) setEntryPrice(Number(idea.entryPrice));
    if (idea.stopLossPrice) setStopLossPrice(Number(idea.stopLossPrice));
    if (idea.tp1Price) setTakeProfitPrice(Number(idea.tp1Price));
    if (idea.riskPercent) setRiskPercent(Number(idea.riskPercent));
    showToast(`Setup ${idea.symbol} (${idea.direction}) loaded into Sizer!`);
  };

  // Math Calculations
  const riskAmountUsd = (accountSize * riskPercent) / 100;
  const slDistance = Math.abs(entryPrice - stopLossPrice);
  const slDistancePercent = entryPrice > 0 ? (slDistance / entryPrice) * 100 : 0;

  // Max Position Size in Coins & Total Position Value (USD)
  const positionSizeCoins = slDistance > 0 ? riskAmountUsd / slDistance : 0;
  const totalPositionValueUsd = positionSizeCoins * entryPrice;
  const marginRequiredUsd = selectedLeverage > 0 ? totalPositionValueUsd / selectedLeverage : totalPositionValueUsd;

  // Potential Reward (TP1)
  const tpDistance = Math.abs(takeProfitPrice - entryPrice);
  const rewardUsd = positionSizeCoins * tpDistance;
  const riskRewardRatio = slDistance > 0 ? tpDistance / slDistance : 0;

  // Estimated Liquidation Price (Binance / Bybit standard: 0.5% maintenance margin)
  const maintenanceMarginRate = 0.005;
  let liquidationPrice = 0;
  if (selectedLeverage > 0 && entryPrice > 0) {
    if (direction === 'LONG') {
      liquidationPrice = entryPrice * (1 - (1 / selectedLeverage) + maintenanceMarginRate);
    } else {
      liquidationPrice = entryPrice * (1 + (1 / selectedLeverage) - maintenanceMarginRate);
    }
  }

  // Safety check: is Stop Loss executed before Liquidation?
  const isStopLossSafeFromLiquidation =
    direction === 'LONG'
      ? stopLossPrice > liquidationPrice
      : stopLossPrice < liquidationPrice;

  // Liquidation buffer distance from Stop Loss
  const liqBufferUsd = Math.abs(stopLossPrice - liquidationPrice);
  const liqBufferPercent = entryPrice > 0 ? (liqBufferUsd / entryPrice) * 100 : 0;

  // Kelly Criterion Formula: f* = (b*p - q) / b
  const b = riskRewardRatio > 0 ? riskRewardRatio : 1.5;
  const p = historicalWinRate / 100;
  const q = 1 - p;
  const fullKellyFraction = Math.max(0, (b * p - q) / b);
  const halfKellyPercent = (fullKellyFraction / 2) * 100;
  const halfKellyUsd = (accountSize * halfKellyPercent) / 100;
  const halfKellyCoins = entryPrice > 0 ? halfKellyUsd / entryPrice : 0;

  // Portfolio resilience and Breakeven Win Rate
  const breakevenWinRate = riskRewardRatio > 0 ? (1 / (1 + riskRewardRatio)) * 100 : 50;
  const marginUtilization = accountSize > 0 ? (marginRequiredUsd / accountSize) * 100 : 0;
  const freeCapitalRemaining = Math.max(0, accountSize - marginRequiredUsd);
  const consecutiveLossesTo10Pct = riskPercent > 0 ? Math.floor(10 / riskPercent) : 5;

  // Quick Stop Loss percentage adjusters
  const handleQuickSl = (pct: number) => {
    if (entryPrice <= 0) return;
    if (direction === 'LONG') {
      const newSl = Number((entryPrice * (1 - pct / 100)).toFixed(4));
      setStopLossPrice(newSl);
    } else {
      const newSl = Number((entryPrice * (1 + pct / 100)).toFixed(4));
      setStopLossPrice(newSl);
    }
  };

  // Quick Take Profit R:R adjusters
  const handleQuickRr = (multiplier: number) => {
    if (entryPrice <= 0 || slDistance <= 0) return;
    if (direction === 'LONG') {
      const newTp = Number((entryPrice + slDistance * multiplier).toFixed(4));
      setTakeProfitPrice(newTp);
    } else {
      const newTp = Number((entryPrice - slDistance * multiplier).toFixed(4));
      setTakeProfitPrice(newTp);
    }
  };

  // Copy parameters to clipboard
  const handleCopyParams = () => {
    const text = `═══ QUANTITATIVE POSITION SIZER BLUEPRINT ═══
Ticker: ${ticker} (${direction})
Entry Price: $${entryPrice.toLocaleString()}
Stop Loss: $${stopLossPrice.toLocaleString()} (-${slDistancePercent.toFixed(2)}%)
Take Profit: $${takeProfitPrice.toLocaleString()} (1:${riskRewardRatio.toFixed(2)} R)
Lot Size: ${positionSizeCoins.toFixed(3)} ${cleanSymbol}
Total Position Value: $${totalPositionValueUsd.toFixed(2)}
Required Margin (${selectedLeverage}x): $${marginRequiredUsd.toFixed(2)}
Max Capital Risk: $${riskAmountUsd.toFixed(2)} (${riskPercent}%)
Est. Liquidation: $${liquidationPrice.toFixed(2)}
Liquidation Safety: ${isStopLossSafeFromLiquidation ? `Protected (+${liqBufferPercent.toFixed(2)}% buffer)` : 'CRITICAL WARNING: Liq before SL!'}
Half-Kelly Optimal Risk: ${halfKellyPercent.toFixed(1)}%`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Execution parameters copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy Spot Rebalance Order Syntax
  const handleCopyRebalanceOrder = () => {
    if (!rebalanceData) return;
    const activeUsd = rebalanceData.targetDiffUsd * (rebalanceTranche / 100);
    const activeCoins = entryPrice > 0 ? activeUsd / entryPrice : 0;
    const text = `═══ CRYPTOOS SPOT REBALANCE ORDER ═══
Exchange: ${rebalanceData.exchange || 'Binance / Bybit'}
Pair: ${ticker}
Action: ${rebalanceData.action} (SPOT 1x)
Order Type: LIMIT / MARKET
Amount: ${activeCoins.toFixed(4)} ${cleanSymbol}
Target Value: $${activeUsd.toFixed(2)} USD
Target Price: $${entryPrice.toLocaleString()}
Tranche: ${rebalanceTranche}% of $${rebalanceData.targetDiffUsd.toFixed(2)} USD
Expected Fee (0.075%): ~$${(activeUsd * 0.00075).toFixed(2)} USD
Portfolio Allocation Shift: ${rebalanceData.currentWeight}% ➔ ${rebalanceData.targetWeight}%`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Order eksekusi rebalancing disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Dispatch trade to Trade Journal
  const handleDispatchToJournal = () => {
    const isRebalance = !!rebalanceData;
    const activeUsd = isRebalance ? rebalanceData.targetDiffUsd * (rebalanceTranche / 100) : totalPositionValueUsd;
    const activeCoins = isRebalance && entryPrice > 0 ? activeUsd / entryPrice : positionSizeCoins;

    navigate('/journal', {
      state: {
        openNewModal: true,
        symbol: ticker,
        direction: direction,
        entryPrice: entryPrice,
        positionSize: Number(activeCoins.toFixed(4)),
        stopLossPrice: stopLossPrice,
        takeProfitPrice: takeProfitPrice,
        notes: isRebalance
          ? `[REBALANCE ROTATION] ${rebalanceData.action} ${ticker} ($${activeUsd.toFixed(2)} USD • ${rebalanceTranche}% Tranche). Portfolio allocation: ${rebalanceData.currentWeight}% -> ${rebalanceData.targetWeight}%. ${rebalanceData.reason || 'Execute portfolio rebalance rotation'}.`
          : `Sized via Position Sizer. Risk: ${riskPercent}% ($${riskAmountUsd.toFixed(2)}), Lev: ${selectedLeverage}x, R:R: 1:${riskRewardRatio.toFixed(2)}.`,
        psychology: 'CALM',
      },
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        paddingBottom: 'var(--space-8)',
        backgroundColor: '#000000',
        minHeight: '100%',
      }}
    >
      {/* Toast Notification */}
      {notification && (
        <div className="terminal-toast toast-enter">
          <Sparkles size={15} color="var(--color-accent-primary)" />
          <span>{notification}</span>
        </div>
      )}

      {/* Monte Carlo Ruin Simulation Modal */}
      {showMonteCarloModal && (
        <div
          className="modal-backdrop-animate"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowMonteCarloModal(false)}
        >
          <div
            className="modal-dialog-animate"
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#0a0a0c',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <MonteCarloEngine
              initialWinRate={historicalWinRate || 55}
              initialPayoff={riskRewardRatio > 0 ? parseFloat(riskRewardRatio.toFixed(2)) : 2.0}
              initialAccountSize={accountSize || 25000}
              initialRiskPercent={riskPercent || 2.0}
              sourceLabel={`Sizer: ${ticker}`}
              onClose={() => setShowMonteCarloModal(false)}
            />
          </div>
        </div>
      )}

      {/* Header (Cardless Terminal Standard) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          paddingBottom: 'var(--space-2)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.06em' }}>
              RISK MANAGEMENT & POSITION SIZING
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              QUANTITATIVE CAPITAL PRESERVATION
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: '3px 0 0' }}>
            Position Sizer & Risk Calculator
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
            Precision lot sizing, leverage simulation, early liquidation defense, and Half-Kelly Criterion optimization.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleCopyParams}
            style={{
              height: '34px',
              fontSize: '12px',
              padding: '0 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {copied ? <Check size={14} color="var(--color-bullish)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied Blueprint' : 'Copy Parameters'}</span>
          </button>

          <button
            id="btn-open-montecarlo"
            className="btn btn-secondary"
            onClick={() => setShowMonteCarloModal(true)}
            style={{
              height: '34px',
              fontSize: '12px',
              padding: '0 12px',
              backgroundColor: 'rgba(212, 175, 55, 0.08)',
              borderColor: 'rgba(212, 175, 55, 0.3)',
              color: 'var(--color-accent-primary)',
            }}
          >
            <Dice5 size={14} color="var(--color-accent-primary)" />
            <span>Monte Carlo Ruin Engine</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleDispatchToJournal}
            style={{
              height: '34px',
              fontSize: '12px',
              padding: '0 12px',
              backgroundColor: 'rgba(212, 175, 55, 0.08)',
              borderColor: 'rgba(212, 175, 55, 0.25)',
              color: 'var(--color-accent-primary)',
            }}
          >
            <BookOpen size={14} />
            <span>Send to Journal</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => navigate('/pipeline')}
            style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}
          >
            <Layers size={14} />
            <span>Open Pipeline Lab</span>
          </button>
        </div>
      </div>

      {/* Saved Pipeline Ideas Quick Selector Bar */}
      {ideas.length > 0 && (
        <div
          style={{
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflowX: 'auto',
            background: 'rgba(255, 255, 255, 0.015)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            borderLeft: 'none',
            borderRight: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <Layers size={13} color="var(--color-accent-primary)" />
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              IMPORT FROM PIPELINE:
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {ideas.map((item) => {
              const itemClean = item.symbol.replace(/(USDT|BUSD|USDC|USD|PERP)$/i, '') || item.symbol;
              const isSelected = ticker === item.symbol;
              return (
                <button
                  key={item.id}
                  onClick={() => handleImportIdea(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <TokenIcon symbol={itemClean} size={15} />
                  <span className="mono">{item.symbol}</span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      backgroundColor: item.direction === 'LONG' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: item.direction === 'LONG' ? 'var(--color-bullish)' : 'var(--color-bearish)',
                    }}
                  >
                    {item.direction}
                  </span>
                  <span style={{ fontSize: '9px', opacity: 0.6 }}>{item.timeframe || '4H'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1-Click Rebalance Execution Command Dock */}
      {rebalanceData && (
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#050505',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 24px rgba(212, 175, 55, 0.08)',
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  color: 'var(--color-accent-primary)',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                <Zap size={13} />
                <span>1-CLICK REBALANCE EXECUTION ENGINE</span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 800,
                  backgroundColor: rebalanceData.action === 'BUY' ? 'rgba(48, 209, 88, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: rebalanceData.action === 'BUY' ? 'var(--color-bullish)' : 'var(--color-bearish)',
                  border: rebalanceData.action === 'BUY' ? '1px solid rgba(48, 209, 88, 0.35)' : '1px solid rgba(244, 63, 94, 0.35)',
                }}
              >
                {rebalanceData.action === 'BUY' ? 'ACCUMULATE (BUY)' : 'TRIM (SELL)'}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                {ticker}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleCopyRebalanceOrder}
                className="btn btn-secondary"
                style={{ height: '30px', fontSize: '11px', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Copy size={12} />
                <span>Copy Spot Order</span>
              </button>
              <button
                onClick={handleDispatchToJournal}
                className="btn btn-primary"
                style={{ height: '30px', fontSize: '11px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 800 }}
              >
                <BookOpen size={12} />
                <span>Log to Trade Journal</span>
              </button>
              <button
                onClick={() => setRebalanceData(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                title="Dismiss Rebalance Mode"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Sizing & Tranche Controls Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Metric 1: Target Dollar Volume */}
            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block' }}>
                TARGET ROTATION VOLUME ({rebalanceTranche}% TRANCHE)
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span className="mono" style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>
                  ${(rebalanceData.targetDiffUsd * (rebalanceTranche / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  USD
                </span>
              </div>
            </div>

            {/* Metric 2: Spot Coin Units */}
            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block' }}>
                EXACT SPOT ORDER QUANTITY
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span className="mono" style={{ fontSize: '18px', fontWeight: 900, color: rebalanceData.action === 'BUY' ? 'var(--color-bullish)' : 'var(--color-amber)' }}>
                  {entryPrice > 0 ? ((rebalanceData.targetDiffUsd * (rebalanceTranche / 100)) / entryPrice).toFixed(4) : '0.0000'}
                </span>
                <span className="mono" style={{ fontSize: '11px', color: '#ffffff', fontWeight: 700 }}>
                  {cleanSymbol}
                </span>
              </div>
            </div>

            {/* Metric 3: Portfolio Weight Impact */}
            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block' }}>
                PORTFOLIO ALLOCATION BEFORE &rarr; AFTER
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-secondary)' }}>
                  {rebalanceData.currentWeight}%
                </span>
                <ArrowRightLeft size={12} color="var(--color-accent-primary)" />
                <span className="mono" style={{ fontSize: '15px', fontWeight: 900, color: 'var(--color-bullish)' }}>
                  {rebalanceData.targetWeight}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  ({rebalanceData.targetWeight - rebalanceData.currentWeight > 0 ? '+' : ''}{(rebalanceData.targetWeight - rebalanceData.currentWeight).toFixed(1)}% rotation)
                </span>
              </div>
            </div>

            {/* Metric 4: Tranche Stepper */}
            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                SPLIT DCA TRANCHE:
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[100, 50, 33, 25].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setRebalanceTranche(pct);
                      const activeUsd = rebalanceData.targetDiffUsd * (pct / 100);
                      const autoRiskPct = Math.min(25, Math.max(1, Number(((activeUsd * 0.05 / accountSize) * 100).toFixed(1))));
                      setRiskPercent(autoRiskPct);
                    }}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      borderRadius: 'var(--radius-xs)',
                      border: rebalanceTranche === pct ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: rebalanceTranche === pct ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: rebalanceTranche === pct ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                      fontSize: '10px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subtext info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: 'var(--color-text-secondary)' }}>
            <span>
              ℹ️ Position Sizer parameters below have been synchronized automatically for Spot 1x execution. Est. Taker Fee (0.075%): ~${((rebalanceData.targetDiffUsd * (rebalanceTranche / 100)) * 0.00075).toFixed(2)} USD.
            </span>
            <button
              onClick={() => navigate('/rebalancing')}
              style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', fontSize: '10.5px', cursor: 'pointer', fontWeight: 700 }}
            >
              &larr; Back to Rebalancing Matrix
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Cardless Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          borderLeft: 'none',
          borderRight: 'none',
          backgroundColor: '#000000',
        }}
      >
        {/* Left Column: Trade Inputs */}
        <div
          style={{
            padding: '24px 28px',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-accent-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calculator size={15} color="var(--color-accent-primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Position & Risk Parameters
                </h2>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  Interactive variables configured in real-time
                </span>
              </div>
            </div>
            <span
              style={{
                fontSize: '9px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 800,
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--color-bullish)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Activity size={10} />
              LIVE FORMULA
            </span>
          </div>

          {/* Trade Direction Segmented Toggle */}
          <div>
            <span
              style={{
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                display: 'block',
                marginBottom: '6px',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              EXECUTION DIRECTION
            </span>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setDirection('LONG')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: direction === 'LONG' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: direction === 'LONG' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: direction === 'LONG' ? 'var(--color-bullish)' : 'var(--color-text-secondary)',
                  boxShadow: direction === 'LONG' ? '0 0 14px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <TrendingUp size={14} />
                <span>LONG POSITION</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection('SHORT')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: direction === 'SHORT' ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid transparent',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: direction === 'SHORT' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                  color: direction === 'SHORT' ? 'var(--color-bearish)' : 'var(--color-text-secondary)',
                  boxShadow: direction === 'SHORT' ? '0 0 14px rgba(244, 63, 94, 0.2)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <TrendingDown size={14} />
                <span>SHORT POSITION</span>
              </button>
            </div>
          </div>

          {/* Token Ticker with Live TokenIcon & Portfolio Capital */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label
                style={{
                  fontSize: '10px',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                TOKEN TICKER
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0 8px',
                  height: '36px',
                }}
              >
                <div style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                  <TokenIcon symbol={cleanSymbol} size={20} />
                </div>
                <input
                  type="text"
                  className="mono"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    outline: 'none',
                  }}
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="SOLUSDT"
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label
                  style={{
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  PORTFOLIO CAPITAL (USD)
                </label>
              </div>
              <input
                type="number"
                className="form-input mono"
                style={{
                  height: '36px',
                  fontSize: '13px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
                value={accountSize}
                onChange={(e) => setAccountSize(Number(e.target.value))}
              />
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                {[10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAccountSize(amt)}
                    style={{
                      flex: 1,
                      padding: '2px 0',
                      fontSize: '9px',
                      borderRadius: '3px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      background: accountSize === amt ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      color: accountSize === amt ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    ${amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Tolerance Percentage Selector with Custom Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '10px',
                  color: 'var(--color-text-muted)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                RISK TOLERANCE PER TRADE (%)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--color-bearish)',
                    fontWeight: 700,
                    background: 'rgba(244, 63, 94, 0.1)',
                    padding: '1px 6px',
                    borderRadius: '3px',
                  }}
                >
                  -${riskAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Max Loss
                </span>
                <span
                  className="value-number"
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-accent-primary)',
                    fontWeight: 800,
                  }}
                >
                  {riskPercent}%
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[0.5, 1.0, 1.5, 2.0, 3.0].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskPercent(r)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 'var(--radius-xs)',
                    border:
                      riskPercent === r
                        ? '1px solid var(--color-accent-primary)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    backgroundColor:
                      riskPercent === r ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: riskPercent === r ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {r}%
                </button>
              ))}
              <div style={{ position: 'relative', width: '65px' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  className="mono"
                  style={{
                    width: '100%',
                    height: '28px',
                    padding: '2px 14px 2px 6px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value) || 0)}
                  placeholder="Custom"
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '5px',
                    top: '5px',
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                    pointerEvents: 'none',
                  }}
                >
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Entry, Stop Loss, Take Profit with Ergonomic Calculators */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label
                style={{
                  fontSize: '10px',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 700,
                }}
              >
                ENTRY PRICE ($)
              </label>
              <input
                type="number"
                step="any"
                className="form-input mono"
                style={{
                  height: '36px',
                  fontSize: '13px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '10px', color: 'var(--color-bearish)', fontWeight: 700 }}>
                  STOP LOSS ($)
                </label>
                {slDistancePercent > 0 && (
                  <span className="mono bearish-text" style={{ fontSize: '9px', fontWeight: 800 }}>
                    -{slDistancePercent.toFixed(2)}%
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                className="form-input mono"
                style={{
                  height: '36px',
                  fontSize: '13px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(244, 63, 94, 0.04)',
                  borderColor: 'rgba(244, 63, 94, 0.3)',
                  color: 'var(--color-bearish)',
                }}
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value))}
              />
              {/* Quick SL Presets */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                {[2, 3, 5, 8].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickSl(pct)}
                    style={{
                      flex: 1,
                      padding: '2px 0',
                      fontSize: '9px',
                      borderRadius: '3px',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      background: 'rgba(244, 63, 94, 0.06)',
                      color: 'var(--color-bearish)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '10px', color: 'var(--color-bullish)', fontWeight: 700 }}>
                TARGET TAKE PROFIT ($)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="mono bullish-text" style={{ fontSize: '9px', fontWeight: 800 }}>
                  +{((tpDistance / (entryPrice || 1)) * 100).toFixed(2)}%
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '2px',
                    background: riskRewardRatio >= 2 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                    color: riskRewardRatio >= 2 ? 'var(--color-bullish)' : 'var(--color-amber)',
                  }}
                >
                  1:{riskRewardRatio.toFixed(2)} R
                </span>
              </div>
            </div>
            <input
              type="number"
              step="any"
              className="form-input mono"
              style={{
                height: '36px',
                fontSize: '13px',
                fontWeight: 800,
                backgroundColor: 'rgba(16, 185, 129, 0.04)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                color: 'var(--color-bullish)',
              }}
              value={takeProfitPrice}
              onChange={(e) => setTakeProfitPrice(Number(e.target.value))}
            />
            {/* Quick TP R:R Presets */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              {[1.5, 2, 3, 4, 5].map((rr) => (
                <button
                  key={rr}
                  type="button"
                  onClick={() => handleQuickRr(rr)}
                  style={{
                    flex: 1,
                    padding: '2px 0',
                    fontSize: '9px',
                    borderRadius: '3px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    background: 'rgba(16, 185, 129, 0.06)',
                    color: 'var(--color-bullish)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {rr}R
                </button>
              ))}
            </div>
          </div>

          {/* Leverage Selector for Futures */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '10px',
                  color: 'var(--color-text-muted)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                LEVERAGE SIMULATOR
              </label>
              <span
                className="value-number"
                style={{
                  fontSize: '11px',
                  color: selectedLeverage > 10 ? 'var(--color-amber)' : 'var(--color-accent-primary)',
                  fontWeight: 800,
                }}
              >
                {selectedLeverage}x Leverage
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[1, 2, 3, 5, 10, 20].map((lev) => (
                <button
                  key={lev}
                  type="button"
                  onClick={() => setSelectedLeverage(lev)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 'var(--radius-xs)',
                    border:
                      selectedLeverage === lev
                        ? '1px solid var(--color-accent-primary)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    backgroundColor:
                      selectedLeverage === lev ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: selectedLeverage === lev ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {lev}x
                </button>
              ))}
              <div style={{ position: 'relative', width: '55px' }}>
                <input
                  type="number"
                  min="1"
                  max="125"
                  className="mono"
                  style={{
                    width: '100%',
                    height: '28px',
                    padding: '2px 14px 2px 6px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                  value={selectedLeverage}
                  onChange={(e) => setSelectedLeverage(Math.max(1, Number(e.target.value) || 1))}
                  placeholder="Custom"
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '5px',
                    top: '5px',
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                    pointerEvents: 'none',
                  }}
                >
                  x
                </span>
              </div>
            </div>
          </div>

          {/* Portfolio Impact & Quantitative Edge Telemetry */}
          <div
            style={{
              marginTop: 'auto',
              padding: '14px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
                PORTFOLIO IMPACT & STATISTICAL EDGE
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: marginUtilization <= 30 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: marginUtilization <= 30 ? 'var(--color-bullish)' : 'var(--color-bearish)',
                  border: marginUtilization <= 30 ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
                }}
              >
                {marginUtilization <= 30 ? 'SAFE MARGIN RATIO' : 'HIGH MARGIN UTILIZATION'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>BREAKEVEN WIN RATE</span>
                <span className="mono" style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', display: 'block', marginTop: '2px' }}>
                  {breakevenWinRate.toFixed(1)}%
                </span>
                <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '1px' }}>
                  Min win rate for profitability
                </span>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>FREE CAPITAL REMAINING</span>
                <span className="mono" style={{ fontSize: '15px', fontWeight: 900, color: 'var(--color-accent-primary)', display: 'block', marginTop: '2px' }}>
                  ${freeCapitalRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '1px' }}>
                  {(100 - marginUtilization).toFixed(1)}% capital available
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--color-text-secondary)', paddingTop: '2px' }}>
              <span>Resilience: <strong style={{ color: '#ffffff' }}>{consecutiveLossesTo10Pct} consecutive losses</strong> to hit 10% drawdown.</span>
              <span style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>
                {marginUtilization.toFixed(1)}% Margin used
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Lot Size & Risk Profile */}
        <div
          style={{
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: '12px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Execution Recommendation & Lot Size
              </h2>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                Mathematically risk-neutralized allocation
              </span>
            </div>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor:
                  riskRewardRatio >= 3.0
                    ? 'rgba(16, 185, 129, 0.2)'
                    : riskRewardRatio >= 2.0
                    ? 'rgba(16, 185, 129, 0.15)'
                    : riskRewardRatio >= 1.5
                    ? 'rgba(251, 191, 36, 0.15)'
                    : 'rgba(244, 63, 94, 0.15)',
                color:
                  riskRewardRatio >= 2.0
                    ? 'var(--color-bullish)'
                    : riskRewardRatio >= 1.5
                    ? 'var(--color-amber)'
                    : 'var(--color-bearish)',
                border:
                  riskRewardRatio >= 2.0
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(251, 191, 36, 0.3)',
              }}
            >
              {riskRewardRatio >= 3.0
                ? 'ELITE ASYMMETRY (3.0+ R)'
                : riskRewardRatio >= 2.0
                ? 'OPTIMAL SETUP (2.0+ R)'
                : riskRewardRatio >= 1.5
                ? 'ACCEPTABLE R:R (1.5+ R)'
                : 'SUB-OPTIMAL R:R (<1.5)'}
            </span>
          </div>

          {/* Primary Hero Lot Size Pod with Verified Token Branding */}
          <div
            style={{
              padding: '18px 22px',
              backgroundColor: 'rgba(212, 175, 55, 0.03)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(212, 175, 55, 0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient gold backdrop aura */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--color-accent-primary)',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                }}
              >
                RECOMMENDED EXECUTION LOT SIZE
              </span>
              <span
                style={{
                  fontSize: '9px',
                  color: 'var(--color-text-muted)',
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                }}
              >
                {direction} &bull; {selectedLeverage}X
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                }}
              >
                <TokenIcon symbol={cleanSymbol} size={28} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span
                    className="value-number"
                    style={{
                      fontSize: '32px',
                      fontWeight: 900,
                      color: '#ffffff',
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {positionSizeCoins.toFixed(3)}
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: 'var(--color-accent-primary)',
                    }}
                  >
                    {cleanSymbol}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '4px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>
                  TOTAL NOTIONAL VALUE
                </span>
                <div style={{ marginTop: '2px' }}>
                  <DualCurrencyValue usd={totalPositionValueUsd} layout="row" size="sm" />
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>
                  REQUIRED MARGIN ({selectedLeverage}x)
                </span>
                <div style={{ marginTop: '2px' }}>
                  <DualCurrencyValue usd={marginRequiredUsd} layout="row" size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* 4-Cell High-Density Metrics Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  MAX CAPITAL RISK
                </span>
                <span style={{ fontSize: '9px', color: 'var(--color-bearish)', fontWeight: 800 }}>
                  {riskPercent}%
                </span>
              </div>
              <div style={{ marginTop: '4px' }}>
                <DualCurrencyValue usd={riskAmountUsd} size="md" sentiment="bearish" layout="row" />
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  POTENTIAL PROFIT (TP1)
                </span>
                <span style={{ fontSize: '9px', color: 'var(--color-bullish)', fontWeight: 800 }}>
                  +{((rewardUsd / (accountSize || 1)) * 100).toFixed(2)}% ROI
                </span>
              </div>
              <div style={{ marginTop: '4px' }}>
                <DualCurrencyValue usd={rewardUsd} size="md" sentiment="bullish" layout="row" />
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>
                STOP LOSS DISTANCE
              </span>
              <div className="value-number bearish-text" style={{ fontSize: '15px', fontWeight: 900, marginTop: '3px' }}>
                {slDistancePercent.toFixed(2)}% <span style={{ fontSize: '11px', opacity: 0.7 }}>(${slDistance.toFixed(2)})</span>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>
                ASYMMETRIC RATIO (R:R)
              </span>
              <div
                className="value-number"
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: riskRewardRatio >= 2.0 ? 'var(--color-accent-primary)' : 'var(--color-amber)',
                  marginTop: '3px',
                }}
              >
                1 : {riskRewardRatio.toFixed(2)} R
              </div>
            </div>
          </div>

          {/* Interactive Visual Liquidation Safety Gauge */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: isStopLossSafeFromLiquidation ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.08)',
              border: `1px solid ${
                isStopLossSafeFromLiquidation ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.4)'
              }`,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isStopLossSafeFromLiquidation ? (
                  <ShieldCheck size={16} color="var(--color-bullish)" />
                ) : (
                  <AlertTriangle size={16} color="var(--color-bearish)" />
                )}
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: isStopLossSafeFromLiquidation ? 'var(--color-bullish)' : 'var(--color-bearish)',
                    }}
                  >
                    {isStopLossSafeFromLiquidation
                      ? 'STOP LOSS PROTECTED FROM LIQUIDATION'
                      : 'CRITICAL WARNING: MARGIN CALL BEFORE SL!'}
                  </span>
                </div>
              </div>

              <span
                className="mono"
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                Est. Liq: ${liquidationPrice.toFixed(2)}
              </span>
            </div>

            {/* Visual Gauge Track */}
            <div style={{ marginTop: '2px' }}>
              <div
                style={{
                  height: '6px',
                  borderRadius: '3px',
                  background: isStopLossSafeFromLiquidation
                    ? 'linear-gradient(90deg, rgba(244, 63, 94, 0.6) 0%, rgba(251, 191, 36, 0.6) 30%, rgba(16, 185, 129, 0.9) 100%)'
                    : 'rgba(244, 63, 94, 0.8)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '9px',
                  color: 'var(--color-text-muted)',
                  marginTop: '4px',
                  fontWeight: 700,
                }}
              >
                <span>Liq: ${liquidationPrice.toFixed(2)}</span>
                <span style={{ color: isStopLossSafeFromLiquidation ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                  Buffer: {isStopLossSafeFromLiquidation ? `+${liqBufferPercent.toFixed(2)}%` : 'FAILED'}
                </span>
                <span>SL: ${stopLossPrice.toFixed(2)}</span>
                <span>Entry: ${entryPrice.toFixed(2)}</span>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
              {isStopLossSafeFromLiquidation
                ? `Your Stop Loss at $${stopLossPrice} is placed safely before the liquidation threshold at $${liquidationPrice.toFixed(
                    2
                  )}. Your safety buffer is $${liqBufferUsd.toFixed(2)} (${liqBufferPercent.toFixed(2)}%).`
                : `Liquidation level ($${liquidationPrice.toFixed(
                    2
                  )}) triggers BEFORE your Stop Loss ($${stopLossPrice})! High risk of total wipeout. Reduce leverage to under ${Math.max(
                    1,
                    selectedLeverage - 2
                  )}x.`}
            </p>
          </div>

          {/* Kelly Criterion Quantitative Allocation Card */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={14} color="#f59e0b" />
                <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 800 }}>
                  KELLY CRITERION QUANTITATIVE SIZER
                </span>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: '11px',
                  color: 'var(--color-accent-primary)',
                  fontWeight: 900,
                }}
              >
                Half-Kelly: {halfKellyPercent.toFixed(1)}% (${halfKellyUsd.toLocaleString()})
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                HISTORICAL WIN RATE:
              </span>
              <input
                type="range"
                min="20"
                max="85"
                step="1"
                value={historicalWinRate}
                onChange={(e) => setHistoricalWinRate(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-accent-primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <input
                  type="number"
                  min="10"
                  max="95"
                  value={historicalWinRate}
                  onChange={(e) => setHistoricalWinRate(Number(e.target.value) || 50)}
                  className="form-input mono"
                  style={{
                    width: '46px',
                    height: '24px',
                    fontSize: '11px',
                    padding: '1px 4px',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>%</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)', margin: 0, maxWidth: '65%' }}>
                The Half-Kelly model prevents risk of ruin while compounding capital growth. Recommended risk budget:{' '}
                <strong style={{ color: '#fff' }}>{halfKellyPercent.toFixed(1)}%</strong> ({halfKellyCoins.toFixed(3)}{' '}
                {cleanSymbol}).
              </p>
              <button
                type="button"
                onClick={() => {
                  setRiskPercent(Number(halfKellyPercent.toFixed(1)));
                  showToast(`Risk tolerance updated to Half-Kelly recommendation (${halfKellyPercent.toFixed(1)}%)!`);
                }}
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  backgroundColor: 'rgba(212, 175, 55, 0.12)',
                  color: 'var(--color-accent-primary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Apply Half-Kelly
              </button>
            </div>
          </div>

          {/* Action Dispatch Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopyParams}
              style={{
                flex: 1,
                height: '40px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
              }}
            >
              {copied ? <Check size={15} color="var(--color-bullish)" /> : <Copy size={15} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Blueprint'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDispatchToJournal}
              style={{
                flex: 1.5,
                height: '40px',
                fontSize: '12px',
                fontWeight: 800,
                gap: '8px',
              }}
            >
              <BookOpen size={15} />
              <span>Dispatch Setup to Trade Journal</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
