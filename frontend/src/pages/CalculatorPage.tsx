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
} from 'lucide-react';
import { api } from '../services/api';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';
import { TradeIdea } from '../types/trade.types';

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

  // Kelly Criterion Settings
  const [historicalWinRate, setHistoricalWinRate] = useState<number>(55); // 55%

  // Pipeline Ideas for Quick Import
  const [ideas, setIdeas] = useState<TradeIdea[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load ideas for quick select
  useEffect(() => {
    api.get<TradeIdea[]>('/ideas').then((res) => {
      if (res && res.length > 0) {
        setIdeas(res);
      }
    }).catch((err) => console.error('Failed to load ideas in calculator:', err));
  }, []);

  // Handle passed location state from Pipeline or elsewhere
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.ticker) setTicker(state.ticker);
      if (state.direction) setDirection(state.direction);
      if (state.entryPrice) setEntryPrice(state.entryPrice);
      if (state.stopLossPrice) setStopLossPrice(state.stopLossPrice);
      if (state.takeProfitPrice) setTakeProfitPrice(state.takeProfitPrice);
      if (state.riskPercent) setRiskPercent(state.riskPercent);

      setNotification(`Setup ${state.ticker || ''} (${state.direction || 'LONG'}) berhasil diimpor dari Pipeline!`);
      setTimeout(() => setNotification(null), 4000);
    }
  }, [location.state]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleImportIdea = (idea: TradeIdea) => {
    setTicker(idea.symbol);
    setDirection(idea.direction);
    if (idea.entryPrice) setEntryPrice(idea.entryPrice);
    if (idea.stopLossPrice) setStopLossPrice(idea.stopLossPrice);
    if (idea.tp1Price) setTakeProfitPrice(idea.tp1Price);
    if (idea.riskPercent) setRiskPercent(idea.riskPercent);
    showToast(`Setup ${idea.symbol} (${idea.direction}) berhasil dimuat ke Sizer!`);
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

  // Estimated Liquidation Price
  const maintenanceMarginRate = 0.005; // 0.5% default Binance/Bybit
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

  // Kelly Criterion Formula: f* = (b*p - q) / b
  const b = riskRewardRatio > 0 ? riskRewardRatio : 1.5;
  const p = historicalWinRate / 100;
  const q = 1 - p;
  const fullKellyFraction = Math.max(0, (b * p - q) / b);
  const halfKellyPercent = (fullKellyFraction / 2) * 100;

  // Copy parameters to clipboard
  const handleCopyParams = () => {
    const text = `Trade Execution Plan:
Ticker: ${ticker} (${direction})
Entry: $${entryPrice}
Stop Loss: $${stopLossPrice} (-${slDistancePercent.toFixed(2)}%)
Take Profit: $${takeProfitPrice} (1:${riskRewardRatio.toFixed(2)}R)
Lot Size: ${positionSizeCoins.toFixed(3)} ${ticker.replace('USDT', '')}
Total Value: $${totalPositionValueUsd.toFixed(2)}
Margin (${selectedLeverage}x): $${marginRequiredUsd.toFixed(2)}
Max Risk: $${riskAmountUsd.toFixed(2)} (${riskPercent}%)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Parameter eksekusi disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingBottom: 'var(--space-8)' }}>
      {/* Toast Notification */}
      {notification && (
        <div className="terminal-toast toast-enter">
          <Sparkles size={15} color="var(--color-accent-primary)" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header (Cardless Terminal Workstation Standard) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.06em' }}>
              RISK MANAGEMENT & POSITION SIZING
            </span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              QUANTITATIVE CAPITAL PRESERVATION
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: '2px 0 0' }}>
            Position Sizer & Risk Calculator
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
            Kalkulasi lot size presisi, simulasi leverage, proteksi likuidasi dini, dan optimasi Half-Kelly Criterion.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleCopyParams}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
          >
            {copied ? <Check size={14} color="var(--color-bullish)" /> : <Copy size={14} />}
            <span>{copied ? 'Tersalin' : 'Salin Parameter'}</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/pipeline')}
            style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}
          >
            <Layers size={14} />
            <span>Buka Pipeline Lab</span>
          </button>
        </div>
      </div>

      {/* Saved Pipeline Ideas Quick Selector Bar */}
      {ideas.length > 0 && (
        <div
          className="cardless-sheet"
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflowX: 'auto',
            background: 'transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <Layers size={13} color="var(--color-accent-primary)" />
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              IMPORT DARI PIPELINE:
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {ideas.map((item) => (
              <button
                key={item.id}
                onClick={() => handleImportIdea(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: ticker === item.symbol ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                  backgroundColor: ticker === item.symbol ? 'rgba(212, 175, 55, 0.08)' : 'var(--color-bg-elevated)',
                  color: ticker === item.symbol ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  transition: 'background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast)',
                }}
              >
                <span className="mono">{item.symbol}</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 4px',
                    borderRadius: '2px',
                    backgroundColor: item.direction === 'LONG' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    color: item.direction === 'LONG' ? 'var(--color-bullish)' : 'var(--color-bearish)',
                  }}
                >
                  {item.direction}
                </span>
                <span style={{ fontSize: '9px', opacity: 0.6 }}>{item.timeframe || '4H'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        {/* Left Column: Trade Inputs */}
        <div style={{ padding: '20px 24px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calculator size={14} color="var(--color-accent-primary)" />
              </div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Parameter Posisi & Risiko
              </h2>
            </div>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
              LIVE FORMULA
            </span>
          </div>

          {/* Trade Direction Segmented Toggle */}
          <div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
              ARAH EKSEKUSI (DIRECTION)
            </span>
            <div style={{ display: 'flex', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setDirection('LONG')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: direction === 'LONG' ? 'var(--color-bullish)' : 'transparent',
                  color: direction === 'LONG' ? '#ffffff' : 'var(--color-text-secondary)',
                  boxShadow: direction === 'LONG' ? '0 0 10px rgba(16, 185, 129, 0.35)' : 'none',
                  transition: 'background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast)',
                }}
              >
                <TrendingUp size={13} />
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
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: direction === 'SHORT' ? 'var(--color-bearish)' : 'transparent',
                  color: direction === 'SHORT' ? '#ffffff' : 'var(--color-text-secondary)',
                  boxShadow: direction === 'SHORT' ? '0 0 10px rgba(244, 63, 94, 0.35)' : 'none',
                  transition: 'background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast)',
                }}
              >
                <TrendingDown size={13} />
                <span>SHORT POSITION</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
                TOKEN TICKER
              </label>
              <input
                type="text"
                className="form-input mono"
                style={{ height: '34px', fontSize: '13px', fontWeight: 800 }}
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700, letterSpacing: '0.04em' }}>
                MODAL PORTFOLIO (USD)
              </label>
              <input
                type="number"
                className="form-input mono"
                style={{ height: '34px', fontSize: '13px', fontWeight: 800 }}
                value={accountSize}
                onChange={(e) => setAccountSize(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Risk Tolerance Percentage Selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                TOLERANSI RISIKO PER TRADE (%)
              </label>
              <span className="value-number" style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800 }}>
                {riskPercent}% (${riskAmountUsd.toLocaleString()})
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[0.5, 1.0, 1.5, 2.0, 3.0].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskPercent(r)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--color-border)',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    backgroundColor: riskPercent === r ? 'var(--color-accent-primary)' : 'var(--color-bg-elevated)',
                    color: riskPercent === r ? '#08080a' : 'var(--color-text-secondary)',
                    transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                  }}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>

          {/* Entry, Stop Loss, Take Profit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                ENTRY PRICE ($)
              </label>
              <input
                type="number"
                step="any"
                className="form-input mono"
                style={{ height: '34px', fontSize: '12px', borderColor: 'var(--color-cyan-border)' }}
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
                  <span className="mono bearish-text" style={{ fontSize: '9px', fontWeight: 700 }}>
                    -{slDistancePercent.toFixed(2)}%
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                className="form-input mono"
                style={{ height: '34px', fontSize: '12px', borderColor: 'var(--color-bearish-border)' }}
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '10px', color: 'var(--color-bullish)', fontWeight: 700 }}>
                TARGET TAKE PROFIT ($)
              </label>
              <span className="mono bullish-text" style={{ fontSize: '9px', fontWeight: 700 }}>
                +{((tpDistance / entryPrice) * 100).toFixed(2)}% (1:{riskRewardRatio.toFixed(2)}R)
              </span>
            </div>
            <input
              type="number"
              step="any"
              className="form-input mono"
              style={{ height: '34px', fontSize: '12px', borderColor: 'var(--color-bullish-border)' }}
              value={takeProfitPrice}
              onChange={(e) => setTakeProfitPrice(Number(e.target.value))}
            />
          </div>

          {/* Leverage Selector for Futures */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                LEVERAGE SIMULATOR
              </label>
              <span className="value-number" style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800 }}>
                {selectedLeverage}x Leverage
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 5, 10, 20].map((lev) => (
                <button
                  key={lev}
                  type="button"
                  onClick={() => setSelectedLeverage(lev)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--color-border)',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    backgroundColor: selectedLeverage === lev ? 'var(--color-accent-primary)' : 'var(--color-bg-elevated)',
                    color: selectedLeverage === lev ? '#08080a' : 'var(--color-text-secondary)',
                    transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                  }}
                >
                  {lev}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Lot Size & Risk Profile */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Rekomendasi Eksekusi & Lot Size
            </h2>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '3px',
                backgroundColor: riskRewardRatio >= 2.0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                color: riskRewardRatio >= 2.0 ? 'var(--color-bullish)' : 'var(--color-amber)',
              }}
            >
              {riskRewardRatio >= 2.0 ? 'OPTIMAL R:R' : 'FAIR R:R'}
            </span>
          </div>

          {/* Primary Lot Size Card */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-accent)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              UKURAN POSISI MAKSIMAL (POSITION SIZE)
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span className="value-number" style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-accent-primary)' }}>
                {positionSizeCoins.toFixed(3)} {ticker.replace('USDT', '')}
              </span>
            </div>
            <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Nilai Eksekusi Total:</span>
              <DualCurrencyValue usd={totalPositionValueUsd} layout="row" size="sm" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Margin Diperlukan ({selectedLeverage}x):</span>
              <DualCurrencyValue usd={marginRequiredUsd} layout="row" size="sm" />
            </div>
          </div>

          {/* 4-Cell Metric Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>MAKSIMAL RISIKO MODAL</span>
              <div style={{ marginTop: '2px' }}>
                <DualCurrencyValue usd={riskAmountUsd} size="md" sentiment="bearish" layout="row" />
              </div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>POTENSI PROFIT (TP1)</span>
              <div style={{ marginTop: '2px' }}>
                <DualCurrencyValue usd={rewardUsd} size="md" sentiment="bullish" layout="row" />
              </div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>SL DISTANCE</span>
              <div className="value-number bearish-text" style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px' }}>
                {slDistancePercent.toFixed(2)}%
              </div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>RISK : REWARD</span>
              <div
                className="value-number"
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: riskRewardRatio >= 2.0 ? 'var(--color-accent-primary)' : 'var(--color-amber)',
                  marginTop: '2px',
                }}
              >
                1 : {riskRewardRatio.toFixed(2)} R
              </div>
            </div>
          </div>

          {/* Liquidation Safety Warning Card */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: isStopLossSafeFromLiquidation ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.1)',
              border: `1px solid ${isStopLossSafeFromLiquidation ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.4)'}`,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isStopLossSafeFromLiquidation ? (
                  <ShieldCheck size={14} color="var(--color-bullish)" />
                ) : (
                  <AlertTriangle size={14} color="var(--color-bearish)" />
                )}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isStopLossSafeFromLiquidation ? 'var(--color-bullish)' : 'var(--color-bearish)',
                  }}
                >
                  {isStopLossSafeFromLiquidation ? 'Stop Loss Terlindungi dari Likuidasi' : 'PERINGATAN LIKUIDASI DINI!'}
                </span>
              </div>
              <span className="mono" style={{ fontSize: '11px', color: '#fff' }}>
                Est. Liq: ${liquidationPrice.toFixed(2)}
              </span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)', margin: 0 }}>
              {isStopLossSafeFromLiquidation
                ? `Stop Loss Anda di $${stopLossPrice} akan terpicu sebelum harga mencapai level likuidasi di $${liquidationPrice.toFixed(2)}.`
                : `Level likuidasi ($${liquidationPrice.toFixed(2)}) terpicu sebelum Stop Loss ($${stopLossPrice})! Harap turunkan leverage!`}
            </p>
          </div>

          {/* Kelly Criterion Optimization Box */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <Flame size={12} color="#f59e0b" />
                KELLY CRITERION SIZING:
                <input
                  type="number"
                  min="10"
                  max="95"
                  value={historicalWinRate}
                  onChange={(e) => setHistoricalWinRate(Number(e.target.value) || 50)}
                  className="form-input mono"
                  style={{ width: '44px', height: '22px', fontSize: '10px', padding: '1px 4px', display: 'inline-block', marginLeft: '4px' }}
                />
                % Win Rate
              </span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800 }}>
                Half-Kelly: {halfKellyPercent.toFixed(1)}% (${((accountSize * halfKellyPercent) / 100).toLocaleString()})
              </span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Model Kelly merekomendasikan alokasi modal optimal <strong>{halfKellyPercent.toFixed(1)}%</strong> demi memaksimalkan pertumbuhan geometri modal tanpa risiko ruin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
