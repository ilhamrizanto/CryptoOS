import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  X,
  ArrowRightLeft,
  Building2,
  Coins,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettingsStore } from '../store/settings.store';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';
import { InteractiveDonutChart, DonutSegment } from '../components/portfolio/InteractiveDonutChart';
import { TokenIcon } from '../components/common/TokenIcon';
import { ExchangeIcon } from '../components/common/ExchangeIcon';

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

interface CoinAllocation {
  symbol: string;
  totalAmount: number;
  totalUsd: number;
  totalIdr: number;
  percent: number;
  holdingsCount: number;
  exchanges: string[];
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
  byCoin?: CoinAllocation[];
}

const POPULAR_PRESETS = ['BTC', 'ETH', 'SOL', 'BNB', 'USDT', 'TAO', 'INJ'];

export const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const { usdToIdrRate } = useSettingsStore();

  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [notification, setNotification] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchangeFilter, setSelectedExchangeFilter] = useState<string>('ALL');
  const [hideSmallAssets, setHideSmallAssets] = useState(true);
  const SMALL_ASSET_THRESHOLD = 5.0; // $5 USD threshold

  // Modal State for Add / Edit Holding
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSymbol, setFormSymbol] = useState('SOL');
  const [formAmount, setFormAmount] = useState<number>(10);
  const [formBuyPrice, setFormBuyPrice] = useState<number>(180);
  const [formTargetPercent, setFormTargetPercent] = useState<number>(15);
  const [formExchange, setFormExchange] = useState<'BINANCE' | 'BYBIT' | 'OKX' | 'MANUAL' | 'WALLET'>('BINANCE');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Holding Confirmation
  const [holdingToDelete, setHoldingToDelete] = useState<Holding | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Realtime Live Price Tracker for asset entry
  const [liveAssetPrice, setLiveAssetPrice] = useState<number | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

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

  // Fetch live price whenever modal is open and formSymbol changes
  useEffect(() => {
    if (!showModal || !formSymbol.trim()) {
      setLiveAssetPrice(null);
      return;
    }
    let cancelled = false;
    const fetchLivePrice = async () => {
      try {
        setIsFetchingPrice(true);
        const res = await api.get<{ symbol: string; priceUsd: number; isLive: boolean }>(
          `/portfolio/price/${formSymbol.trim().toUpperCase()}`
        );
        if (!cancelled && res?.priceUsd) {
          setLiveAssetPrice(res.priceUsd);
          if (formBuyPrice === 0) {
            setFormBuyPrice(res.priceUsd);
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (!cancelled) setIsFetchingPrice(false);
      }
    };

    const timer = setTimeout(fetchLivePrice, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showModal, formSymbol]);

  const handleOpenAddModal = (presetSymbol?: string) => {
    setEditingId(null);
    setFormSymbol(presetSymbol || 'SOL');
    setFormAmount(10);
    setFormBuyPrice(180);
    setFormTargetPercent(10);
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
        showToast(`Asset ${formSymbol} updated successfully!`);
      } else {
        await api.post('/portfolio/holdings', payload);
        showToast(`Asset ${formSymbol} added to portfolio!`);
      }

      setShowModal(false);
      await loadPortfolio();
    } catch (err) {
      console.error('Failed to save holding:', err);
      showToast('Failed to save portfolio asset');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!holdingToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/portfolio/holdings/${holdingToDelete.id}`);
      showToast(`Asset ${holdingToDelete.symbol} removed from portfolio`);
      setHoldingToDelete(null);
      await loadPortfolio();
    } catch (err) {
      console.error('Failed to delete holding:', err);
      showToast('Failed to delete asset');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSyncExchanges = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      const credentials = {
        binance: {
          apiKey: localStorage.getItem('cryptoos_binance_key') || undefined,
          apiSecret: localStorage.getItem('cryptoos_binance_secret') || undefined,
        },
        bybit: {
          apiKey: localStorage.getItem('cryptoos_bybit_key') || undefined,
          apiSecret: localStorage.getItem('cryptoos_bybit_secret') || undefined,
        },
        okx: {
          apiKey: localStorage.getItem('cryptoos_okx_key') || undefined,
          apiSecret: localStorage.getItem('cryptoos_okx_secret') || undefined,
          passphrase: localStorage.getItem('cryptoos_okx_pass') || undefined,
        },
      };

      await api.post('/portfolio/sync', { exchange: 'ALL', credentials });
      await loadPortfolio();
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast('Multi-Exchange sync successful • Live balances updated!');
    } catch (err) {
      console.error('Failed to sync exchanges:', err);
      showToast('Failed to sync exchanges');
    } finally {
      setIsSyncing(false);
    }
  };

  // Distinct Non-Colliding Storage Location Palette
  const EXCHANGE_COLORS: Record<string, string> = {
    WALLET: '#00C7BE', // Apple Cyan/Teal (Cold Storage Vault)
    BINANCE: '#F0B90B', // Pure Binance Yellow-Gold
    OKX: '#007AFF', // Pure Apple Electric Blue
    BYBIT: '#FF5722', // Vivid Coral Red-Orange
    MANUAL: '#8E8E93', // Slate Pewter
  };

  const exchangeSegments: DonutSegment[] = (summary?.byExchange || []).map((ex) => ({
    id: ex.exchange,
    label: ex.exchange === 'WALLET' ? 'Cold Storage' : ex.exchange,
    subLabel: `${ex.count} assets tracked`,
    valueUsd: ex.totalUsd,
    valueIdr: ex.totalIdr,
    percent: ex.percent,
    color: EXCHANGE_COLORS[ex.exchange] || '#94a3b8',
    count: ex.count,
  }));

  // Distinct Token Palette
  const TOKEN_COLORS: Record<string, string> = {
    BTC: '#FF9500',
    ETH: '#5E5CE6',
    USDT: '#30D158',
    SOL: '#AF52DE',
    SUI: '#38BDF8',
    DOGE: '#D97706',
    XRP: '#E2E8F0',
    ADA: '#1E40AF',
    AVAX: '#FF3B30',
    LINK: '#0284C7',
    NEAR: '#059669',
    PEPE: '#84CC16',
    BNB: '#EAB308',
  };
  const FALLBACK_PALETTE = ['#007AFF', '#30D158', '#FF9500', '#AF52DE', '#FF3B30', '#00C7BE', '#F0B90B'];

  // Group coins for Donut display
  const coinsToDisplay = summary?.byCoin && summary.byCoin.length > 0
    ? summary.byCoin
    : (() => {
        const map: Record<string, { symbol: string; totalAmount: number; totalUsd: number; totalIdr: number; percent: number; exchanges: string[] }> = {};
        for (const h of summary?.holdings || []) {
          const sym = h.symbol.toUpperCase();
          if (!map[sym]) {
            map[sym] = { symbol: sym, totalAmount: 0, totalUsd: 0, totalIdr: 0, percent: 0, exchanges: [] };
          }
          map[sym].totalAmount += h.amount;
          map[sym].totalUsd += h.currentValueUsd;
          map[sym].totalIdr += h.currentValueIdr;
          map[sym].percent += h.allocationPercent;
          if (!map[sym].exchanges.includes(h.exchange)) map[sym].exchanges.push(h.exchange);
        }
        return Object.values(map).sort((a, b) => b.totalUsd - a.totalUsd);
      })();

  const filteredCoinsForDonut = hideSmallAssets
    ? coinsToDisplay.filter((c) => c.totalUsd >= SMALL_ASSET_THRESHOLD)
    : coinsToDisplay;

  const tokenSegments: DonutSegment[] = filteredCoinsForDonut.map((coin, idx) => {
    const exchangeLabels = coin.exchanges && coin.exchanges.length > 0
      ? coin.exchanges.map((e) => (e === 'WALLET' ? 'Cold' : e)).join(', ')
      : '';
    const formattedAmount = coin.totalAmount >= 1000 
      ? coin.totalAmount.toLocaleString() 
      : coin.totalAmount % 1 === 0 
        ? coin.totalAmount.toString() 
        : coin.totalAmount.toFixed(coin.totalAmount < 1 ? 4 : 2);

    return {
      id: coin.symbol,
      label: coin.symbol,
      subLabel: `${formattedAmount} ${coin.symbol}${exchangeLabels ? ` • ${exchangeLabels}` : ''}`,
      valueUsd: coin.totalUsd,
      valueIdr: coin.totalIdr,
      percent: coin.percent,
      color: TOKEN_COLORS[coin.symbol] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length],
    };
  });

  // Filter Holdings for the Table
  const rawHoldings = summary?.holdings || [];

  const exchangeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rawHoldings.length };
    rawHoldings.forEach((h) => {
      counts[h.exchange] = (counts[h.exchange] || 0) + 1;
    });
    return counts;
  }, [rawHoldings]);

  const displayedHoldings = useMemo(() => {
    return rawHoldings.filter((h) => {
      // Dust filter
      if (hideSmallAssets && (h.currentValueUsd || 0) < SMALL_ASSET_THRESHOLD) {
        return false;
      }
      // Exchange filter
      if (selectedExchangeFilter !== 'ALL' && h.exchange !== selectedExchangeFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toUpperCase();
        return h.symbol.toUpperCase().includes(q) || h.exchange.toUpperCase().includes(q);
      }
      return true;
    });
  }, [rawHoldings, hideSmallAssets, selectedExchangeFilter, searchQuery]);

  const hiddenDustCount = useMemo(() => {
    return rawHoldings.filter((h) => (h.currentValueUsd || 0) < SMALL_ASSET_THRESHOLD).length;
  }, [rawHoldings]);

  // Modal Live Calculations
  const modalLiveValueUsd = (formAmount || 0) * (liveAssetPrice || formBuyPrice || 0);
  const modalCostBasisUsd = (formAmount || 0) * (formBuyPrice || 0);
  const modalProjectedPnlUsd = modalLiveValueUsd - modalCostBasisUsd;
  const modalProjectedPnlPercent = modalCostBasisUsd > 0 ? (modalProjectedPnlUsd / modalCostBasisUsd) * 100 : 0;

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

      {/* Delete Holding Confirmation Modal */}
      {holdingToDelete && (
        <div
          className="modal-backdrop-animate"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !isDeleting && setHoldingToDelete(null)}
        >
          <div
            className="modal-dialog-animate"
            style={{
              width: '100%',
              maxWidth: '430px',
              backgroundColor: '#0a0a0c',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)',
              overflow: 'hidden',
              padding: '22px 24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-bearish)',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                  Remove Asset Confirmation
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Asset will be removed from your consolidated portfolio net worth.
                </p>
              </div>
            </div>

            {/* Asset preview chip */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TokenIcon symbol={holdingToDelete.symbol} size={28} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                    {holdingToDelete.amount.toLocaleString()} {holdingToDelete.symbol}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    Storage: <span style={{ color: 'var(--color-accent-primary)' }}>{holdingToDelete.exchange}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }} className="mono">
                  ${holdingToDelete.currentValueUsd.toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }} className="mono">
                  Rp {holdingToDelete.currentValueIdr.toLocaleString()}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to delete <strong style={{ color: '#fff' }}>{holdingToDelete.symbol}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setHoldingToDelete(null)}
                disabled={isDeleting}
                style={{ padding: '0 16px', height: '36px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-asset"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  height: '36px',
                  padding: '0 18px',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  backgroundColor: 'var(--color-bearish)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={13} />
                <span>{isDeleting ? 'Deleting...' : 'Delete Asset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Holding Modal (OLED Standard) */}
      {showModal && (
        <div
          className="modal-backdrop-animate"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 9990,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
          onClick={() => !isSaving && setShowModal(false)}
        >
          <div
            className="modal-dialog-animate"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0a0a0c',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95)',
              overflow: 'hidden',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(212, 175, 55, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-accent-primary)',
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.04em' }}>
                    SPOT ASSET RECONCILIATION
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF', margin: '2px 0 0' }}>
                    {editingId ? `Edit Asset: ${formSymbol}` : 'Add Spot Asset to Portfolio'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Popular Presets */}
            {!editingId && (
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  POPULAR CRYPTO PRESETS
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {POPULAR_PRESETS.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setFormSymbol(sym)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-xs)',
                        border: formSymbol === sym ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: formSymbol === sym ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        color: formSymbol === sym ? 'var(--color-accent-primary)' : '#fff',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <TokenIcon symbol={sym} size={14} />
                      <span>{sym}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  ASSET SYMBOL / TICKER
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0 8px',
                    height: '36px',
                  }}
                >
                  <div style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                    <TokenIcon symbol={formSymbol} size={20} />
                  </div>
                  <input
                    id="input-asset-symbol"
                    type="text"
                    value={formSymbol}
                    onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
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
                    placeholder="e.g. BTC, ETH, SOL"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  STORAGE / WALLET LOCATION
                </label>
                <select
                  id="select-asset-exchange"
                  value={formExchange}
                  onChange={(e) => setFormExchange(e.target.value as any)}
                  className="form-input"
                  style={{ height: '36px', fontSize: '12px', backgroundColor: '#111' }}
                >
                  <option value="BINANCE">Binance Spot</option>
                  <option value="BYBIT">Bybit Spot / UTA</option>
                  <option value="OKX">OKX Trading</option>
                  <option value="WALLET">Ledger / Cold Storage</option>
                  <option value="MANUAL">Manual Spot Wallet</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  HOLDINGS QUANTITY (AMOUNT)
                </label>
                <input
                  id="input-asset-amount"
                  type="number"
                  step="any"
                  value={formAmount}
                  onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                  className="form-input mono"
                  style={{ height: '36px', fontSize: '13px', fontWeight: 800, backgroundColor: 'rgba(255,255,255,0.03)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-accent-primary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  AVERAGE BUY PRICE / COST BASIS ($)
                </label>
                <input
                  id="input-asset-buy-price"
                  type="number"
                  step="any"
                  value={formBuyPrice}
                  onChange={(e) => setFormBuyPrice(parseFloat(e.target.value) || 0)}
                  className="form-input mono"
                  style={{ height: '36px', fontSize: '13px', fontWeight: 800, backgroundColor: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            {/* Target Percent */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                TARGET PORTFOLIO ALLOCATION (%)
              </label>
              <input
                id="input-asset-target"
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={formTargetPercent}
                onChange={(e) => setFormTargetPercent(parseFloat(e.target.value) || 0)}
                className="form-input mono"
                style={{ height: '36px', fontSize: '13px', fontWeight: 800, backgroundColor: 'rgba(255,255,255,0.03)' }}
              />
            </div>

            {/* Live Valuation Box */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              <div>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>
                  LIVE MARKET PRICE
                </span>
                <span className="mono" style={{ fontSize: '12px', fontWeight: 900, color: 'var(--color-cyan)', marginTop: '2px', display: 'block' }}>
                  {isFetchingPrice ? 'Fetching...' : liveAssetPrice ? `$${liveAssetPrice.toLocaleString()}` : '$—'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>
                  ESTIMATED VALUE
                </span>
                <span className="mono" style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff', marginTop: '2px', display: 'block' }}>
                  ${modalLiveValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>
                  PROJECTED P&L
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: modalCostBasisUsd === 0 ? 'var(--color-text-muted)' : modalProjectedPnlUsd >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)',
                    marginTop: '2px',
                    display: 'block',
                  }}
                >
                  {modalCostBasisUsd === 0
                    ? '—'
                    : `${modalProjectedPnlUsd >= 0 ? '+' : ''}$${modalProjectedPnlUsd.toFixed(2)} (${modalProjectedPnlPercent >= 0 ? '+' : ''}${modalProjectedPnlPercent.toFixed(1)}%)`}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                style={{ height: '36px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                id="btn-save-asset"
                type="button"
                className="btn btn-primary"
                onClick={handleSaveHolding}
                disabled={isSaving}
                style={{ height: '36px', fontSize: '12px', fontWeight: 800, padding: '0 20px' }}
              >
                {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add to Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header (Cardless Terminal Standard) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.06em' }}>
              SPOT ALLOCATION & TREASURY
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              MULTI-EXCHANGE AGGREGATOR
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>&bull;</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-bullish)' }} />
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Synced: {lastSyncTime}</span>
            </div>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: '3px 0 0' }}>
            Portfolio Tracker & Net Worth
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
            Cross-exchange spot balance consolidation (Binance, Bybit, OKX, Ledger Cold Storage) with interactive allocation visualization.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            id="btn-sync-exchanges"
            className="btn btn-secondary"
            onClick={handleSyncExchanges}
            disabled={isSyncing}
            style={{
              height: '34px',
              fontSize: '12px',
              padding: '0 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
            <span>{isSyncing ? 'Syncing Balances...' : 'Sync Exchanges'}</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/rebalancing')}
            style={{
              height: '34px',
              fontSize: '12px',
              padding: '0 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <ArrowRightLeft size={13} />
            <span>Rebalancing Matrix</span>
          </button>
          <button
            id="btn-add-asset"
            className="btn btn-primary"
            onClick={() => handleOpenAddModal()}
            style={{ height: '34px', fontSize: '12px', padding: '0 14px', fontWeight: 800 }}
          >
            <Plus size={14} />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Top Performance Cockpit (Cardless Hairline Strip) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          borderLeft: 'none',
          borderRight: 'none',
          backgroundColor: '#000000',
        }}
      >
        {/* Pane 1: Total Portfolio Net Worth Overview */}
        <div
          style={{
            padding: '16px 20px',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            minHeight: '210px',
            backgroundColor: '#000000',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
                TOTAL PORTFOLIO NET WORTH
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--color-bullish)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                1 USD = Rp {(summary?.usdToIdrRate || usdToIdrRate).toLocaleString()}
              </span>
            </div>
            <div style={{ marginTop: '6px' }}>
              <DualCurrencyValue
                usd={summary?.totalNetWorthUsd || 0}
                idr={summary?.totalNetWorthIdr || 0}
                size="lg"
                sentiment="bullish"
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div>
              <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>ALL-TIME P&L</div>
              <div
                className={(summary?.totalPnlUsd || 0) >= 0 ? 'bullish-text mono' : 'bearish-text mono'}
                style={{ fontSize: '13px', fontWeight: 900, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {(summary?.totalPnlUsd || 0) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>{(summary?.totalPnlUsd || 0) >= 0 ? '+' : ''}{(summary?.totalPnlPercent || 0).toFixed(2)}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>TOTAL COST BASIS</div>
              <div className="mono" style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                ${(summary?.totalCostBasisUsd || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--color-text-muted)' }}>
            <span>{summary?.holdings?.length || 0} Spot Assets Tracked</span>
            <span>{summary?.byExchange?.length || 0} Storage Vaults</span>
          </div>
        </div>

        {/* Pane 2: Wallet Allocation */}
        <div
          style={{
            padding: '16px 20px',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '210px',
            backgroundColor: '#000000',
          }}
        >
          <InteractiveDonutChart
            title="Wallet Allocation"
            badgeText={`${exchangeSegments.length} WALLETS`}
            badgeType="cyan"
            items={exchangeSegments}
            emptyMessage="No exchange data available"
            icon={<Building2 size={13} color="var(--color-cyan)" />}
            layout="horizontal"
            unitLabel="WALLETS"
            isPane
          />
        </div>

        {/* Pane 3: Asset Allocation */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '210px',
            backgroundColor: '#000000',
          }}
        >
          <InteractiveDonutChart
            title="Asset Allocation"
            badgeText={`${tokenSegments.length} ASSETS`}
            badgeType="gold"
            items={tokenSegments}
            emptyMessage="No coin assets found"
            icon={<Coins size={13} color="var(--color-accent-primary)" />}
            layout="horizontal"
            unitLabel="ASSETS"
            isPane
            showTokenIcons
          />
        </div>
      </div>

      {/* Institutional Control & Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '6px 0',
        }}
      >
        {/* Segmented Exchange Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'ALL ASSETS' },
            { id: 'BINANCE', label: 'BINANCE' },
            { id: 'BYBIT', label: 'BYBIT' },
            { id: 'OKX', label: 'OKX' },
            { id: 'WALLET', label: 'COLD STORAGE' },
            { id: 'MANUAL', label: 'MANUAL' },
          ].map((tab) => {
            const count = exchangeCounts[tab.id] || 0;
            if (tab.id !== 'ALL' && count === 0) return null;
            const isActive = selectedExchangeFilter === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-exchange-${tab.id.toLowerCase()}`}
                type="button"
                onClick={() => setSelectedExchangeFilter(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: isActive ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isActive ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.id !== 'ALL' && <ExchangeIcon exchange={tab.id} size={14} showBadgeBackground={false} />}
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '9.5px',
                    padding: '0 5px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'var(--color-accent-primary)' : 'rgba(255, 255, 255, 0.1)',
                    color: isActive ? '#000' : '#fff',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Search & Dust Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Dust Filter Pill */}
          <button
            id="btn-toggle-dust"
            type="button"
            onClick={() => setHideSmallAssets(!hideSmallAssets)}
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--radius-xs)',
              border: hideSmallAssets ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: hideSmallAssets ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
              color: hideSmallAssets ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: hideSmallAssets ? 'var(--color-accent-primary)' : 'rgba(255, 255, 255, 0.3)',
              }}
            />
            <span>Hide Dust (&lt; $5)</span>
            {hiddenDustCount > 0 && hideSmallAssets && (
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(212, 175, 55, 0.2)',
                  color: 'var(--color-accent-primary)',
                  fontWeight: 800,
                }}
              >
                {hiddenDustCount}
              </span>
            )}
          </button>

          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-xs)',
              padding: '0 8px',
              height: '30px',
            }}
          >
            <Search size={13} color="var(--color-text-muted)" style={{ marginRight: '6px' }} />
            <input
              id="input-search-holdings"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker..."
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                width: '120px',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Holdings Table (Cardless Pure Black OLED Table) */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          overflowX: 'auto',
          backgroundColor: '#000000',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#000000' }}>
              <th style={{ padding: '12px 14px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>ASSET</th>
              <th style={{ padding: '12px 14px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>STORAGE VAULT</th>
              <th style={{ padding: '12px 14px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, textAlign: 'right' }}>HOLDINGS</th>
              <th style={{ padding: '12px 14px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, textAlign: 'right' }}>AVG BUY / BASIS</th>
              <th style={{ padding: '12px 14px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, textAlign: 'right' }}>CURRENT PRICE</th>
              <th style={{ padding: '12px 14px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, textAlign: 'right' }}>TOTAL VALUE (USD / IDR)</th>
              <th style={{ padding: '12px 14px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, textAlign: 'right' }}>ALLOCATION</th>
              <th style={{ padding: '12px 14px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, textAlign: 'right' }}>ALL-TIME P&L</th>
              <th style={{ padding: '12px 14px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {displayedHoldings.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px 14px', color: 'var(--color-text-muted)' }}>
                  {hiddenDustCount > 0 && hideSmallAssets
                    ? `All small dust balances (< $5.00) hidden. Click "Hide Dust" above to reveal all ${rawHoldings.length} assets.`
                    : 'No spot holdings found matching the filter criteria.'}
                </td>
              </tr>
            ) : (
              displayedHoldings.map((h) => {
                const isBasisTracked = (h.averageBuyPrice || 0) > 0;
                const hasTarget = (h.targetPercent || 0) > 0;
                const allocationDiff = hasTarget ? h.allocationPercent - (h.targetPercent || 0) : 0;

                const exchangeBadgeBg =
                  h.exchange === 'BINANCE'
                    ? 'rgba(240, 185, 11, 0.12)'
                    : h.exchange === 'BYBIT'
                    ? 'rgba(255, 87, 34, 0.12)'
                    : h.exchange === 'OKX'
                    ? 'rgba(0, 122, 255, 0.12)'
                    : h.exchange === 'WALLET'
                    ? 'rgba(0, 199, 190, 0.12)'
                    : 'rgba(255, 255, 255, 0.08)';

                const exchangeBadgeColor =
                  h.exchange === 'BINANCE'
                    ? '#F0B90B'
                    : h.exchange === 'BYBIT'
                    ? '#FF5722'
                    : h.exchange === 'OKX'
                    ? '#007AFF'
                    : h.exchange === 'WALLET'
                    ? '#00C7BE'
                    : '#8E8E93';

                return (
                  <tr
                    key={h.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Symbol & TokenIcon */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <TokenIcon symbol={h.symbol} size={22} />
                        <div>
                          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 800 }} className="mono">
                            {h.symbol}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Storage / Exchange */}
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '3px',
                          backgroundColor: exchangeBadgeBg,
                          color: exchangeBadgeColor,
                          border: `1px solid ${exchangeBadgeColor}30`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ExchangeIcon exchange={h.exchange} size={14} showBadgeBackground={false} />
                        <span>{h.exchange === 'WALLET' ? 'COLD STORAGE' : h.exchange}</span>
                      </span>
                    </td>

                    {/* Holdings Amount */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }} className="mono">
                      <span style={{ color: '#fff', fontWeight: 700 }}>{h.amount.toLocaleString()}</span>{' '}
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{h.symbol}</span>
                    </td>

                    {/* Average Buy / Cost Basis */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {isBasisTracked ? (
                        <span className="mono" style={{ color: '#fff', fontWeight: 700 }}>
                          ${(h.averageBuyPrice || 0).toLocaleString()}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(h)}
                          title="Click to set average buy price for P&L tracking"
                          style={{
                            background: 'none',
                            border: '1px dashed rgba(255, 255, 255, 0.15)',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            color: 'var(--color-text-muted)',
                            fontSize: '10px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Edit2 size={10} />
                          <span>— Set Basis</span>
                        </button>
                      )}
                    </td>

                    {/* Current Price */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }} className="mono">
                      <span style={{ color: '#fff', fontWeight: 800 }}>${h.currentPriceUsd.toLocaleString()}</span>
                    </td>

                    {/* Total Value (USD / IDR) */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <DualCurrencyValue usd={h.currentValueUsd} idr={h.currentValueIdr} layout="row" size="sm" />
                    </td>

                    {/* Allocation & Target */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span className="mono" style={{ fontWeight: 800, color: '#fff', fontSize: '12px' }}>
                            {h.allocationPercent}%
                          </span>
                          {hasTarget ? (
                            <span
                              style={{
                                fontSize: '9px',
                                color: Math.abs(allocationDiff) > 5 ? 'var(--color-amber)' : 'var(--color-text-muted)',
                              }}
                            >
                              ({allocationDiff > 0 ? '+' : ''}{allocationDiff.toFixed(1)}% drift)
                            </span>
                          ) : (
                            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>/ untargeted</span>
                          )}
                        </div>
                        {/* Mini Track */}
                        <div style={{ width: '64px', height: '3px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, h.allocationPercent)}%`,
                              height: '100%',
                              backgroundColor:
                                hasTarget && allocationDiff > 3
                                  ? 'var(--color-amber)'
                                  : 'var(--color-bullish)',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* All-Time PnL */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {isBasisTracked ? (
                        <div>
                          <div
                            className="mono"
                            style={{
                              fontWeight: 900,
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
                            {h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>—</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          id={`btn-edit-${h.symbol.toLowerCase()}`}
                          onClick={() => handleOpenEditModal(h)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 'var(--radius-xs)',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            padding: '4px 6px',
                          }}
                          title="Edit Asset"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          id={`btn-delete-${h.symbol.toLowerCase()}`}
                          onClick={() => setHoldingToDelete(h)}
                          style={{
                            background: 'rgba(244, 63, 94, 0.06)',
                            border: '1px solid rgba(244, 63, 94, 0.15)',
                            borderRadius: 'var(--radius-xs)',
                            color: 'var(--color-bearish)',
                            cursor: 'pointer',
                            padding: '4px 6px',
                          }}
                          title="Delete Asset"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Meta Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
        <span>
          Showing {displayedHoldings.length} of {rawHoldings.length} Spot Assets across {summary?.byExchange?.length || 0} Storage Vaults
        </span>
        {hiddenDustCount > 0 && hideSmallAssets && (
          <button
            onClick={() => setHideSmallAssets(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent-primary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11px',
            }}
          >
            Reveal {hiddenDustCount} small dust balances
          </button>
        )}
      </div>
    </div>
  );
};
