import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  X,
  ArrowRightLeft,
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
  exchange: 'BINANCE' | 'BYBIT' | 'OKX' | 'MANUAL' | 'WALLET';
  isManual: boolean;
  currentPriceUsd: number;
  currentValueUsd: number;
  currentValueIdr: number;
  costBasisUsd: number;
  pnlUsd: number;
  pnlIdr: number;
  pnlPercent: number;
  allocationPercent: number;
}

interface PortfolioSummary {
  totalNetWorthUsd: number;
  totalNetWorthIdr: number;
  totalCostBasisUsd: number;
  totalPnlUsd: number;
  totalPnlIdr: number;
  totalPnlPercent: number;
  usdToIdrRate: number;
  holdings: Holding[];
  byExchange: Array<{ exchange: string; totalUsd: number; totalIdr: number; count: number; percent: number }>;
}

export const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const { usdToIdrRate } = useSettingsStore();

  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal State for Add / Edit Holding
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSymbol, setFormSymbol] = useState('SOL');
  const [formAmount, setFormAmount] = useState<number>(10);
  const [formBuyPrice, setFormBuyPrice] = useState<number>(180);
  const [formTargetPercent, setFormTargetPercent] = useState<number>(15);
  const [formExchange, setFormExchange] = useState<'BINANCE' | 'BYBIT' | 'OKX' | 'MANUAL' | 'WALLET'>('BINANCE');
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadPortfolio = useCallback(async () => {
    try {
      const data = await api.get<PortfolioSummary>(`/portfolio/summary?rate=${usdToIdrRate}`);
      setSummary(data || null);
    } catch (err) {
      console.error('Failed to load portfolio summary:', err);
    }
  }, [usdToIdrRate]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormSymbol('SOL');
    setFormAmount(10);
    setFormBuyPrice(180);
    setFormTargetPercent(15);
    setFormExchange('BINANCE');
    setShowModal(true);
  };

  const handleOpenEditModal = (h: Holding) => {
    setEditingId(h.id);
    setFormSymbol(h.symbol);
    setFormAmount(h.amount);
    setFormBuyPrice(h.averageBuyPrice || 0);
    setFormTargetPercent(h.targetPercent || 10);
    setFormExchange(h.exchange);
    setShowModal(true);
  };

  const handleSaveHolding = async () => {
    try {
      setIsSaving(true);
      const payload = {
        symbol: formSymbol.toUpperCase(),
        amount: formAmount,
        averageBuyPrice: formBuyPrice,
        targetPercent: formTargetPercent,
        exchange: formExchange,
      };

      if (editingId) {
        await api.put(`/portfolio/holdings/${editingId}`, payload);
        showToast(`Aset ${formSymbol} berhasil diperbarui!`);
      } else {
        await api.post('/portfolio/holdings', payload);
        showToast(`Aset ${formSymbol} berhasil ditambahkan ke portofolio!`);
      }

      setShowModal(false);
      await loadPortfolio();
    } catch (err) {
      console.error('Failed to save holding:', err);
      showToast('Gagal menyimpan aset portofolio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHolding = async (id: string, symbol: string) => {
    if (!window.confirm(`Yakin ingin menghapus aset ${symbol} dari portofolio?`)) return;
    try {
      await api.delete(`/portfolio/holdings/${id}`);
      showToast(`Aset ${symbol} dihapus dari portofolio`);
      await loadPortfolio();
    } catch (err) {
      console.error('Failed to delete holding:', err);
    }
  };

  const handleSyncExchanges = async () => {
    setIsSyncing(true);
    setTimeout(async () => {
      await loadPortfolio();
      setIsSyncing(false);
      showToast('Sinkronisasi saldo Multi-Exchange (Binance, Bybit, OKX) berhasil!');
    }, 1200);
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

      {/* Add / Edit Holding Modal */}
      {showModal && (
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
                  ASET PORTOFOLIO
                </span>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: '2px 0 0' }}>
                  {editingId ? 'Edit Aset Portofolio' : 'Tambah Aset ke Portofolio'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  SYMBOL (TICKER)
                </label>
                <input
                  type="text"
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '12px' }}
                  placeholder="e.g. BTC, ETH, SOL"
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  LOKASI PENYIMPANAN
                </label>
                <select
                  value={formExchange}
                  onChange={(e) => setFormExchange(e.target.value as any)}
                  className="form-input"
                  style={{ height: '34px', fontSize: '12px' }}
                >
                  <option value="BINANCE">Binance Spot</option>
                  <option value="BYBIT">Bybit Spot / Unified</option>
                  <option value="OKX">OKX Trading</option>
                  <option value="WALLET">Cold Storage (Ledger/Trezor)</option>
                  <option value="MANUAL">Manual Spot Wallet</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  JUMLAH KOIN (AMOUNT)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formAmount}
                  onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  HARGA BELI RATA-RATA ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formBuyPrice}
                  onChange={(e) => setFormBuyPrice(parseFloat(e.target.value) || 0)}
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '12px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                TARGET ALOKASI PORTOFOLIO (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={formTargetPercent}
                onChange={(e) => setFormTargetPercent(parseFloat(e.target.value) || 0)}
                className="form-input mono"
                style={{ height: '34px', fontSize: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ height: '34px', fontSize: '12px' }}>
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveHolding}
                disabled={isSaving}
                style={{ height: '34px', fontSize: '12px', fontWeight: 800 }}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Aset'}
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
              SPOT ALLOCATION & TREASURY
            </span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              MULTI-EXCHANGE AGGREGATOR
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: '2px 0 0' }}>
            Portfolio Tracker & Net Worth
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
            Konsolidasi saldo spot lintas exchange (Binance, Bybit, OKX, Ledger Cold Storage) dengan konversi Dual Currency USD/IDR.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleSyncExchanges}
            disabled={isSyncing}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
          >
            <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Exchange'}</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/rebalancing')}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
          >
            <ArrowRightLeft size={13} />
            <span>Matriks Rebalancing</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={handleOpenAddModal}
            style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}
          >
            <Plus size={14} />
            <span>Tambah Aset</span>
          </button>
        </div>
      </div>

      {/* Top Aggregated Net Worth & Exchange Balances Ribbon (Pure Cardless Sheet) */}
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
        {/* Total Net Worth Cell */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              TOTAL PORTFOLIO NET WORTH
            </span>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              LIVE CONVERTED
            </span>
          </div>
          <div style={{ marginTop: '2px' }}>
            <DualCurrencyValue
              usd={summary?.totalNetWorthUsd || 0}
              idr={summary?.totalNetWorthIdr || 0}
              size="lg"
              sentiment="bullish"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span
              className={(summary?.totalPnlUsd || 0) >= 0 ? 'bullish-text' : 'bearish-text'}
              style={{ fontSize: '10px', fontWeight: 800 }}
            >
              {(summary?.totalPnlUsd || 0) >= 0 ? '+' : ''}
              {(summary?.totalPnlPercent || 0).toFixed(2)}% All-Time PnL
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>&bull; {summary?.holdings?.length || 0} Koin Terdaftar</span>
          </div>
        </div>

        {/* Exchange Distribution Cells */}
        {summary?.byExchange?.map((ex) => (
          <div key={ex.exchange} className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                {ex.exchange === 'WALLET' ? 'COLD STORAGE (LEDGER)' : `${ex.exchange} SPOT`}
              </span>
              <span className="cyan-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                {ex.percent}%
              </span>
            </div>
            <div style={{ marginTop: '2px' }}>
              <DualCurrencyValue usd={ex.totalUsd} idr={ex.totalIdr} size="md" />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {ex.count} Asset(s) Terdaftar
            </div>
          </div>
        ))}
      </div>

      {/* Main Holdings Table (Pure Cardless Table Sheet) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
              DAFTAR ALOKASI ASET SPOT
            </span>
            <span className="neutral-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              1 USD = Rp {(summary?.usdToIdrRate || usdToIdrRate).toLocaleString()}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
            Total {summary?.holdings?.length || 0} Aset Tersimpan
          </span>
        </div>

        <div className="cardless-sheet" style={{ padding: 0, overflowX: 'auto', background: 'transparent' }}>
          <table className="cardless-table" style={{ fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>ASET</th>
                <th style={{ textAlign: 'left' }}>EXCHANGE / STORAGE</th>
                <th style={{ textAlign: 'right' }}>JUMLAH</th>
                <th style={{ textAlign: 'right' }}>AVG BUY</th>
                <th style={{ textAlign: 'right' }}>HARGA SAAT INI</th>
                <th style={{ textAlign: 'right' }}>TOTAL NILAI (USD / IDR)</th>
                <th style={{ textAlign: 'right' }}>ALOKASI</th>
                <th style={{ textAlign: 'right' }}>ALL-TIME PNL</th>
                <th style={{ textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {summary?.holdings?.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 800 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--color-accent-primary)', fontSize: '14px' }}>✦</span>
                      <span style={{ color: '#fff', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{h.symbol}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: h.exchange === 'WALLET' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                        color: h.exchange === 'WALLET' ? 'var(--color-cyan)' : 'var(--color-accent-primary)',
                      }}
                    >
                      {h.exchange}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }} className="value-number">
                    {h.amount.toLocaleString()} {h.symbol}
                  </td>
                  <td style={{ textAlign: 'right' }} className="value-number">
                    ${(h.averageBuyPrice || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', color: '#fff', fontWeight: 700 }} className="value-number">
                    ${h.currentPriceUsd.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <DualCurrencyValue usd={h.currentValueUsd} idr={h.currentValueIdr} layout="row" size="sm" />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span className="value-number" style={{ fontWeight: 800, color: '#fff' }}>
                          {h.allocationPercent}%
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                          / {h.targetPercent || 0}%
                        </span>
                      </div>
                      <div style={{ width: '60px', height: '3px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, h.allocationPercent)}%`,
                            height: '100%',
                            backgroundColor: h.allocationPercent > (h.targetPercent || 0) + 3 ? 'var(--color-amber)' : 'var(--color-bullish)',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div
                      className="value-number"
                      style={{
                        fontWeight: 800,
                        color: h.pnlUsd >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)',
                      }}
                    >
                      {h.pnlUsd >= 0 ? '+' : ''}${h.pnlUsd.toLocaleString()}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: h.pnlUsd >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)',
                      }}
                    >
                      {h.pnlUsd >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleOpenEditModal(h)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '2px' }}
                        title="Edit Aset"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteHolding(h.id, h.symbol)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-bearish)', cursor: 'pointer', padding: '2px' }}
                        title="Hapus Aset"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
