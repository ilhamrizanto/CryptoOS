import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Sparkles,
  X,
  Wallet,
  Calculator,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettingsStore } from '../store/settings.store';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';

interface Holding {
  id: string;
  symbol: string;
  amount: number;
  averageBuyPrice?: number;
  targetPercent?: number;
  exchange: string;
  currentPriceUsd: number;
  currentValueUsd: number;
  currentValueIdr: number;
  allocationPercent: number;
}

interface PortfolioSummary {
  totalNetWorthUsd: number;
  totalNetWorthIdr: number;
  usdToIdrRate: number;
  holdings: Holding[];
}

export const RebalancingPage: React.FC = () => {
  const navigate = useNavigate();
  const { usdToIdrRate } = useSettingsStore();

  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Time-based cycle
  const [cycleDays] = useState<number>(60); // 60 days
  const [daysRemaining, setDaysRemaining] = useState<number>(24);

  // Target Editor Modal
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [isSavingTargets, setIsSavingTargets] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const data = await api.get<PortfolioSummary>(`/portfolio/summary?rate=${usdToIdrRate}`);
      setSummary(data || null);

      if (data?.holdings) {
        const initTargets: Record<string, number> = {};
        data.holdings.forEach((h) => {
          initTargets[h.id] = h.targetPercent || 10;
        });
        setTargets(initTargets);
      }
    } catch (err) {
      console.error('Failed to load portfolio for rebalancing:', err);
    }
  }, [usdToIdrRate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate holdings by symbol across multiple exchanges
  const aggregatedBySymbol: Record<
    string,
    {
      symbol: string;
      totalAmount: number;
      currentValueUsd: number;
      currentPriceUsd: number;
      actualPercent: number;
      targetPercent: number;
      deviationPercent: number;
      holdings: Holding[];
    }
  > = {};

  if (summary) {
    const totalNetWorth = summary.totalNetWorthUsd || 1;

    for (const h of summary.holdings) {
      if (!aggregatedBySymbol[h.symbol]) {
        aggregatedBySymbol[h.symbol] = {
          symbol: h.symbol,
          totalAmount: 0,
          currentValueUsd: 0,
          currentPriceUsd: h.currentPriceUsd,
          actualPercent: 0,
          targetPercent: h.targetPercent || 0,
          deviationPercent: 0,
          holdings: [],
        };
      }
      aggregatedBySymbol[h.symbol].totalAmount += h.amount;
      aggregatedBySymbol[h.symbol].currentValueUsd += h.currentValueUsd;
      aggregatedBySymbol[h.symbol].holdings.push(h);
    }

    for (const sym of Object.keys(aggregatedBySymbol)) {
      const item = aggregatedBySymbol[sym];
      item.actualPercent = parseFloat(((item.currentValueUsd / totalNetWorth) * 100).toFixed(1));
      item.deviationPercent = parseFloat((item.actualPercent - item.targetPercent).toFixed(1));
    }
  }

  const assetList = Object.values(aggregatedBySymbol);

  // Generate Suggested Rebalance Orders
  const suggestedOrders = assetList.map((asset) => {
    const totalNetWorth = summary?.totalNetWorthUsd || 0;
    const targetValueUsd = totalNetWorth * (asset.targetPercent / 100);
    const diffUsd = asset.currentValueUsd - targetValueUsd;
    const diffCoins = asset.currentPriceUsd > 0 ? Math.abs(diffUsd) / asset.currentPriceUsd : 0;

    let action: 'SELL' | 'BUY' | 'HOLD' = 'HOLD';
    if (diffUsd > 100 && Math.abs(asset.deviationPercent) >= 2.0) {
      action = 'SELL';
    } else if (diffUsd < -100 && Math.abs(asset.deviationPercent) >= 2.0) {
      action = 'BUY';
    }

    return {
      symbol: asset.symbol,
      action,
      diffUsd: Math.abs(diffUsd),
      diffCoins,
      currentPriceUsd: asset.currentPriceUsd,
      deviationPercent: asset.deviationPercent,
    };
  });

  const maxDeviation = assetList.reduce((max, a) => Math.max(max, Math.abs(a.deviationPercent)), 0);
  const totalDriftUsd = suggestedOrders
    .filter((o) => o.action !== 'HOLD')
    .reduce((sum, o) => sum + o.diffUsd, 0);

  // Save Target Percentages
  const handleSaveTargets = async () => {
    try {
      setIsSavingTargets(true);
      for (const [id, targetPercent] of Object.entries(targets)) {
        await api.put(`/portfolio/holdings/${id}`, { targetPercent });
      }
      showToast('Target alokasi portofolio berhasil diperbarui!');
      setShowTargetModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to save targets:', err);
      showToast('Gagal menyimpan target alokasi');
    } finally {
      setIsSavingTargets(false);
    }
  };

  const handleMarkRebalancedToday = () => {
    setDaysRemaining(cycleDays);
    showToast('Siklus rebalance berhasil di-reset ke 60 hari penuh!');
  };

  const totalTargetSum = Object.values(targets).reduce((sum, val) => sum + (Number(val) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingBottom: 'var(--space-8)' }}>
      {/* Toast Notification */}
      {notification && (
        <div className="terminal-toast toast-enter">
          <Sparkles size={15} color="var(--color-accent-primary)" />
          <span>{notification}</span>
        </div>
      )}

      {/* Target Allocation Editor Modal */}
      {showTargetModal && (
        <div
          className="modal-backdrop-animate"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9990,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            className="card-panel modal-dialog-animate"
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-accent)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.04em' }}>
                  TARGET CONFIGURATION
                </span>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: '2px 0 0' }}>
                  Atur Target Alokasi Portofolio
                </h2>
              </div>
              <button
                onClick={() => setShowTargetModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Tentukan target persentase ideal untuk setiap aset (total ideal akumulatif = 100%).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {summary?.holdings?.map((h) => (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800, color: '#fff', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                      {h.symbol}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>
                      {h.exchange}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={targets[h.id] ?? 0}
                      onChange={(e) => setTargets({ ...targets, [h.id]: parseFloat(e.target.value) || 0 })}
                      className="form-input mono"
                      style={{ width: '64px', height: '30px', textAlign: 'right', fontSize: '12px', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>%</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 2px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700 }}>TOTAL TARGET:</span>
              <span
                className="mono"
                style={{
                  fontSize: '13px',
                  fontWeight: 900,
                  color: totalTargetSum === 100 ? 'var(--color-bullish)' : 'var(--color-amber)',
                }}
              >
                {totalTargetSum}% {totalTargetSum === 100 ? '✓ (100% Ideal)' : `(${100 - totalTargetSum}% selisih)`}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowTargetModal(false)} style={{ height: '34px', fontSize: '12px' }}>
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveTargets}
                disabled={isSavingTargets}
                style={{ height: '34px', fontSize: '12px', fontWeight: 800 }}
              >
                {isSavingTargets ? 'Menyimpan...' : 'Simpan Target'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header (Aligned with Terminal Workstation Standard) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.06em' }}>
              PORTFOLIO REBALANCING MATRIX
            </span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              DISCIPLINED RISK TOLERANCE DRIFT
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: '2px 0 0' }}>
            Rebalancing Matrix & Asset Drift
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
            Siklus rebalance periodik, audit deviasi bobot aktual terhadap target alokasi, dan rekomendasi order otomatis.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/portfolio')}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
          >
            <Wallet size={13} />
            <span>Lihat Portfolio</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleMarkRebalancedToday}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
          >
            <CheckCircle2 size={13} color="var(--color-bullish)" />
            <span>Reset Siklus 60 Hari</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowTargetModal(true)}
            style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}
          >
            <SlidersHorizontal size={14} />
            <span>Atur Target Alokasi</span>
          </button>
        </div>
      </div>

      {/* Top Rebalancing Cycle Ribbon (Pure Cardless Sheet) */}
      <div
        className="cardless-sheet"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
        }}
      >
        {/* Cycle Days Cell */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              SIKLUS REBALANCE PERIODIK
            </span>
            <Calendar size={13} color="var(--color-accent-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span className="value-number" style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
              {daysRemaining} Hari
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              tersisa dari {cycleDays} hari
            </span>
          </div>
          <div style={{ width: '100%', height: '3px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
            <div
              style={{
                width: `${((cycleDays - daysRemaining) / cycleDays) * 100}%`,
                height: '100%',
                backgroundColor: 'var(--color-accent-primary)',
              }}
            />
          </div>
        </div>

        {/* Max Allocation Deviation Cell */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              MAX ALLOCATION DEVIATION
            </span>
            {maxDeviation >= 3.0 ? (
              <span className="bearish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                ACTION NEEDED
              </span>
            ) : (
              <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                IN RANGE
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span
              className="value-number"
              style={{
                fontSize: '24px',
                fontWeight: 900,
                color: maxDeviation >= 3.0 ? 'var(--color-amber)' : 'var(--color-bullish)',
              }}
            >
              ±{maxDeviation.toFixed(1)}%
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Ambang batas ±2.5%
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {maxDeviation >= 3.0 ? 'Penyimpangan bobot melebihi batas toleransi' : 'Bobot portofolio masih dalam batas aman'}
          </span>
        </div>

        {/* Total Rebalance Drift Volume Cell */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              TOTAL REBALANCE DRIFT
            </span>
            <ArrowRightLeft size={13} color="var(--color-cyan)" />
          </div>
          <div style={{ marginTop: '2px' }}>
            <DualCurrencyValue
              usd={totalDriftUsd}
              size="lg"
              sentiment={totalDriftUsd > 0 ? 'neutral' : 'bullish'}
            />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Estimasi volume penyesuaian aset spot
          </span>
        </div>

        {/* Portfolio Valuation Cell */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              BASIS NET WORTH PORTOFOLIO
            </span>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              MULTI-EXCHANGE
            </span>
          </div>
          <div style={{ marginTop: '2px' }}>
            <DualCurrencyValue
              usd={summary?.totalNetWorthUsd || 138817.5}
              idr={summary?.totalNetWorthIdr || 2255784375}
              size="lg"
            />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            1 USD = Rp {(summary?.usdToIdrRate || usdToIdrRate).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Rebalancing Matrix (Pure Cardless Table Sheet) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
              MATRIKS REBALANCING & DRIFT AUDIT
            </span>
            <span className="neutral-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              {assetList.length} ASET AUDIT
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
            Rebalancing teratur membatasi drawdown & mengunci profit secara mekanis
          </span>
        </div>

        <div className="cardless-sheet" style={{ padding: 0, overflowX: 'auto', background: 'transparent' }}>
          <table className="cardless-table" style={{ fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>ASET</th>
                <th style={{ textAlign: 'right' }}>HARGA SAAT INI</th>
                <th style={{ textAlign: 'right' }}>TOTAL NILAI AKTUAL</th>
                <th style={{ textAlign: 'right' }}>ALOKASI AKTUAL VS TARGET</th>
                <th style={{ textAlign: 'right' }}>DEVIASI (DRIFT)</th>
                <th style={{ textAlign: 'left' }}>REKOMENDASI AKSI EKSEKUSI</th>
                <th style={{ textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {assetList.map((asset) => {
                const order = suggestedOrders.find((o) => o.symbol === asset.symbol);
                const isOver = asset.deviationPercent > 0;
                const isSig = Math.abs(asset.deviationPercent) >= 2.5;

                return (
                  <tr key={asset.symbol}>
                    <td style={{ fontWeight: 800 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--color-accent-primary)', fontSize: '14px' }}>✦</span>
                        <span style={{ color: '#fff', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{asset.symbol}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }} className="value-number">
                      ${asset.currentPriceUsd.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <DualCurrencyValue usd={asset.currentValueUsd} layout="row" size="sm" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span className="value-number" style={{ fontWeight: 800, color: '#fff' }}>
                            {asset.actualPercent}%
                          </span>
                          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                            / Target {asset.targetPercent}%
                          </span>
                        </div>
                        <div style={{ width: '80px', height: '3px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, asset.actualPercent)}%`,
                              height: '100%',
                              backgroundColor: isSig ? (isOver ? 'var(--color-amber)' : 'var(--color-cyan)') : 'var(--color-bullish)',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 900,
                          fontSize: '12px',
                          color: isSig
                            ? isOver
                              ? 'var(--color-amber)'
                              : 'var(--color-cyan)'
                            : 'var(--color-text-secondary)',
                        }}
                      >
                        {asset.deviationPercent > 0 ? '+' : ''}{asset.deviationPercent}%
                      </span>
                    </td>
                    <td>
                      {order && order.action === 'SELL' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span className="bearish-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>
                            JUAL (TRIM)
                          </span>
                          <span className="mono" style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>
                            ${order.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({order.diffCoins.toFixed(3)} {asset.symbol})
                          </span>
                        </div>
                      )}
                      {order && order.action === 'BUY' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span className="bullish-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>
                            BELI (ADD)
                          </span>
                          <span className="mono" style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>
                            ${order.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({order.diffCoins.toFixed(3)} {asset.symbol})
                          </span>
                        </div>
                      )}
                      {order && order.action === 'HOLD' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span className="neutral-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>
                            TAHANKAN (HOLD)
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            Dalam rentang target aman
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => navigate('/calculator', {
                          state: {
                            ticker: `${asset.symbol}USDT`,
                            direction: order?.action === 'SELL' ? 'SHORT' : 'LONG',
                            entryPrice: asset.currentPriceUsd,
                          },
                        })}
                        className="btn btn-secondary"
                        style={{ height: '28px', fontSize: '10px', padding: '0 8px' }}
                        title="Bawa parameter ke Position Sizer"
                      >
                        <Calculator size={12} />
                        <span>Hitung Lot</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
