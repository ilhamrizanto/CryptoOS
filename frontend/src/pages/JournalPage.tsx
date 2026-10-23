import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  X,
  Layers,
  Search,
  Target,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { api } from '../services/api';
import { evidenceDb } from '../services/db';
import { useSettingsStore } from '../store/settings.store';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';
import { JournalEntry, TradeDirection } from '../types/trade.types';

export const JournalPage: React.FC = () => {
  const navigate = useNavigate();
  const { usdToIdrRate } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED' | 'ALL'>('OPEN');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Close Trade Modal State
  const [closingEntry, setClosingEntry] = useState<JournalEntry | null>(null);
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [exitReason, setExitReason] = useState<string>('TP_HIT');
  const [lessonsLearned, setLessonsLearned] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // New Manual Entry Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('BTCUSDT');
  const [newDirection, setNewDirection] = useState<TradeDirection>('LONG');
  const [newEntryPrice, setNewEntryPrice] = useState<number>(95000);
  const [newPositionSize, setNewPositionSize] = useState<number>(0.5);
  const [newStopLoss, setNewStopLoss] = useState<number>(92000);
  const [newTakeProfit, setNewTakeProfit] = useState<number>(104000);
  const [newPsychology, setNewPsychology] = useState<string>('CALM');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Screenshots View Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeScreenshots, setActiveScreenshots] = useState<Array<{ id: string; url: string; caption?: string }>>([]);

  const showToast = (msg: string, _type?: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadJournalData = useCallback(async () => {
    try {
      const [entriesRes, analyticsRes] = await Promise.all([
        api.get<JournalEntry[]>('/journal').catch(() => []),
        api.get<any>('/journal/analytics').catch(() => null),
      ]);
      setEntries(entriesRes || []);
      setAnalytics(analyticsRes || null);
    } catch (err) {
      console.error('Failed to load journal data:', err);
    }
  }, []);

  useEffect(() => {
    loadJournalData();
  }, [loadJournalData]);

  // Open trades vs Closed trades
  const openEntries = entries.filter((e) => e.status === 'OPEN');
  const closedEntries = entries.filter((e) => e.status === 'CLOSED');

  // Filtered entries by tab and search
  const displayedEntries = entries.filter((entry) => {
    if (activeTab === 'OPEN' && entry.status !== 'OPEN') return false;
    if (activeTab === 'CLOSED' && entry.status !== 'CLOSED') return false;
    if (searchFilter.trim() && !entry.symbol.toUpperCase().includes(searchFilter.trim().toUpperCase())) return false;
    return true;
  });

  // Trigger Close Trade Modal
  const handleOpenCloseModal = (entry: JournalEntry) => {
    setClosingEntry(entry);
    setExitPrice(entry.takeProfitPrice || (entry.direction === 'LONG' ? entry.entryPrice * 1.05 : entry.entryPrice * 0.95));
    setExitReason('TP_HIT');
    setLessonsLearned('');
  };

  // Submit Close Trade
  const handleSubmitCloseTrade = async () => {
    if (!closingEntry) return;
    try {
      setIsSubmittingClose(true);
      await api.post(`/journal/${closingEntry.id}/close`, {
        exitPrice,
        closedAt: Date.now(),
        lessonsLearned: `[${exitReason}] ${lessonsLearned}`,
        usdToIdrRate,
      });

      showToast(`Position ${closingEntry.symbol} closed & PnL realized!`);
      setClosingEntry(null);
      await loadJournalData();
    } catch (err) {
      console.error('Failed to close entry:', err);
      showToast('Failed to close transaction in journal', 'error');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  // Submit New Manual Trade
  const handleSubmitNewTrade = async () => {
    try {
      setIsSubmittingNew(true);
      await api.post('/journal', {
        symbol: newSymbol.toUpperCase(),
        direction: newDirection,
        entryPrice: newEntryPrice,
        positionSize: newPositionSize,
        stopLossPrice: newStopLoss,
        takeProfitPrice: newTakeProfit,
        psychologicalState: `[${newPsychology}] ${newNotes}`,
      });

      showToast(`New position ${newSymbol} added to Journal!`);
      setShowNewModal(false);
      await loadJournalData();
    } catch (err) {
      console.error('Failed to create journal entry:', err);
      showToast('Failed to add position to journal', 'error');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trade entry from the journal?')) return;
    try {
      await api.delete(`/journal/${id}`);
      showToast('Trade entry deleted');
      await loadJournalData();
    } catch (err) {
      console.error('Failed to delete trade:', err);
    }
  };

  // View Screenshots for an entry
  const handleViewScreenshots = async (entry: JournalEntry) => {
    try {
      let items: Array<{ id: string; url: string; caption?: string }> = [];
      if (entry.ideaId) {
        items = await evidenceDb.getScreenshotsByIdea(entry.ideaId);
      }
      if (items.length > 0) {
        setActiveScreenshots(items);
        setPreviewImage(items[0].url);
      } else {
        showToast('No chart screenshot proof recorded for this setup');
      }
    } catch (err) {
      console.error('Error fetching screenshots from IndexedDB:', err);
    }
  };

  // PnL Preview in Close Modal
  const previewPnlUsd = closingEntry
    ? closingEntry.direction === 'LONG'
      ? (exitPrice - closingEntry.entryPrice) * closingEntry.positionSize
      : (closingEntry.entryPrice - exitPrice) * closingEntry.positionSize
    : 0;

  const previewPnlPercent = closingEntry && closingEntry.entryPrice > 0
    ? (previewPnlUsd / (closingEntry.entryPrice * closingEntry.positionSize)) * 100
    : 0;

  // Key Analytics Metric Values
  const totalTrades = analytics?.totalTrades > 0 ? analytics.totalTrades : closedEntries.length;
  const winRate = totalTrades > 0 ? (analytics?.winRate ?? 0) : 0;
  const winCount = totalTrades > 0 ? (analytics?.winCount ?? 0) : 0;
  const lossCount = totalTrades > 0 ? (analytics?.lossCount ?? 0) : 0;
  const profitFactor = totalTrades > 0 ? (analytics?.profitFactor ?? 0) : 0;
  const totalPnlUsd = analytics?.totalPnlUsd || 0;
  const totalPnlIdr = analytics?.totalPnlIdr || (totalPnlUsd * (usdToIdrRate || 16300));
  const avgRMultiple = totalTrades > 0 ? (analytics?.averageRMultiple ?? 0) : 0;

  // Render SVG Sparkline for Equity Curve
  const equityPoints = analytics?.equityCurve && analytics.equityCurve.length > 1
    ? analytics.equityCurve.map((c: any) => c.cumulativePnlUsd)
    : [0, 0];

  const minEquity = Math.min(...equityPoints);
  const maxEquity = Math.max(...equityPoints);
  const rangeEquity = maxEquity - minEquity || 1;
  const svgWidth = 240;
  const svgHeight = 44;
  const pointsString = equityPoints
    .map((val: number, idx: number) => {
      const x = (idx / (equityPoints.length - 1)) * svgWidth;
      const y = svgHeight - ((val - minEquity) / rangeEquity) * (svgHeight - 10) - 5;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingBottom: 'var(--space-8)' }}>
      {/* Toast Notification */}
      {notification && (
        <div className="terminal-toast toast-enter">
          <Sparkles size={15} color="var(--color-accent-primary)" />
          <span>{notification}</span>
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {previewImage && (
        <div
          className="modal-backdrop-animate"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div className="modal-dialog-animate" style={{ position: 'relative', maxWidth: '92vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-44px',
                right: '0',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
              }}
            >
              <X size={16} />
              <span>Close Preview</span>
            </button>
            <img
              src={previewImage}
              alt="Evidence Chart"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-accent)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              }}
            />
            {activeScreenshots.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                {activeScreenshots.map((s) => (
                  <button
                    key={s.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(s.url);
                    }}
                    style={{
                      width: '44px',
                      height: '32px',
                      padding: 0,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: previewImage === s.url ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <img src={s.url} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close Trade Modal */}
      {closingEntry && (
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
              maxWidth: '500px',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-accent)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.04em' }}>
                  EXECUTION RECONCILIATION
                </span>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: '2px 0 0' }}>
                  Close Position: {closingEntry.symbol} ({closingEntry.direction})
                </h2>
              </div>
              <button
                onClick={() => setClosingEntry(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px 12px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>ENTRY PRICE</span>
                <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>${closingEntry.entryPrice.toLocaleString()}</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>POSITION SIZE</span>
                <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{closingEntry.positionSize} Coins</span>
              </div>
            </div>

            {/* Exit Price Input */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                EXIT / CLOSING PRICE ($)
              </label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)}
                className="form-input mono"
                style={{ height: '36px', fontSize: '13px', fontWeight: 800 }}
              />
            </div>

            {/* Live PnL Preview */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: previewPnlUsd >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                border: `1px solid ${previewPnlUsd >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>ESTIMATED REALIZED P&L</span>
                <div style={{ marginTop: '2px' }}>
                  <DualCurrencyValue usd={previewPnlUsd} size="md" sentiment={previewPnlUsd >= 0 ? 'bullish' : 'bearish'} layout="row" />
                </div>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: previewPnlUsd >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)',
                }}
              >
                {previewPnlPercent > 0 ? '+' : ''}{previewPnlPercent.toFixed(2)}%
              </span>
            </div>

            {/* Exit Reason */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                EXIT REASON & RATIONALE
              </label>
              <select
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                className="form-input"
                style={{ height: '36px', fontSize: '12px' }}
              >
                <option value="TP_HIT">Take Profit Target Reached (TP Hit)</option>
                <option value="SL_HIT">Stop Loss Triggered (SL Hit)</option>
                <option value="TRAILING_SL">Trailing Stop Triggered</option>
                <option value="MANUAL_EXIT">Manual Discretionary Exit</option>
                <option value="TIME_STOP">Time Invalidation / Reversal Signal</option>
              </select>
            </div>

            {/* Lessons Learned */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                EVALUATION & LESSONS LEARNED
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="What was executed well? Any emotional bias or technical deviation?..."
                style={{ fontSize: '11px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="btn btn-secondary" onClick={() => setClosingEntry(null)} style={{ height: '34px', fontSize: '12px' }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitCloseTrade}
                disabled={isSubmittingClose}
                style={{ height: '34px', fontSize: '12px', fontWeight: 800 }}
              >
                {isSubmittingClose ? 'Closing...' : 'Confirm Realized P&L'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Manual Trade Modal */}
      {showNewModal && (
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
              maxWidth: '520px',
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
                  EXECUTION LOG ENTRY
                </span>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: '2px 0 0' }}>
                  New Trade Journal Entry
                </h2>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  SYMBOL / TICKER
                </label>
                <input
                  type="text"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  DIRECTION
                </label>
                <select
                  value={newDirection}
                  onChange={(e) => setNewDirection(e.target.value as TradeDirection)}
                  className="form-input"
                  style={{ height: '34px', fontSize: '12px' }}
                >
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  ENTRY PRICE ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newEntryPrice}
                  onChange={(e) => setNewEntryPrice(Number(e.target.value))}
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  POSITION SIZE (COINS)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newPositionSize}
                  onChange={(e) => setNewPositionSize(Number(e.target.value))}
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-bearish)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  STOP LOSS ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newStopLoss}
                  onChange={(e) => setNewStopLoss(Number(e.target.value))}
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '12px', borderColor: 'var(--color-bearish-border)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-bullish)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  TAKE PROFIT ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newTakeProfit}
                  onChange={(e) => setNewTakeProfit(Number(e.target.value))}
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '12px', borderColor: 'var(--color-bullish-border)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                ENTRY EMOTION & PSYCHOLOGY
              </label>
              <select
                value={newPsychology}
                onChange={(e) => setNewPsychology(e.target.value)}
                className="form-input"
                style={{ height: '34px', fontSize: '12px' }}
              >
                <option value="CALM">😌 Calm & Following Trading Plan</option>
                <option value="FOMO">⚡ Fear of Missing Out (FOMO)</option>
                <option value="REVENGE">🔥 Revenge Trading (Seeking Quick Recovery)</option>
                <option value="HESITANT">🤔 Hesitant / Low Conviction</option>
                <option value="OVERCONFIDENT">🚀 Overconfident / Aggressive</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                SETUP NOTES
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Technical rationale & basis for position entry..."
                style={{ fontSize: '11px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button className="btn btn-secondary" onClick={() => setShowNewModal(false)} style={{ height: '34px', fontSize: '12px' }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitNewTrade}
                disabled={isSubmittingNew}
                style={{ height: '34px', fontSize: '12px', fontWeight: 800 }}
              >
                {isSubmittingNew ? 'Saving...' : 'Save to Journal'}
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
              EXECUTION LOG & PERFORMANCE ANALYTICS
            </span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              POST-TRADE QUANTITATIVE AUDIT
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: '2px 0 0' }}>
            Trading Journal & Psychology
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
            Audit open positions, track realized portfolio P&L, monitor win rate & profit factor, and record trading psychology.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/pipeline')}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
          >
            <Compass size={14} />
            <span>Pipeline Lab</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowNewModal(true)}
            style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}
          >
            <Plus size={14} />
            <span>Log Manual Trade</span>
          </button>
        </div>
      </div>

      {/* Top Performance Cockpit (Cardless Sheet / Metric Strip) */}
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
        {/* KPI 1: Realized Net PnL */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              REALIZED NET P&L
            </span>
            <span
              className={totalPnlUsd >= 0 ? 'bullish-badge' : 'bearish-badge'}
              style={{ fontSize: '9px', padding: '1px 5px' }}
            >
              {totalTrades} Closed
            </span>
          </div>
          <div style={{ marginTop: '2px' }}>
            <DualCurrencyValue
              usd={totalPnlUsd}
              idr={totalPnlIdr}
              size="lg"
              sentiment={totalPnlUsd >= 0 ? 'bullish' : 'bearish'}
            />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Total cumulative realized net profit
          </span>
        </div>

        {/* KPI 2: Win Rate & Profit Factor */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              WIN RATE & FACTOR
            </span>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              {winCount}W - {lossCount}L
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span className="value-number" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-accent-primary)' }}>
              {winRate}%
            </span>
            <span className="value-number" style={{ fontSize: '12px', color: '#ffffff', fontWeight: 700 }}>
              {profitFactor} PF
            </span>
          </div>
          <div style={{ width: '100%', height: '3px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
            <div style={{ width: `${winRate}%`, height: '100%', backgroundColor: 'var(--color-accent-primary)' }} />
          </div>
        </div>

        {/* KPI 3: Avg Risk/Reward & Expectancy */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              AVERAGE R-MULTIPLE
            </span>
            <Target size={13} color="var(--color-accent-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span className="value-number bullish-text" style={{ fontSize: '24px', fontWeight: 900 }}>
              {totalTrades > 0 ? `+${avgRMultiple} R` : '0.00 R'}
            </span>
            <span className="value-number" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              {analytics?.expectancyUsd !== undefined && totalTrades > 0 ? `${analytics.expectancyUsd >= 0 ? '+' : ''}$${analytics.expectancyUsd.toFixed(0)} / trade` : '$0 / trade'}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {totalTrades > 0 ? 'Positive mathematical expectancy over time' : 'Awaiting closed trade evaluations'}
          </span>
        </div>

        {/* KPI 4: Equity Curve Progression */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              CUMULATIVE EQUITY CURVE
            </span>
            <TrendingUp size={13} color="var(--color-bullish)" />
          </div>
          <div style={{ height: '38px', marginTop: '2px', display: 'flex', alignItems: 'center' }}>
            <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="var(--color-accent-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />
            </svg>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
            Cumulative equity trajectory
          </span>
        </div>
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div
        className="cardless-sheet"
        style={{
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          background: 'transparent',
        }}
      >
        <div style={{ display: 'flex', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('OPEN')}
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'OPEN' ? 'var(--color-accent-primary)' : 'transparent',
              color: activeTab === 'OPEN' ? '#08080a' : 'var(--color-text-secondary)',
              transition: 'background-color var(--transition-fast), color var(--transition-fast)',
            }}
          >
            OPEN POSITIONS ({openEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CLOSED')}
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'CLOSED' ? 'var(--color-accent-primary)' : 'transparent',
              color: activeTab === 'CLOSED' ? '#08080a' : 'var(--color-text-secondary)',
              transition: 'background-color var(--transition-fast), color var(--transition-fast)',
            }}
          >
            CLOSED HISTORY ({closedEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'ALL' ? 'var(--color-accent-primary)' : 'transparent',
              color: activeTab === 'ALL' ? '#08080a' : 'var(--color-text-secondary)',
              transition: 'background-color var(--transition-fast), color var(--transition-fast)',
            }}
          >
            ALL ({entries.length})
          </button>
        </div>

        {/* Search Ticker Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search symbol (e.g. BTC)..."
              className="form-input mono"
              style={{ width: '180px', height: '32px', fontSize: '11px', paddingLeft: '30px' }}
            />
          </div>
        </div>
      </div>

      {/* Tab Content: OPEN POSITIONS */}
      {(activeTab === 'OPEN' || activeTab === 'ALL') && openEntries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={13} color="var(--color-bullish)" />
            <span style={{ fontSize: '11px', color: 'var(--color-bullish)', fontWeight: 800, letterSpacing: '0.04em' }}>
              ACTIVE RUNNING POSITIONS ({openEntries.length})
            </span>
          </div>

          <div className="cardless-sheet" style={{ display: 'flex', flexDirection: 'column', background: 'transparent', padding: 0 }}>
            {openEntries.map((trade) => {
              const currentPrice = trade.takeProfitPrice ? (trade.entryPrice + trade.takeProfitPrice) / 2 : trade.entryPrice * 1.02;
              const unrealizedPnlUsd =
                trade.direction === 'LONG'
                  ? (currentPrice - trade.entryPrice) * trade.positionSize
                  : (trade.entryPrice - currentPrice) * trade.positionSize;

              const slDist = Math.abs(trade.entryPrice - trade.stopLossPrice);
              const slDistPercent = trade.entryPrice > 0 ? (slDist / trade.entryPrice) * 100 : 0;

              return (
                <div
                  key={trade.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    background: 'transparent',
                    borderBottom: '1px solid var(--color-border)',
                    borderLeft: `3px solid ${trade.direction === 'LONG' ? 'var(--color-bullish)' : 'var(--color-bearish)'}`,
                    padding: '12px 16px',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-bg-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {trade.direction === 'LONG' ? (
                        <ArrowUpRight size={18} color="var(--color-bullish)" />
                      ) : (
                        <ArrowDownRight size={18} color="var(--color-bearish)" />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="mono" style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>
                          {trade.symbol}
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: trade.direction === 'LONG' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: trade.direction === 'LONG' ? 'var(--color-bullish)' : 'var(--color-bearish)',
                          }}
                        >
                          {trade.direction}
                        </span>
                        <span className="cyan-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                          RUNNING
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Opened: {new Date(trade.openedAt).toLocaleDateString()} {new Date(trade.openedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block' }}>ENTRY PRICE</span>
                      <div className="mono" style={{ fontWeight: 700, fontSize: '12px', color: '#fff' }}>${trade.entryPrice.toLocaleString()}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--color-bearish)', display: 'block' }}>STOP LOSS (-{slDistPercent.toFixed(1)}%)</span>
                      <div className="mono bearish-text" style={{ fontWeight: 700, fontSize: '12px' }}>${trade.stopLossPrice.toLocaleString()}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--color-bullish)', display: 'block' }}>TARGET (TP)</span>
                      <div className="mono bullish-text" style={{ fontWeight: 700, fontSize: '12px' }}>
                        ${trade.takeProfitPrice ? trade.takeProfitPrice.toLocaleString() : '-'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block' }}>SIZE</span>
                      <div className="mono" style={{ fontWeight: 700, fontSize: '12px', color: '#fff' }}>{trade.positionSize} Coins</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block' }}>EST. FLOATING PNL</span>
                      <DualCurrencyValue usd={unrealizedPnlUsd} layout="row" sentiment={unrealizedPnlUsd >= 0 ? 'bullish' : 'bearish'} size="sm" />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {trade.ideaId && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleViewScreenshots(trade)}
                        title="View On-Chain Evidence Chart in IndexedDB"
                        style={{ height: '32px', padding: '0 8px' }}
                      >
                        <ImageIcon size={14} />
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenCloseModal(trade)}
                      style={{ height: '32px', fontSize: '11px', fontWeight: 800, padding: '0 12px' }}
                    >
                      <CheckCircle size={13} />
                      <span>Close Position</span>
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDeleteEntry(trade.id)}
                      title="Delete"
                      style={{ height: '32px', padding: '0 8px', color: 'var(--color-bearish)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State for OPEN POSITIONS */}
      {activeTab === 'OPEN' && openEntries.length === 0 && (
        <div className="card-panel" style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--color-bg-surface)' }}>
          <Layers size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>No Open Positions</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '4px auto 16px' }}>
            Dispatch mature setups from Pipeline Incubator or click below to log a new position manually.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/pipeline')} style={{ height: '34px', fontSize: '12px' }}>
              <Compass size={14} />
              <span>Open Pipeline Incubator</span>
            </button>
            <button className="btn btn-primary" onClick={() => setShowNewModal(true)} style={{ height: '34px', fontSize: '12px' }}>
              <Plus size={14} />
              <span>Log Manual Position</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content: CLOSED TRADES */}
      {(activeTab === 'CLOSED' || activeTab === 'ALL') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activeTab === 'ALL' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
              <CheckCircle size={13} color="var(--color-accent-primary)" />
              <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.04em' }}>
                CLOSED TRANSACTION HISTORY ({closedEntries.length})
              </span>
            </div>
          )}

          {closedEntries.length === 0 ? (
            <div className="card-panel" style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--color-bg-surface)' }}>
              <BookOpen size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>No Closed Trades History</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                Positions you close are automatically recorded here with quantitative R-Multiple metrics and realized P&L audit.
              </p>
            </div>
          ) : (
            <div className="cardless-sheet" style={{ padding: 0, overflowX: 'auto', background: 'transparent' }}>
              <table className="cardless-table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-subtle)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 700 }}>SYMBOL & DIRECTION</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 700 }}>ENTRY & EXIT</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 700 }}>R-MULTIPLE</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 700 }}>REALIZED P&L</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 700 }}>PSYCHOLOGY & EVALUATION</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 700 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedEntries
                    .filter((e) => activeTab === 'ALL' || e.status === 'CLOSED')
                    .map((trade) => (
                      <tr
                        key={trade.id}
                        style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="mono" style={{ fontWeight: 800, color: '#fff', fontSize: '12px' }}>{trade.symbol}</span>
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: '3px',
                                backgroundColor: trade.direction === 'LONG' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                                color: trade.direction === 'LONG' ? 'var(--color-bullish)' : 'var(--color-bearish)',
                              }}
                            >
                              {trade.direction}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {trade.closedAt ? new Date(trade.closedAt).toLocaleDateString() : trade.openedAt ? new Date(trade.openedAt).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div className="mono" style={{ color: '#fff', fontWeight: 700 }}>
                            ${trade.entryPrice.toLocaleString()} &rarr; ${(trade.exitPrice || 0).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{trade.positionSize} Coins</div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <span
                            className="mono"
                            style={{
                              fontWeight: 900,
                              fontSize: '12px',
                              color: (trade.rMultiple || 0) >= 0 ? 'var(--color-accent-primary)' : 'var(--color-bearish)',
                            }}
                          >
                            {(trade.rMultiple || 0) >= 0 ? '+' : ''}{trade.rMultiple || 0} R
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <DualCurrencyValue
                            usd={trade.pnlUsd || 0}
                            idr={trade.pnlIdr || 0}
                            layout="row"
                            size="sm"
                            sentiment={(trade.pnlUsd || 0) >= 0 ? 'bullish' : 'bearish'}
                          />
                        </td>
                        <td style={{ padding: '10px 14px', maxWidth: '320px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {trade.lessonsLearned || trade.psychologicalState || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {trade.ideaId && (
                              <button
                                onClick={() => handleViewScreenshots(trade)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', cursor: 'pointer', padding: '2px' }}
                                title="View Chart Evidence"
                              >
                                <ImageIcon size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteEntry(trade.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-bearish)', cursor: 'pointer', padding: '2px' }}
                              title="Delete"
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
          )}
        </div>
      )}
    </div>
  );
};
