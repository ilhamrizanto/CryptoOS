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
  Building2,
  Coins,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettingsStore } from '../store/settings.store';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';
import { InteractiveDonutChart, DonutSegment } from '../components/portfolio/InteractiveDonutChart';
import { TokenIcon } from '../components/common/TokenIcon';

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

  // Small Assets Dust Filter (Active by default)
  const [hideSmallAssets, setHideSmallAssets] = useState(true);
  const SMALL_ASSET_THRESHOLD = 5.0; // $5 USD threshold

  // Realtime Live Price Tracker for manual asset entry
  const [liveAssetPrice, setLiveAssetPrice] = useState<number | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

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
          // If average buy price is empty or 0, suggest current market price
          if (formBuyPrice === 0) {
            setFormBuyPrice(res.priceUsd);
          }
        }
      } catch {
        // Fallback
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

  const [holdingToDelete, setHoldingToDelete] = useState<Holding | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      showToast('Multi-Exchange sync successful • Balances updated and overwritten with latest live data!');
    } catch (err) {
      console.error('Failed to sync exchanges:', err);
      showToast('Failed to sync exchanges');
    } finally {
      setIsSyncing(false);
    }
  };

  // Distinct Non-Colliding Storage Location Palette (Apple Cyan Vault, Yellow, Blue, Red-Orange)
  const EXCHANGE_COLORS: Record<string, string> = {
    WALLET: '#00C7BE', // Apple Cyan/Teal (Hardware Vault / Cold Storage)
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

  // Distinct Non-Colliding Token Palette (Zero collision with storage or other tokens)
  const TOKEN_COLORS: Record<string, string> = {
    BTC: '#FF9500', // Bitcoin Sovereign Warm Orange (Different from Binance Yellow!)
    ETH: '#5E5CE6', // Ethereum Deep Indigo / Amethyst (Different from OKX Blue!)
    USDT: '#30D158', // Tether Apple Mint Green (Different from Cold Storage Cyan!)
    SOL: '#AF52DE', // Solana Vibrant Neon Purple / Fuchsia (Different from Bybit Red!)
    SUI: '#38BDF8', // Soft Sky Cyan
    DOGE: '#D97706', // Doge Bronze
    XRP: '#E2E8F0', // Ripple Ice Platinum
    ADA: '#1E40AF', // Deep Navy
    AVAX: '#FF3B30', // Apple Crimson Red
    LINK: '#0284C7', // Marine Blue
    NEAR: '#059669', // Emerald Spruce
    PEPE: '#84CC16', // Lime Green
    BNB: '#EAB308', // Pale Amber
  };
  const FALLBACK_PALETTE = ['#007AFF', '#30D158', '#FF9500', '#AF52DE', '#FF3B30', '#00C7BE', '#F0B90B'];

  // Group coins to strictly prevent duplicate entries (e.g. BTC on Ledger + BTC on Binance)
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

  // Filter small assets (dust < $10) if active by default
  const filteredCoins = hideSmallAssets
    ? coinsToDisplay.filter((c) => c.totalUsd >= SMALL_ASSET_THRESHOLD)
    : coinsToDisplay;

  const tokenSegments: DonutSegment[] = filteredCoins.map((coin, idx) => {
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
                  PORTFOLIO ASSET
                </span>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: '2px 0 0' }}>
                  {editingId ? 'Edit Portfolio Asset' : 'Add Asset to Portfolio'}
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
                  STORAGE / WALLET LOCATION
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
                  AMOUNT (HOLDINGS)
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
                  AVERAGE BUY PRICE ($)
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

            {/* Realtime Live Price Banner with Token Icon */}
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <TokenIcon symbol={formSymbol} size={24} />
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block' }}>
                    REAL-TIME MARKET PRICE ({formSymbol || 'TOKEN'})
                  </span>
                  <span className="mono" style={{ fontSize: '12px', fontWeight: 900, color: 'var(--color-cyan)', marginTop: '2px', display: 'block' }}>
                    {isFetchingPrice ? 'Fetching price...' : liveAssetPrice ? `$${liveAssetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : 'Live Price Active'}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block' }}>
                  ESTIMATED VALUE
                </span>
                <span className="mono" style={{ fontSize: '12px', fontWeight: 900, color: 'var(--color-accent-primary)', marginTop: '2px', display: 'block' }}>
                  ${((formAmount || 0) * (liveAssetPrice || formBuyPrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                TARGET ALLOCATION (%)
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
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveHolding}
                disabled={isSaving}
                style={{ height: '34px', fontSize: '12px', fontWeight: 800 }}
              >
                {isSaving ? 'Saving...' : 'Save Asset'}
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
            Cross-exchange spot balance consolidation (Binance, Bybit, OKX, Ledger Cold Storage) with interactive allocation visualization.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleSyncExchanges}
            disabled={isSyncing}
            style={{
              height: '34px',
              fontSize: '12px',
              padding: '0 14px',
              pointerEvents: isSyncing ? 'none' : 'auto',
              opacity: isSyncing ? 0.5 : 1,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              userSelect: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
            <span>{isSyncing ? 'Syncing Balances...' : 'Sync Exchanges'}</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/rebalancing')}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
          >
            <ArrowRightLeft size={13} />
            <span>Rebalancing Matrix</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={handleOpenAddModal}
            style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}
          >
            <Plus size={14} />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Top Section: Single Unified Cardless Sheet (Deep Solid Black #000000 - Apple OLED Look) */}
      <div
        className="cardless-sheet"
        style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderTop: '1px solid rgba(255, 255, 255, 0.16)',
          background: '#000000',
          backdropFilter: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'stretch',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65)',
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
            background: '#000000',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                TOTAL PORTFOLIO NET WORTH
              </span>
              <span className="bullish-badge" style={{ fontSize: '8.5px', padding: '1px 6px', fontWeight: 800, borderRadius: '4px' }}>
                FEED 17,943 IDR
              </span>
            </div>
            <div style={{ marginTop: '5px' }}>
              <DualCurrencyValue
                usd={summary?.totalNetWorthUsd || 0}
                idr={summary?.totalNetWorthIdr || 0}
                size="lg"
                sentiment="bullish"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div>
              <div style={{ fontSize: '8.5px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>ALL-TIME PNL</div>
              <div
                className={(summary?.totalPnlUsd || 0) >= 0 ? 'bullish-text mono' : 'bearish-text mono'}
                style={{ fontSize: '11.5px', fontWeight: 800, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px', fontVariantNumeric: 'tabular-nums' }}
              >
                {(summary?.totalPnlUsd || 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                <span>{(summary?.totalPnlUsd || 0) >= 0 ? '+' : ''}{(summary?.totalPnlPercent || 0).toFixed(2)}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '8.5px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>TOTAL COST BASIS</div>
              <div className="mono" style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                ${(summary?.totalCostBasisUsd || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: 'var(--color-text-muted)' }}>
            <span>{summary?.holdings?.length || 0} Spot Assets Tracked</span>
            <span className="mono">1 USD = Rp {(summary?.usdToIdrRate || usdToIdrRate).toLocaleString()}</span>
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
            background: '#000000',
          }}
        >
          <InteractiveDonutChart
            title="Wallet Allocation"
            badgeText={`${exchangeSegments.length} WALLETS`}
            badgeType="cyan"
            items={exchangeSegments}
            emptyMessage="No exchange data available"
            icon={<Building2 size={13} color="var(--color-cyan)" />}
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
            background: '#000000',
          }}
        >
          <InteractiveDonutChart
            title="Asset Allocation"
            badgeText={`${tokenSegments.length} ASSETS`}
            badgeType="gold"
            items={tokenSegments}
            emptyMessage="No coin assets found"
            icon={<Coins size={13} color="var(--color-accent-primary)" />}
            isPane
            showTokenIcons
          />
        </div>
      </div>

      {/* Main Holdings Table (Pure Cardless Table Sheet) */}
      {(() => {
        const rawHoldings = summary?.holdings || [];
        const displayedHoldings = rawHoldings.filter(
          (h) => !hideSmallAssets || (h.currentValueUsd || 0) >= SMALL_ASSET_THRESHOLD
        );
        const hiddenCount = rawHoldings.length - displayedHoldings.length;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                  SPOT ASSET ALLOCATION
                </span>
                <span className="neutral-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  1 USD = Rp {(summary?.usdToIdrRate || usdToIdrRate).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Dust Filter Checkbox (Active by default) */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: hideSmallAssets ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hideSmallAssets}
                    onChange={(e) => setHideSmallAssets(e.target.checked)}
                    style={{ accentColor: 'var(--color-accent-primary)', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 700 }}>Hide Small Balances (&lt; $5)</span>
                  {hiddenCount > 0 && hideSmallAssets && (
                    <span className="neutral-badge" style={{ fontSize: '8.5px', padding: '1px 5px' }}>
                      {hiddenCount} Hidden
                    </span>
                  )}
                </label>

                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  Showing {displayedHoldings.length} of {rawHoldings.length} Assets
                </span>
              </div>
            </div>

            <div className="cardless-sheet" style={{ padding: 0, overflowX: 'auto', background: 'transparent' }}>
              <table className="cardless-table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>ASSET</th>
                    <th style={{ textAlign: 'left' }}>WALLET / EXCHANGE</th>
                    <th style={{ textAlign: 'right' }}>HOLDINGS</th>
                    <th style={{ textAlign: 'right' }}>AVG BUY</th>
                    <th style={{ textAlign: 'right' }}>CURRENT PRICE</th>
                    <th style={{ textAlign: 'right' }}>TOTAL VALUE (USD / IDR)</th>
                    <th style={{ textAlign: 'right' }}>ALLOCATION</th>
                    <th style={{ textAlign: 'right' }}>ALL-TIME P&L</th>
                    <th style={{ textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedHoldings.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-muted)' }}>
                        {hiddenCount > 0
                          ? `All ${hiddenCount} small balances (< $5.00) hidden. Uncheck the filter above to view all.`
                          : 'No spot assets recorded in portfolio.'}
                      </td>
                    </tr>
                  ) : (
                    displayedHoldings.map((h) => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 800 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TokenIcon symbol={h.symbol} size={20} />
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
                              title="Edit Asset"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => setHoldingToDelete(h)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-bearish)', cursor: 'pointer', padding: '2px' }}
                              title="Delete Asset"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Banner if assets are hidden */}
            {hiddenCount > 0 && hideSmallAssets && (
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: 'var(--color-text-muted)',
                }}
              >
                <span>Hiding {hiddenCount} small balances under $5.00.</span>
                <button
                  onClick={() => setHideSmallAssets(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-accent-primary)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '10px',
                  }}
                >
                  Show All ({rawHoldings.length})
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Custom UI: Delete Holding Confirmation Modal (Apple Pro Glassmorphism) */}
      {holdingToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(16px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !isDeleting && setHoldingToDelete(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              backgroundColor: '#0c0d12',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderTop: '1px solid rgba(255, 255, 255, 0.22)',
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
                  backgroundColor: 'rgba(255, 69, 58, 0.12)',
                  border: '1px solid rgba(255, 69, 58, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF453A',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Delete Asset Confirmation
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Asset will be permanently removed from your portfolio
                </p>
              </div>
            </div>

            {/* Asset preview chip */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
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
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                  ${holdingToDelete.currentValueUsd.toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                  Rp {holdingToDelete.currentValueIdr.toLocaleString()}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to delete <strong style={{ color: '#fff' }}>{holdingToDelete.symbol}</strong>? This action cannot be undone and will immediately recalculate your Net Worth.
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
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  height: '36px',
                  padding: '0 18px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  backgroundColor: '#FF3B30',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(255, 59, 48, 0.4)',
                }}
              >
                <Trash2 size={13} />
                <span>{isDeleting ? 'Deleting...' : 'Delete Asset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom UI: Add / Edit Holding Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(16px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !isSaving && setShowModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#0c0d12',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderTop: '1px solid rgba(255, 255, 255, 0.22)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)',
              overflow: 'hidden',
              padding: '22px 24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {editingId ? 'Edit Portfolio Asset' : 'Add Manual Asset'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Symbol Input with Live Price Lookup */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Asset Symbol (e.g. BTC, ETH, SOL, TAO, WLD)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TokenIcon symbol={formSymbol} size={28} />
                  <input
                    type="text"
                    value={formSymbol}
                    onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                    placeholder="BTC"
                    style={{
                      flex: 1,
                      height: '36px',
                      padding: '0 10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                    }}
                  />
                  {liveAssetPrice !== null && (
                    <div style={{ fontSize: '11px', color: 'var(--color-bullish)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      ${liveAssetPrice.toLocaleString()} {isFetchingPrice ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Exchange / Storage Location */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Exchange / Wallet Location
                </label>
                <select
                  value={formExchange}
                  onChange={(e) => setFormExchange(e.target.value as any)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    backgroundColor: '#12141a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  <option value="WALLET">Ledger / Cold Storage (WALLET)</option>
                  <option value="BINANCE">Binance Spot / Earn</option>
                  <option value="OKX">OKX Trading / Savings</option>
                  <option value="BYBIT">Bybit UTA / Funding</option>
                  <option value="MANUAL">Other Wallet (MANUAL)</option>
                </select>
              </div>

              {/* Amount & Average Buy Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Holdings Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formAmount}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Average Buy Price ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
              </div>

              {/* Target Percent */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Target Allocation (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formTargetPercent}
                  onChange={(e) => setFormTargetPercent(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                  style={{ padding: '0 16px', height: '36px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveHolding}
                  disabled={isSaving}
                  style={{ padding: '0 20px', height: '36px', fontSize: '12px' }}
                >
                  {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add to Portfolio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
