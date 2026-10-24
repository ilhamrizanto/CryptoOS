import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  X,
  Layers,
  Search,
  Activity,
  Compass,
  Calculator,
  Brain,
  Zap,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Dice5,
} from 'lucide-react';
import { api } from '../services/api';
import { evidenceDb } from '../services/db';
import { useSettingsStore } from '../store/settings.store';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';
import { JournalEntry, TradeDirection } from '../types/trade.types';
import { TokenIcon } from '../components/common/TokenIcon';
import { MonteCarloEngine } from '../components/montecarlo/MonteCarloEngine';

/**
 * Helper to parse psychological tags and notes.
 * Example input: "[CALM] Followed 4H breakout plan perfectly."
 */
function parsePsychology(state?: string): { emotion: string; notes: string; emoji: string; color: string; label: string } {
  if (!state) return { emotion: 'CALM', notes: '', emoji: '😌', color: '#10b981', label: 'Calm & Planned' };
  const match = state.match(/^\[([A-Z_]+)\]\s*(.*)$/);
  if (match) {
    const rawEmotion = match[1];
    const notes = match[2];
    switch (rawEmotion) {
      case 'FOMO':
        return { emotion: 'FOMO', notes, emoji: '⚡', color: '#f59e0b', label: 'FOMO / Impulsive' };
      case 'REVENGE':
        return { emotion: 'REVENGE', notes, emoji: '🔥', color: '#f43f5e', label: 'Revenge Trading' };
      case 'HESITANT':
        return { emotion: 'HESITANT', notes, emoji: '🤔', color: '#8b5cf6', label: 'Hesitant / Low Conviction' };
      case 'OVERCONFIDENT':
        return { emotion: 'OVERCONFIDENT', notes, emoji: '🚀', color: '#ec4899', label: 'Overconfident' };
      case 'CALM':
      default:
        return { emotion: 'CALM', notes, emoji: '😌', color: '#10b981', label: 'Calm & Planned' };
    }
  }
  return { emotion: 'CALM', notes: state, emoji: '😌', color: '#10b981', label: 'Calm & Planned' };
}

export const JournalPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usdToIdrRate } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED' | 'ALL'>('OPEN');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [, setAnalytics] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [emotionFilter, setEmotionFilter] = useState<string>('ALL');

  // Interactive Performance Analytics States
  const [chartMode, setChartMode] = useState<'EQUITY' | 'DRAWDOWN' | 'R_MULTIPLE' | 'DISTRIBUTION' | 'MONTE_CARLO'>('EQUITY');
  const [useBenchmark, setUseBenchmark] = useState<boolean>(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Close Trade Modal State
  const [closingEntry, setClosingEntry] = useState<JournalEntry | null>(null);
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [exitReason, setExitReason] = useState<string>('TP_HIT');
  const [lessonsLearned, setLessonsLearned] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // New Manual Entry Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('SOLUSDT');
  const [newDirection, setNewDirection] = useState<TradeDirection>('LONG');
  const [newEntryPrice, setNewEntryPrice] = useState<number>(185);
  const [newPositionSize, setNewPositionSize] = useState<number>(10);
  const [newStopLoss, setNewStopLoss] = useState<number>(177.6);
  const [newTakeProfit, setNewTakeProfit] = useState<number>(210);
  const [newPsychology, setNewPsychology] = useState<string>('CALM');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Screenshots View Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeScreenshots, setActiveScreenshots] = useState<Array<{ id: string; url: string; caption?: string }>>([]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadJournalData = useCallback(async () => {
    try {
      const [entriesRes, analyticsRes] = await Promise.all([
        api.get<JournalEntry[]>('/journal/entries').catch(() => []),
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

  // Handle passed location state from Calculator or Pipeline
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.openNewModal) {
        setShowNewModal(true);
        if (state.symbol) setNewSymbol(state.symbol);
        if (state.direction) setNewDirection(state.direction);
        if (state.entryPrice) setNewEntryPrice(Number(state.entryPrice));
        if (state.positionSize) setNewPositionSize(Number(state.positionSize));
        if (state.stopLossPrice) setNewStopLoss(Number(state.stopLossPrice));
        if (state.takeProfitPrice) setNewTakeProfit(Number(state.takeProfitPrice));
        if (state.notes) setNewNotes(state.notes);
        showToast(`Setup for ${state.symbol || 'trade'} imported from Calculator!`);
      }
    }
  }, [location.state]);

  // Open trades vs Closed trades
  const openEntries = entries.filter((e) => e.status === 'OPEN');
  const closedEntries = entries.filter((e) => e.status === 'CLOSED');

  // 10-Trade Realistic Benchmark Sequence for Strategy Demonstration
  const benchmarkTrades: JournalEntry[] = useMemo(() => [
    {
      id: 'bm_1',
      symbol: 'ETHUSDT',
      direction: 'LONG',
      entryPrice: 2650,
      exitPrice: 2980,
      positionSize: 5,
      stopLossPrice: 2540,
      pnlUsd: 1650,
      pnlIdr: Math.round(1650 * (usdToIdrRate || 17956)),
      pnlPercent: 12.45,
      rMultiple: 3.0,
      status: 'CLOSED',
      openedAt: Date.now() - 86400000 * 18,
      closedAt: Date.now() - 86400000 * 16,
      psychologicalState: '[CALM] Disciplined 4H retest entry.',
      lessonsLearned: 'Patience paid off on key support bounce.',
    },
    {
      id: 'bm_2',
      symbol: 'SOLUSDT',
      direction: 'LONG',
      entryPrice: 175,
      exitPrice: 195.5,
      positionSize: 40,
      stopLossPrice: 165,
      pnlUsd: 820,
      pnlIdr: Math.round(820 * (usdToIdrRate || 17956)),
      pnlPercent: 11.71,
      rMultiple: 2.1,
      status: 'CLOSED',
      openedAt: Date.now() - 86400000 * 15,
      closedAt: Date.now() - 86400000 * 13,
      psychologicalState: '[CALM] High timeframe volume shelf breakout.',
      lessonsLearned: 'Scaled out partial profit at TP1.',
    },
    {
      id: 'bm_3',
      symbol: 'BTCUSDT',
      direction: 'SHORT',
      entryPrice: 68500,
      exitPrice: 69120,
      positionSize: 0.5,
      stopLossPrice: 69200,
      pnlUsd: -310,
      pnlIdr: Math.round(-310 * (usdToIdrRate || 17956)),
      pnlPercent: -0.9,
      rMultiple: -0.85,
      status: 'CLOSED',
      openedAt: Date.now() - 86400000 * 12,
      closedAt: Date.now() - 86400000 * 11,
      psychologicalState: '[HESITANT] Counter-trend short with low conviction.',
      lessonsLearned: 'Did not wait for 15M structure break confirmation.',
    },
    {
      id: 'bm_4',
      symbol: 'DOGEUSDT',
      direction: 'LONG',
      entryPrice: 0.145,
      exitPrice: 0.134,
      positionSize: 49000,
      stopLossPrice: 0.136,
      pnlUsd: -540,
      pnlIdr: Math.round(-540 * (usdToIdrRate || 17956)),
      pnlPercent: -7.58,
      rMultiple: -1.2,
      status: 'CLOSED',
      openedAt: Date.now() - 86400000 * 10,
      closedAt: Date.now() - 86400000 * 9,
      psychologicalState: '[FOMO] Chased green candle on social media hype.',
      lessonsLearned: 'Break of discipline: bought top of pump without setup.',
    },
    {
      id: 'bm_5',
      symbol: 'PEPEUSDT',
      direction: 'LONG',
      entryPrice: 0.0000102,
      exitPrice: 0.0000087,
      positionSize: 500000000,
      stopLossPrice: 0.0000094,
      pnlUsd: -750,
      pnlIdr: Math.round(-750 * (usdToIdrRate || 17956)),
      pnlPercent: -14.7,
      rMultiple: -1.8,
      status: 'CLOSED',
      openedAt: Date.now() - 86400000 * 8,
      closedAt: Date.now() - 86400000 * 7,
      psychologicalState: '[REVENGE] Tried to recover DOGE loss with oversized lot.',
      lessonsLearned: 'Severe tilt mistake. Doubled position size without plan.',
    },
    {
      id: 'bm_6',
      symbol: 'INJUSDT',
      direction: 'LONG',
      entryPrice: 22.4,
      exitPrice: 26.2,
      positionSize: 326,
      stopLossPrice: 21.0,
      pnlUsd: 1240,
      pnlIdr: Math.round(1240 * (usdToIdrRate || 17956)),
      pnlPercent: 16.96,
      rMultiple: 2.8,
      status: 'CLOSED',
      openedAt: Date.now() - 86400000 * 6,
      closedAt: Date.now() - 86400000 * 5,
      psychologicalState: '[CALM] Reset mindset. Waited for 4-Pillars confluence.',
      lessonsLearned: 'Returning to trading plan immediately restored edge.',
    },
    {
      id: 'bm_7',
      symbol: 'NEARUSDT',
      direction: 'LONG',
      entryPrice: 5.15,
      exitPrice: 5.83,
      positionSize: 1000,
      stopLossPrice: 4.8,
      pnlUsd: 680,
      pnlIdr: Math.round(680 * (usdToIdrRate || 17956)),
      pnlPercent: 13.2,
      rMultiple: 1.9,
      status: 'CLOSED',
      openedAt: Date.now() - 86400000 * 4,
      closedAt: Date.now() - 86400000 * 3,
      psychologicalState: '[CALM] Clean retest of daily value area high.',
      lessonsLearned: 'Disciplined trailing stop protected profit.',
    },
    {
      id: 'bm_8',
      symbol: 'SUIUSDT',
      direction: 'LONG',
      entryPrice: 2.2,
      exitPrice: 2.06,
      positionSize: 3000,
      stopLossPrice: 2.06,
      pnlUsd: -420,
      pnlIdr: Math.round(-420 * (usdToIdrRate || 17956)),
      pnlPercent: -6.36,
      rMultiple: -1.0,
      status: 'CLOSED',
      openedAt: Date.now() - 86400000 * 3,
      closedAt: Date.now() - 86400000 * 2,
      psychologicalState: '[OVERCONFIDENT] Increased risk to 4% after winning streak.',
      lessonsLearned: 'Stick to max 2% risk limit regardless of recent wins.',
    },
    {
      id: 'bm_9',
      symbol: 'TAOUSDT',
      direction: 'LONG',
      entryPrice: 480,
      exitPrice: 552.5,
      positionSize: 20,
      stopLossPrice: 452,
      pnlUsd: 1450,
      pnlIdr: Math.round(1450 * (usdToIdrRate || 17956)),
      pnlPercent: 15.1,
      rMultiple: 2.6,
      status: 'CLOSED',
      openedAt: Date.now() - 86400000 * 2,
      closedAt: Date.now() - 86400000 * 1,
      psychologicalState: '[CALM] Strong institutional accumulator footprint.',
      lessonsLearned: 'Target TP hit with disciplined hold.',
    },
    {
      id: 'bm_10',
      symbol: 'BTCUSDT',
      direction: 'LONG',
      entryPrice: 66800,
      exitPrice: 69866,
      positionSize: 0.3,
      stopLossPrice: 65400,
      pnlUsd: 920,
      pnlIdr: Math.round(920 * (usdToIdrRate || 17956)),
      pnlPercent: 4.59,
      rMultiple: 2.2,
      status: 'CLOSED',
      openedAt: Date.now() - 86400000 * 1,
      closedAt: Date.now() - 3600000 * 4,
      psychologicalState: '[CALM] Textbook break & retest on 1D swing.',
      lessonsLearned: 'Patience and clean execution deliver consistency.',
    },
  ], [usdToIdrRate]);

  // Active closed trades dataset (Live or Benchmark Simulation)
  const activeClosedTrades = useBenchmark ? benchmarkTrades : closedEntries;

  // Complete Performance Series for Equity Curve, Drawdown, and R-Multiple Progression
  const performanceSeries = useMemo(() => {
    const trades = [...activeClosedTrades].sort(
      (a, b) => (a.closedAt || a.openedAt) - (b.closedAt || b.openedAt)
    );
    if (trades.length === 0) return [];

    const baseEquity = 25000;
    let runningEquity = baseEquity;
    let cumulativePnl = 0;
    let highWatermark = baseEquity;
    let cumulativeR = 0;

    const points: Array<{
      index: number;
      id: string;
      symbol: string;
      direction: 'LONG' | 'SHORT';
      dateStr: string;
      time: number;
      tradePnl: number;
      tradePnlPercent: number;
      rMultiple: number;
      cumulativePnl: number;
      runningEquity: number;
      highWatermark: number;
      drawdownUsd: number;
      drawdownPercent: number;
      cumulativeR: number;
      emotion: string;
      emotionLabel: string;
      emoji: string;
      color: string;
      notes: string;
    }> = [];

    // Origin baseline point (Trade #0)
    const firstTradeTime = (trades[0].closedAt || trades[0].openedAt) - 3600000 * 12;
    points.push({
      index: 0,
      id: 'origin',
      symbol: 'START',
      direction: 'LONG',
      dateStr: 'Baseline',
      time: firstTradeTime,
      tradePnl: 0,
      tradePnlPercent: 0,
      rMultiple: 0,
      cumulativePnl: 0,
      runningEquity: baseEquity,
      highWatermark: baseEquity,
      drawdownUsd: 0,
      drawdownPercent: 0,
      cumulativeR: 0,
      emotion: 'CALM',
      emotionLabel: 'Starting Base',
      emoji: '🏁',
      color: 'var(--color-accent-primary)',
      notes: 'Starting capital watermark ($25,000 USD)',
    });

    trades.forEach((t, i) => {
      const pnl = Number(t.pnlUsd) || 0;
      const pnlPct = Number(t.pnlPercent) || 0;
      const r = Number(t.rMultiple) || 0;
      cumulativePnl += pnl;
      runningEquity += pnl;
      if (runningEquity > highWatermark) highWatermark = runningEquity;

      const ddUsd = Math.max(0, highWatermark - runningEquity);
      const ddPct = highWatermark > 0 ? (ddUsd / highWatermark) * 100 : 0;
      cumulativeR += r;

      const { emotion, label, emoji, color, notes } = parsePsychology(t.psychologicalState);
      const tTime = t.closedAt || t.openedAt;

      points.push({
        index: i + 1,
        id: t.id,
        symbol: t.symbol,
        direction: t.direction,
        dateStr: new Date(tTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        time: tTime,
        tradePnl: pnl,
        tradePnlPercent: pnlPct,
        rMultiple: r,
        cumulativePnl: parseFloat(cumulativePnl.toFixed(2)),
        runningEquity: parseFloat(runningEquity.toFixed(2)),
        highWatermark: parseFloat(highWatermark.toFixed(2)),
        drawdownUsd: parseFloat(ddUsd.toFixed(2)),
        drawdownPercent: parseFloat(ddPct.toFixed(2)),
        cumulativeR: parseFloat(cumulativeR.toFixed(2)),
        emotion,
        emotionLabel: label,
        emoji,
        color,
        notes: notes || t.lessonsLearned || '',
      });
    });

    return points;
  }, [activeClosedTrades]);

  // Quantitative Performance & Edge Metrics
  const quantMetrics = useMemo(() => {
    const trades = performanceSeries.filter((p) => p.index > 0);
    const totalCount = trades.length;
    if (totalCount === 0) {
      return {
        totalTrades: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        profitFactor: 0,
        totalPnlUsd: 0,
        cumR: 0,
        avgR: 0,
        maxDrawdownPercent: 0,
        maxDrawdownUsd: 0,
        currentDrawdownPercent: 0,
        avgWinUsd: 0,
        avgLossUsd: 0,
        payoffRatio: 0,
        expectancyUsd: 0,
        disciplineScore: 100,
        emotionalLeakUsd: 0,
        streakCount: 0,
        streakType: 'NONE' as 'WIN' | 'LOSS' | 'NONE',
        bestTradeUsd: 0,
        worstTradeUsd: 0,
      };
    }

    const wins = trades.filter((t) => t.tradePnl > 0);
    const losses = trades.filter((t) => t.tradePnl < 0);
    const winCount = wins.length;
    const lossCount = losses.length;
    const winRate = parseFloat(((winCount / totalCount) * 100).toFixed(1));

    const grossProfit = wins.reduce((s, t) => s + t.tradePnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.tradePnl, 0));
    const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.0 : 0;
    const totalPnlUsd = trades[trades.length - 1].cumulativePnl;
    const cumR = trades[trades.length - 1].cumulativeR;
    const avgR = parseFloat((cumR / totalCount).toFixed(2));

    const maxDrawdownPercent = parseFloat(Math.max(0, ...trades.map((t) => t.drawdownPercent)).toFixed(2));
    const maxDrawdownUsd = parseFloat(Math.max(0, ...trades.map((t) => t.drawdownUsd)).toFixed(2));
    const currentDrawdownPercent = trades[trades.length - 1].drawdownPercent;

    const avgWinUsd = winCount > 0 ? grossProfit / winCount : 0;
    const avgLossUsd = lossCount > 0 ? grossLoss / lossCount : 0;
    const payoffRatio = avgLossUsd > 0 ? parseFloat((avgWinUsd / avgLossUsd).toFixed(2)) : (avgWinUsd > 0 ? 99.0 : 0);

    const expectancyUsd = parseFloat(((winRate / 100) * avgWinUsd - ((100 - winRate) / 100) * avgLossUsd).toFixed(2));

    const calmTrades = trades.filter((t) => t.emotion === 'CALM');
    const emotionalTrades = trades.filter((t) => t.emotion !== 'CALM');
    const disciplineScore = parseFloat(((calmTrades.length / totalCount) * 100).toFixed(0));
    const emotionalLeakUsd = Math.abs(emotionalTrades.filter((t) => t.tradePnl < 0).reduce((s, t) => s + t.tradePnl, 0));

    // Calculate streak from end
    let streakCount = 0;
    let streakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';
    if (trades.length > 0) {
      const last = trades[trades.length - 1];
      streakType = last.tradePnl >= 0 ? 'WIN' : 'LOSS';
      for (let i = trades.length - 1; i >= 0; i--) {
        const isWin = trades[i].tradePnl >= 0;
        if ((streakType === 'WIN' && isWin) || (streakType === 'LOSS' && !isWin)) {
          streakCount++;
        } else {
          break;
        }
      }
    }

    const bestTradeUsd = Math.max(...trades.map((t) => t.tradePnl));
    const worstTradeUsd = Math.min(...trades.map((t) => t.tradePnl));

    return {
      totalTrades: totalCount,
      winCount,
      lossCount,
      winRate,
      profitFactor,
      totalPnlUsd,
      cumR,
      avgR,
      maxDrawdownPercent,
      maxDrawdownUsd,
      currentDrawdownPercent,
      avgWinUsd,
      avgLossUsd,
      payoffRatio,
      expectancyUsd,
      disciplineScore: Number(disciplineScore),
      emotionalLeakUsd,
      streakCount,
      streakType,
      bestTradeUsd,
      worstTradeUsd,
    };
  }, [performanceSeries]);

  // Deep Psychological Discipline Correlation (5 Emotions)
  const dynamicEmotionStats = useMemo(() => {
    const list = performanceSeries.filter((p) => p.index > 0);
    const stats: Record<string, { total: number; wins: number; pnlUsd: number; avgR: number }> = {
      CALM: { total: 0, wins: 0, pnlUsd: 0, avgR: 0 },
      FOMO: { total: 0, wins: 0, pnlUsd: 0, avgR: 0 },
      REVENGE: { total: 0, wins: 0, pnlUsd: 0, avgR: 0 },
      HESITANT: { total: 0, wins: 0, pnlUsd: 0, avgR: 0 },
      OVERCONFIDENT: { total: 0, wins: 0, pnlUsd: 0, avgR: 0 },
    };

    list.forEach((t) => {
      const em = t.emotion;
      if (!stats[em]) stats[em] = { total: 0, wins: 0, pnlUsd: 0, avgR: 0 };
      stats[em].total += 1;
      if (t.tradePnl > 0) stats[em].wins += 1;
      stats[em].pnlUsd += t.tradePnl;
      stats[em].avgR += t.rMultiple;
    });

    Object.keys(stats).forEach((k) => {
      if (stats[k].total > 0) {
        stats[k].avgR = parseFloat((stats[k].avgR / stats[k].total).toFixed(2));
      }
    });

    return stats;
  }, [performanceSeries]);

  // Filtered entries by tab, search, and emotion
  const displayedEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (activeTab === 'OPEN' && entry.status !== 'OPEN') return false;
      if (activeTab === 'CLOSED' && entry.status !== 'CLOSED') return false;
      if (searchFilter.trim() && !entry.symbol.toUpperCase().includes(searchFilter.trim().toUpperCase())) return false;
      if (emotionFilter !== 'ALL') {
        const { emotion } = parsePsychology(entry.psychologicalState);
        if (emotion !== emotionFilter) return false;
      }
      return true;
    });
  }, [entries, activeTab, searchFilter, emotionFilter]);

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
      await api.post(`/journal/entries/${closingEntry.id}/close`, {
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
      showToast('Failed to close transaction in journal');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  // Submit New Manual Trade
  const handleSubmitNewTrade = async () => {
    try {
      setIsSubmittingNew(true);
      await api.post('/journal/entries', {
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
      showToast('Failed to add position to journal');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trade entry from the journal?')) return;
    try {
      await api.delete(`/journal/entries/${id}`);
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

  // Interactive Chart Dimensions & Coordinate Scales
  const chartWidth = 920;
  const chartHeight = 220;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 35;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  // Extract active series based on selected chartMode
  const chartDataPoints = useMemo(() => {
    if (performanceSeries.length === 0) return [];
    return performanceSeries.map((p) => {
      let val = 0;
      if (chartMode === 'EQUITY') val = p.cumulativePnl;
      else if (chartMode === 'DRAWDOWN') val = -p.drawdownPercent; // negative value for underwater profile
      else if (chartMode === 'R_MULTIPLE') val = p.cumulativeR;
      else if (chartMode === 'DISTRIBUTION') val = p.tradePnl;
      return { ...p, chartValue: val };
    });
  }, [performanceSeries, chartMode]);

  // Coordinate scales calculations
  const values = chartDataPoints.map((d) => d.chartValue);
  const minVal = values.length > 0 ? Math.min(0, ...values) : 0;
  const maxVal = values.length > 0 ? Math.max(0, ...values) : 100;
  const valRange = maxVal - minVal || 1;

  const getX = (idx: number) => {
    if (chartDataPoints.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (idx / (chartDataPoints.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return padTop + plotHeight - ((val - minVal) / valRange) * plotHeight;
  };

  const zeroY = getY(0);

  // SVG Line & Fill Area Paths
  const chartLinePath = useMemo(() => {
    if (chartDataPoints.length === 0) return '';
    return chartDataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.chartValue).toFixed(1)}`).join(' ');
  }, [chartDataPoints, minVal, maxVal]);

  const chartAreaPath = useMemo(() => {
    if (chartDataPoints.length === 0) return '';
    const firstX = getX(0).toFixed(1);
    const lastX = getX(chartDataPoints.length - 1).toFixed(1);
    const baselineY = Math.min(chartHeight - padBottom, Math.max(padTop, zeroY)).toFixed(1);
    const linePath = chartDataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.chartValue).toFixed(1)}`).join(' ');
    return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }, [chartDataPoints, zeroY, minVal, maxVal]);

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (chartDataPoints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    let closestIdx = 0;
    let closestDist = Infinity;
    chartDataPoints.forEach((_, i) => {
      const dist = Math.abs(getX(i) - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });
    setHoveredPointIndex(closestIdx);
  };

  // Inspect target point (defaults to the latest trade if not hovering)
  const inspectedPoint = hoveredPointIndex !== null && chartDataPoints[hoveredPointIndex]
    ? chartDataPoints[hoveredPointIndex]
    : chartDataPoints.length > 0
    ? chartDataPoints[chartDataPoints.length - 1]
    : null;

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

      {/* Screenshot Lightbox Modal */}
      {previewImage && (
        <div
          className="modal-backdrop-animate"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            backdropFilter: 'blur(10px)',
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
                border: '1px solid rgba(255, 255, 255, 0.2)',
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
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
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
                      border: previewImage === s.url ? '2px solid var(--color-accent-primary)' : '1px solid rgba(255,255,255,0.2)',
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

      {/* Close Trade Modal with Quick-Exit Presets */}
      {closingEntry && (
        <div
          className="modal-backdrop-animate"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.88)',
            zIndex: 9990,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="modal-dialog-animate"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0a0a0c',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TokenIcon symbol={closingEntry.symbol} size={28} />
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.04em' }}>
                    EXECUTION RECONCILIATION
                  </span>
                  <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: '2px 0 0' }}>
                    Close Position: {closingEntry.symbol} ({closingEntry.direction})
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setClosingEntry(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>ENTRY PRICE</span>
                <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                  ${closingEntry.entryPrice.toLocaleString()}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>POSITION SIZE</span>
                <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                  {closingEntry.positionSize} Coins
                </span>
              </div>
            </div>

            {/* Quick Exit Preset Buttons */}
            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                ONE-CLICK EXIT PRESETS
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {closingEntry.takeProfitPrice && (
                  <button
                    id="btn-quick-tp"
                    type="button"
                    onClick={() => {
                      setExitPrice(closingEntry.takeProfitPrice || 0);
                      setExitReason('TP_HIT');
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(16, 185, 129, 0.08)',
                      color: 'var(--color-bullish)',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Hit TP (${closingEntry.takeProfitPrice})
                  </button>
                )}
                {closingEntry.stopLossPrice && (
                  <button
                    id="btn-quick-sl"
                    type="button"
                    onClick={() => {
                      setExitPrice(closingEntry.stopLossPrice || 0);
                      setExitReason('SL_HIT');
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      background: 'rgba(244, 63, 94, 0.08)',
                      color: 'var(--color-bearish)',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Hit SL (${closingEntry.stopLossPrice})
                  </button>
                )}
                <button
                  id="btn-quick-be"
                  type="button"
                  onClick={() => {
                    setExitPrice(closingEntry.entryPrice);
                    setExitReason('MANUAL_EXIT');
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Breakeven (${closingEntry.entryPrice})
                </button>
              </div>
            </div>

            {/* Exit Price Input */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                EXIT / CLOSING PRICE ($)
              </label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)}
                className="form-input mono"
                style={{ height: '36px', fontSize: '13px', fontWeight: 800, backgroundColor: 'rgba(255,255,255,0.03)' }}
              />
            </div>

            {/* Live PnL Preview Card */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: previewPnlUsd >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                border: `1px solid ${previewPnlUsd >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>
                  REALIZED P&L RESULT
                </span>
                <div style={{ marginTop: '2px' }}>
                  <DualCurrencyValue usd={previewPnlUsd} size="md" sentiment={previewPnlUsd >= 0 ? 'bullish' : 'bearish'} layout="row" />
                </div>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: previewPnlUsd >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)',
                }}
              >
                {previewPnlPercent > 0 ? '+' : ''}{previewPnlPercent.toFixed(2)}%
              </span>
            </div>

            {/* Exit Reason */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                EXIT REASON & RATIONALE
              </label>
              <select
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                className="form-input"
                style={{ height: '36px', fontSize: '12px', backgroundColor: '#111' }}
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
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                EVALUATION & POST-TRADE AUDIT
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="What went well? Did you stick to your plan without emotional interference?"
                style={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.03)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="btn btn-secondary" onClick={() => setClosingEntry(null)} style={{ height: '36px', fontSize: '12px' }}>
                Cancel
              </button>
              <button
                id="btn-confirm-close-trade"
                className="btn btn-primary"
                onClick={handleSubmitCloseTrade}
                disabled={isSubmittingClose}
                style={{ height: '36px', fontSize: '12px', fontWeight: 800, padding: '0 18px' }}
              >
                {isSubmittingClose ? 'Closing...' : 'Confirm Realize PnL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Trade Modal with Live TokenIcon & Direction Pill */}
      {showNewModal && (
        <div
          className="modal-backdrop-animate"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.88)',
            zIndex: 9990,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="modal-dialog-animate"
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: '#0a0a0c',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.04em' }}>
                  MANUAL EXECUTION LOG
                </span>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: '2px 0 0' }}>
                  Log New Trade Position
                </h2>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Symbol with Live TokenIcon & Direction */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  SYMBOL / TICKER
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
                    <TokenIcon symbol={newSymbol} size={20} />
                  </div>
                  <input
                    id="input-trade-symbol"
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
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
                    placeholder="SOLUSDT"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  DIRECTION
                </label>
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px',
                    height: '36px',
                  }}
                >
                  <button
                    id="btn-dir-long"
                    type="button"
                    onClick={() => setNewDirection('LONG')}
                    style={{
                      flex: 1,
                      borderRadius: 'var(--radius-xs)',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: newDirection === 'LONG' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                      color: newDirection === 'LONG' ? 'var(--color-bullish)' : 'var(--color-text-muted)',
                    }}
                  >
                    LONG
                  </button>
                  <button
                    id="btn-dir-short"
                    type="button"
                    onClick={() => setNewDirection('SHORT')}
                    style={{
                      flex: 1,
                      borderRadius: 'var(--radius-xs)',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: newDirection === 'SHORT' ? 'rgba(244, 63, 94, 0.25)' : 'transparent',
                      color: newDirection === 'SHORT' ? 'var(--color-bearish)' : 'var(--color-text-muted)',
                    }}
                  >
                    SHORT
                  </button>
                </div>
              </div>
            </div>

            {/* Entry Price & Position Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  ENTRY PRICE ($)
                </label>
                <input
                  id="input-entry-price"
                  type="number"
                  step="any"
                  value={newEntryPrice}
                  onChange={(e) => setNewEntryPrice(Number(e.target.value))}
                  className="form-input mono"
                  style={{ height: '36px', fontSize: '13px', fontWeight: 800, backgroundColor: 'rgba(255,255,255,0.03)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  POSITION SIZE (COINS)
                </label>
                <input
                  id="input-position-size"
                  type="number"
                  step="any"
                  value={newPositionSize}
                  onChange={(e) => setNewPositionSize(Number(e.target.value))}
                  className="form-input mono"
                  style={{ height: '36px', fontSize: '13px', fontWeight: 800, backgroundColor: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            {/* Stop Loss & Take Profit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-bearish)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  STOP LOSS ($)
                </label>
                <input
                  id="input-stop-loss"
                  type="number"
                  step="any"
                  value={newStopLoss}
                  onChange={(e) => setNewStopLoss(Number(e.target.value))}
                  className="form-input mono"
                  style={{ height: '36px', fontSize: '13px', fontWeight: 800, borderColor: 'rgba(244, 63, 94, 0.3)', backgroundColor: 'rgba(244, 63, 94, 0.04)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-bullish)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  TAKE PROFIT ($)
                </label>
                <input
                  id="input-take-profit"
                  type="number"
                  step="any"
                  value={newTakeProfit}
                  onChange={(e) => setNewTakeProfit(Number(e.target.value))}
                  className="form-input mono"
                  style={{ height: '36px', fontSize: '13px', fontWeight: 800, borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.04)' }}
                />
              </div>
            </div>

            {/* Entry Emotion & Psychology */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                ENTRY EMOTION & PSYCHOLOGICAL CONVICTION
              </label>
              <select
                id="select-psychology"
                value={newPsychology}
                onChange={(e) => setNewPsychology(e.target.value)}
                className="form-input"
                style={{ height: '36px', fontSize: '12px', backgroundColor: '#111' }}
              >
                <option value="CALM">😌 Calm & Following Trading Plan (Disciplined)</option>
                <option value="FOMO">⚡ Fear of Missing Out (FOMO / Impulsive)</option>
                <option value="REVENGE">🔥 Revenge Trading (Seeking Quick Recovery)</option>
                <option value="HESITANT">🤔 Hesitant / Low Conviction</option>
                <option value="OVERCONFIDENT">🚀 Overconfident / Aggressive</option>
              </select>
            </div>

            {/* Setup Notes */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                SETUP NOTES & TECHNICAL RATIONALE
              </label>
              <textarea
                id="textarea-setup-notes"
                className="form-textarea"
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Key technical triggers, multi-timeframe confirmation, macro catalyst..."
                style={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.03)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="btn btn-secondary" onClick={() => setShowNewModal(false)} style={{ height: '36px', fontSize: '12px' }}>
                Cancel
              </button>
              <button
                id="btn-save-trade"
                className="btn btn-primary"
                onClick={handleSubmitNewTrade}
                disabled={isSubmittingNew}
                style={{ height: '36px', fontSize: '12px', fontWeight: 800, padding: '0 18px' }}
              >
                {isSubmittingNew ? 'Saving...' : 'Save to Journal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header (Cardless Terminal Standard) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.06em' }}>
              EXECUTION LOG & PERFORMANCE ANALYTICS
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              POST-TRADE QUANTITATIVE AUDIT
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: '3px 0 0' }}>
            Trading Journal & Psychology
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
            Audit open positions, track realized portfolio P&L, monitor win rate & profit factor, and record trading psychology.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/pipeline')}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px', backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Compass size={14} />
            <span>Pipeline Lab</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/calculator')}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px', backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Calculator size={14} />
            <span>Position Sizer</span>
          </button>
          <button
            id="btn-nav-monte-carlo"
            className="btn btn-secondary"
            onClick={() => setChartMode('MONTE_CARLO')}
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
            <span>Monte Carlo Engine</span>
          </button>
          <button
            id="btn-log-manual-trade"
            className="btn btn-primary"
            onClick={() => setShowNewModal(true)}
            style={{ height: '34px', fontSize: '12px', padding: '0 14px', fontWeight: 800 }}
          >
            <Plus size={14} />
            <span>Log Manual Trade</span>
          </button>
        </div>
      </div>

      {/* Top Performance Cockpit (Cardless Hairline Strip) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          borderLeft: 'none',
          borderRight: 'none',
          backgroundColor: '#000000',
        }}
      >
        {/* KPI 1: Realized Net PnL */}
        <div style={{ padding: '16px 20px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
              REALIZED NET P&L
            </span>
            <span
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '3px',
                fontWeight: 800,
                backgroundColor: quantMetrics.totalPnlUsd >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: quantMetrics.totalPnlUsd >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)',
              }}
            >
              {quantMetrics.totalTrades} Closed ({quantMetrics.winCount}W - {quantMetrics.lossCount}L)
            </span>
          </div>
          <div style={{ marginTop: '3px' }}>
            <DualCurrencyValue
              usd={quantMetrics.totalPnlUsd}
              idr={quantMetrics.totalPnlUsd * (usdToIdrRate || 17956)}
              size="lg"
              sentiment={quantMetrics.totalPnlUsd >= 0 ? 'bullish' : 'bearish'}
            />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Total cumulative realized portfolio return
          </span>
        </div>

        {/* KPI 2: Win Rate & Profit Factor */}
        <div style={{ padding: '16px 20px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
              WIN RATE & FACTOR
            </span>
            <span
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '3px',
                fontWeight: 800,
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                color: 'var(--color-accent-primary)',
              }}
            >
              Payoff: {quantMetrics.payoffRatio}x
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '3px' }}>
            <span className="value-number" style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-accent-primary)' }}>
              {quantMetrics.winRate}%
            </span>
            <span className="value-number" style={{ fontSize: '13px', color: '#ffffff', fontWeight: 800 }}>
              {quantMetrics.profitFactor} PF
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px', display: 'flex' }}>
            <div style={{ width: `${quantMetrics.winRate}%`, height: '100%', backgroundColor: 'var(--color-accent-primary)' }} />
            <div style={{ width: `${100 - quantMetrics.winRate}%`, height: '100%', backgroundColor: 'rgba(244, 63, 94, 0.6)' }} />
          </div>
        </div>

        {/* KPI 3: Avg R-Multiple & Expectancy */}
        <div style={{ padding: '16px 20px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
              AVERAGE R-MULTIPLE
            </span>
            <span
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '3px',
                fontWeight: 800,
                backgroundColor: quantMetrics.cumR >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: quantMetrics.cumR >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)',
              }}
            >
              Cum {quantMetrics.cumR >= 0 ? '+' : ''}{quantMetrics.cumR} R
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '3px' }}>
            <span className={`value-number ${quantMetrics.avgR >= 0 ? 'bullish-text' : 'bearish-text'}`} style={{ fontSize: '26px', fontWeight: 900 }}>
              {quantMetrics.avgR >= 0 ? `+${quantMetrics.avgR} R` : `${quantMetrics.avgR} R`}
            </span>
            <span className="value-number" style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
              {quantMetrics.totalTrades > 0 ? `${quantMetrics.expectancyUsd >= 0 ? '+' : ''}$${quantMetrics.expectancyUsd.toFixed(0)} / trade` : '$0 / trade'}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Best: +${quantMetrics.bestTradeUsd.toLocaleString()} | Worst: -${Math.abs(quantMetrics.worstTradeUsd).toLocaleString()}
          </span>
        </div>

        {/* KPI 4: Max Drawdown & Discipline */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
              MAX DRAWDOWN & INTEGRITY
            </span>
            <span
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '3px',
                fontWeight: 800,
                backgroundColor: quantMetrics.streakType === 'WIN' ? 'rgba(16, 185, 129, 0.15)' : quantMetrics.streakType === 'LOSS' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.08)',
                color: quantMetrics.streakType === 'WIN' ? 'var(--color-bullish)' : quantMetrics.streakType === 'LOSS' ? 'var(--color-bearish)' : 'var(--color-text-muted)',
              }}
            >
              {quantMetrics.streakCount}{quantMetrics.streakType === 'WIN' ? 'W Streak 🔥' : quantMetrics.streakType === 'LOSS' ? 'L Streak ❄️' : ' Trades'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '3px' }}>
            <span className="value-number bearish-text" style={{ fontSize: '26px', fontWeight: 900 }}>
              -{quantMetrics.maxDrawdownPercent}%
            </span>
            <span className="value-number" style={{ fontSize: '13px', color: '#ffffff', fontWeight: 800 }}>
              {quantMetrics.disciplineScore}% Calm Plan
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Peak-to-trough: -${quantMetrics.maxDrawdownUsd.toLocaleString()} (Curr: -{quantMetrics.currentDrawdownPercent}%)
          </span>
        </div>
      </div>

      {/* Interactive Equity Trajectory & Drawdown Dynamics Console */}
      <div
        style={{
          backgroundColor: '#050507',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Console Header & Mode Switcher Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={16} color="var(--color-accent-primary)" />
            <div>
              <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 900, letterSpacing: '0.04em' }}>
                EQUITY TRAJECTORY & DRAWDOWN DYNAMICS
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                Trade-by-trade portfolio equity progression, underwater risk, and R-multiple velocity
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Multi-mode switcher tabs */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px',
                gap: '2px',
              }}
            >
              <button
                id="btn-mode-equity"
                type="button"
                onClick={() => setChartMode('EQUITY')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: chartMode === 'EQUITY' ? 'var(--color-accent-primary)' : 'transparent',
                  color: chartMode === 'EQUITY' ? '#08080a' : 'var(--color-text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                📈 Cumulative P&L ($)
              </button>
              <button
                id="btn-mode-drawdown"
                type="button"
                onClick={() => setChartMode('DRAWDOWN')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: chartMode === 'DRAWDOWN' ? 'rgba(244, 63, 94, 0.25)' : 'transparent',
                  color: chartMode === 'DRAWDOWN' ? 'var(--color-bearish)' : 'var(--color-text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                📉 Underwater DD (%)
              </button>
              <button
                id="btn-mode-rmultiple"
                type="button"
                onClick={() => setChartMode('R_MULTIPLE')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: chartMode === 'R_MULTIPLE' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: chartMode === 'R_MULTIPLE' ? '#60a5fa' : 'var(--color-text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                🎯 Cumulative R
              </button>
              <button
                id="btn-mode-distribution"
                type="button"
                onClick={() => setChartMode('DISTRIBUTION')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: chartMode === 'DISTRIBUTION' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                  color: chartMode === 'DISTRIBUTION' ? 'var(--color-bullish)' : 'var(--color-text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                📊 P&L Distribution
              </button>
              <button
                id="btn-mode-montecarlo"
                type="button"
                onClick={() => setChartMode('MONTE_CARLO')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: chartMode === 'MONTE_CARLO' ? 'var(--color-accent-primary)' : 'rgba(212, 175, 55, 0.1)',
                  color: chartMode === 'MONTE_CARLO' ? '#08080a' : 'var(--color-accent-primary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                🎲 Monte Carlo Ruin Engine
              </button>
            </div>

            {/* Benchmark vs Live toggle */}
            <button
              id="btn-toggle-benchmark"
              type="button"
              onClick={() => setUseBenchmark((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                border: useBenchmark ? '1px solid rgba(212, 175, 55, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: useBenchmark ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                color: useBenchmark ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {useBenchmark ? <Eye size={13} color="var(--color-accent-primary)" /> : <Zap size={13} />}
              <span>{useBenchmark ? '10-Trade Benchmark Simulation' : `Live Records (${closedEntries.length} Closed)`}</span>
            </button>
          </div>
        </div>

        {/* Conditional View: Monte Carlo Engine Studio vs Trajectory SVG Canvas */}
        {chartMode === 'MONTE_CARLO' ? (
          <div style={{ marginTop: '4px' }}>
            <MonteCarloEngine
              isEmbedded={true}
              initialWinRate={quantMetrics.totalTrades >= 3 ? Math.min(80, quantMetrics.winRate) : 60}
              initialPayoff={quantMetrics.totalTrades >= 3 && quantMetrics.payoffRatio < 10 ? quantMetrics.payoffRatio : 2.23}
              initialAccountSize={25000}
              initialRiskPercent={2.0}
              sourceLabel={useBenchmark ? 'Benchmark 10-Trade Edge' : quantMetrics.totalTrades >= 3 ? `Live Journal (${quantMetrics.totalTrades} Trades)` : 'Benchmark Baseline (Min 3 Trades)'}
            />
          </div>
        ) : (
          <>
            {/* SVG Interactive Canvas */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: `${chartHeight}px`,
            backgroundColor: '#000000',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            overflow: 'hidden',
          }}
        >
          <svg
            width="100%"
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            onMouseMove={handleSvgMouseMove}
            onMouseLeave={() => setHoveredPointIndex(null)}
            style={{ cursor: 'crosshair', display: 'block' }}
          >
            <defs>
              {/* Gradient for Equity Curve */}
              <linearGradient id="eqGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity="0.0" />
              </linearGradient>

              {/* Gradient for Drawdown Underwater */}
              <linearGradient id="ddGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(244, 63, 94, 0.0)" />
                <stop offset="100%" stopColor="rgba(244, 63, 94, 0.35)" />
              </linearGradient>

              {/* Gradient for Cumulative R */}
              <linearGradient id="rGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0.25, 0.5, 0.75].map((pct, gIdx) => {
              const yPos = padTop + plotHeight * pct;
              return (
                <line
                  key={`grid-${gIdx}`}
                  x1={padLeft}
                  y1={yPos}
                  x2={chartWidth - padRight}
                  y2={yPos}
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              );
            })}

            {/* Zero Baseline */}
            <line
              x1={padLeft}
              y1={zeroY}
              x2={chartWidth - padRight}
              y2={zeroY}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
            <text
              x={padLeft - 8}
              y={zeroY + 3}
              textAnchor="end"
              fill="rgba(255, 255, 255, 0.4)"
              fontSize="9"
              fontFamily="monospace"
            >
              0
            </text>

            {/* Top watermark value */}
            <text
              x={padLeft - 8}
              y={padTop + 4}
              textAnchor="end"
              fill="rgba(255, 255, 255, 0.5)"
              fontSize="9"
              fontFamily="monospace"
            >
              {chartMode === 'DRAWDOWN' ? '0%' : chartMode === 'R_MULTIPLE' ? `+${maxVal.toFixed(1)}R` : `+$${maxVal.toLocaleString()}`}
            </text>

            {/* Bottom watermark value */}
            <text
              x={padLeft - 8}
              y={padTop + plotHeight}
              textAnchor="end"
              fill="rgba(255, 255, 255, 0.5)"
              fontSize="9"
              fontFamily="monospace"
            >
              {chartMode === 'DRAWDOWN' ? `${minVal.toFixed(1)}%` : chartMode === 'R_MULTIPLE' ? `${minVal.toFixed(1)}R` : `${minVal >= 0 ? '+' : ''}$${minVal.toLocaleString()}`}
            </text>

            {/* Render Area & Path for continuous series */}
            {chartMode !== 'DISTRIBUTION' && chartAreaPath && (
              <polygon
                points={chartAreaPath.replace(/^[MLZ\s]+/, '').replace(/[MLZ\s]+$/, '')}
                fill={chartMode === 'DRAWDOWN' ? 'url(#ddGlow)' : chartMode === 'R_MULTIPLE' ? 'url(#rGlow)' : 'url(#eqGlow)'}
              />
            )}

            {chartMode !== 'DISTRIBUTION' && chartLinePath && (
              <path
                d={chartLinePath}
                fill="none"
                stroke={chartMode === 'DRAWDOWN' ? 'var(--color-bearish)' : chartMode === 'R_MULTIPLE' ? '#60a5fa' : 'var(--color-accent-primary)'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Render Bars for DISTRIBUTION mode */}
            {chartMode === 'DISTRIBUTION' &&
              chartDataPoints.map((d, i) => {
                if (i === 0) return null; // skip origin
                const x = getX(i);
                const barY = d.chartValue >= 0 ? getY(d.chartValue) : zeroY;
                const barH = Math.max(2, Math.abs(getY(d.chartValue) - zeroY));
                const barColor = d.chartValue >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)';
                const barW = Math.max(12, Math.min(32, plotWidth / (chartDataPoints.length * 1.5)));
                return (
                  <rect
                    key={`bar-${d.id}`}
                    x={x - barW / 2}
                    y={barY}
                    width={barW}
                    height={barH}
                    fill={barColor}
                    opacity={inspectedPoint?.id === d.id ? 1 : 0.75}
                    rx="2"
                  />
                );
              })}

            {/* Render Data Point Nodes (circles) */}
            {chartDataPoints.map((d, i) => {
              const x = getX(i);
              const y = getY(d.chartValue);
              const isInspected = inspectedPoint?.id === d.id;

              return (
                <g key={`point-${d.id}-${i}`}>
                  {/* Subtle date/trade label along bottom */}
                  {i > 0 && (
                    <text
                      x={x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      fill={isInspected ? '#ffffff' : 'rgba(255, 255, 255, 0.35)'}
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      #{d.index}
                    </text>
                  )}

                  {/* Circle Node */}
                  {chartMode !== 'DISTRIBUTION' && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isInspected ? 6 : i === 0 ? 3 : 4}
                      fill={i === 0 ? '#666' : d.color}
                      stroke={isInspected ? '#ffffff' : '#000000'}
                      strokeWidth={isInspected ? 2 : 1.5}
                      style={{ transition: 'r 0.15s ease' }}
                    />
                  )}
                </g>
              );
            })}

            {/* Crosshair Guideline when hovering */}
            {inspectedPoint && (
              <g>
                <line
                  x1={getX(inspectedPoint.index)}
                  y1={padTop}
                  x2={getX(inspectedPoint.index)}
                  y2={chartHeight - padBottom}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                {chartMode !== 'DISTRIBUTION' && (
                  <circle
                    cx={getX(inspectedPoint.index)}
                    cy={getY(inspectedPoint.chartValue)}
                    r={8}
                    fill="none"
                    stroke={inspectedPoint.color}
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Dynamic HUD Inspector Card */}
        {inspectedPoint && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: inspectedPoint.tradePnl >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                    color: inspectedPoint.tradePnl >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)',
                    border: `1px solid ${inspectedPoint.tradePnl >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                  }}
                >
                  {inspectedPoint.index === 0 ? 'BASELINE' : `TRADE #${inspectedPoint.index}: ${inspectedPoint.symbol} ${inspectedPoint.direction}`}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {inspectedPoint.dateStr}
                </span>
              </div>

              {inspectedPoint.index > 0 && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="mono" style={{ fontSize: '14px', fontWeight: 900, color: inspectedPoint.tradePnl >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                    {inspectedPoint.tradePnl >= 0 ? '+' : ''}${inspectedPoint.tradePnl.toLocaleString()} USD
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                    ({inspectedPoint.tradePnlPercent >= 0 ? '+' : ''}{inspectedPoint.tradePnlPercent}% • {inspectedPoint.rMultiple >= 0 ? '+' : ''}{inspectedPoint.rMultiple} R)
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  CUMULATIVE: <strong style={{ color: '#fff' }}>${inspectedPoint.cumulativePnl.toLocaleString()}</strong>
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  EQUITY: <strong style={{ color: 'var(--color-accent-primary)' }}>${inspectedPoint.runningEquity.toLocaleString()}</strong>
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  DRAWDOWN: <strong style={{ color: inspectedPoint.drawdownPercent > 0 ? 'var(--color-bearish)' : '#fff' }}>-{inspectedPoint.drawdownPercent}%</strong>
                </span>
              </div>

              {inspectedPoint.index > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${inspectedPoint.color}40`,
                  }}
                >
                  <span style={{ fontSize: '12px' }}>{inspectedPoint.emoji}</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: inspectedPoint.color }}>
                    {inspectedPoint.emotionLabel}
                  </span>
                  {inspectedPoint.notes && (
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      — "{inspectedPoint.notes}"
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4 Secondary Quant Metrics Dock */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '10px',
          }}
        >
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-xs)' }}>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 800, display: 'block' }}>
              PEAK DRAWDOWN (MDD)
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span className="mono bearish-text" style={{ fontSize: '14px', fontWeight: 900 }}>
                -{quantMetrics.maxDrawdownPercent}%
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                (-${quantMetrics.maxDrawdownUsd.toLocaleString()})
              </span>
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-xs)' }}>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 800, display: 'block' }}>
              PAYOFF RATIO (WIN / LOSS)
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span className="mono" style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff' }}>
                {quantMetrics.payoffRatio}x
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                Avg Win ${Math.round(quantMetrics.avgWinUsd)} : Loss ${Math.round(quantMetrics.avgLossUsd)}
              </span>
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-xs)' }}>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 800, display: 'block' }}>
              MATHEMATICAL EXPECTANCY
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span className={`mono ${quantMetrics.expectancyUsd >= 0 ? 'bullish-text' : 'bearish-text'}`} style={{ fontSize: '14px', fontWeight: 900 }}>
                {quantMetrics.expectancyUsd >= 0 ? '+' : ''}${quantMetrics.expectancyUsd}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                USD expected per trade
              </span>
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-xs)' }}>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 800, display: 'block' }}>
              DISCIPLINE INTEGRITY SCORE
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span className="mono" style={{ fontSize: '14px', fontWeight: 900, color: 'var(--color-bullish)' }}>
                {quantMetrics.disciplineScore}%
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                {quantMetrics.disciplineScore >= 80 ? 'Elite Plan Compliance' : 'Emotional Leak Warning'}
              </span>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Psychological Discipline Matrix & Emotional Leak Audit */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#000000',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={16} color="#8b5cf6" />
            <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 900, letterSpacing: '0.04em' }}>
              PSYCHOLOGICAL DISCIPLINE MATRIX & EMOTIONAL LEAK AUDIT
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
            Behavioral performance correlation derived from post-trade psychology tags
          </span>
        </div>

        {/* 5 Emotion Behavioral Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {/* Calm & Planned */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--color-bullish)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                😌 Calm & Planned
              </span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--color-bullish)', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                {dynamicEmotionStats.CALM.total > 0 ? `${Math.round((dynamicEmotionStats.CALM.wins / dynamicEmotionStats.CALM.total) * 100)}% WR` : 'NO DATA'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{dynamicEmotionStats.CALM.total} Trades</span>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 900, color: dynamicEmotionStats.CALM.pnlUsd >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                {dynamicEmotionStats.CALM.pnlUsd >= 0 ? '+' : ''}${dynamicEmotionStats.CALM.pnlUsd.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '9px', color: 'var(--color-text-secondary)' }}>
              <span>Average Risk Yield:</span>
              <strong style={{ color: 'var(--color-bullish)' }}>{dynamicEmotionStats.CALM.avgR >= 0 ? `+${dynamicEmotionStats.CALM.avgR} R` : `${dynamicEmotionStats.CALM.avgR} R`}</strong>
            </div>
          </div>

          {/* FOMO / Impulsive */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚡ FOMO / Impulsive
              </span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                {dynamicEmotionStats.FOMO.total > 0 ? `${Math.round((dynamicEmotionStats.FOMO.wins / dynamicEmotionStats.FOMO.total) * 100)}% WR` : 'NO DATA'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{dynamicEmotionStats.FOMO.total} Trades</span>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 900, color: dynamicEmotionStats.FOMO.pnlUsd >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                {dynamicEmotionStats.FOMO.pnlUsd >= 0 ? '+' : ''}${dynamicEmotionStats.FOMO.pnlUsd.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '9px', color: 'var(--color-text-secondary)' }}>
              <span>Average Risk Yield:</span>
              <strong style={{ color: dynamicEmotionStats.FOMO.avgR >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                {dynamicEmotionStats.FOMO.avgR >= 0 ? `+${dynamicEmotionStats.FOMO.avgR} R` : `${dynamicEmotionStats.FOMO.avgR} R`}
              </strong>
            </div>
          </div>

          {/* Revenge Trading */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(244, 63, 94, 0.05)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--color-bearish)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🔥 Revenge / Tilting
              </span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--color-bearish)', background: 'rgba(244, 63, 94, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                {dynamicEmotionStats.REVENGE.total > 0 ? `${Math.round((dynamicEmotionStats.REVENGE.wins / dynamicEmotionStats.REVENGE.total) * 100)}% WR` : 'NO DATA'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{dynamicEmotionStats.REVENGE.total} Trades</span>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 900, color: dynamicEmotionStats.REVENGE.pnlUsd >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                {dynamicEmotionStats.REVENGE.pnlUsd >= 0 ? '+' : ''}${dynamicEmotionStats.REVENGE.pnlUsd.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '9px', color: 'var(--color-text-secondary)' }}>
              <span>Average Risk Yield:</span>
              <strong style={{ color: dynamicEmotionStats.REVENGE.avgR >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                {dynamicEmotionStats.REVENGE.avgR >= 0 ? `+${dynamicEmotionStats.REVENGE.avgR} R` : `${dynamicEmotionStats.REVENGE.avgR} R`}
              </strong>
            </div>
          </div>

          {/* Hesitant / Low Conviction */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(139, 92, 246, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🤔 Hesitant / Low Conviction
              </span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                {dynamicEmotionStats.HESITANT.total > 0 ? `${Math.round((dynamicEmotionStats.HESITANT.wins / dynamicEmotionStats.HESITANT.total) * 100)}% WR` : 'NO DATA'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{dynamicEmotionStats.HESITANT.total} Trades</span>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 900, color: dynamicEmotionStats.HESITANT.pnlUsd >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                {dynamicEmotionStats.HESITANT.pnlUsd >= 0 ? '+' : ''}${dynamicEmotionStats.HESITANT.pnlUsd.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '9px', color: 'var(--color-text-secondary)' }}>
              <span>Average Risk Yield:</span>
              <strong style={{ color: dynamicEmotionStats.HESITANT.avgR >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                {dynamicEmotionStats.HESITANT.avgR >= 0 ? `+${dynamicEmotionStats.HESITANT.avgR} R` : `${dynamicEmotionStats.HESITANT.avgR} R`}
              </strong>
            </div>
          </div>

          {/* Overconfident / Aggressive */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(236, 72, 153, 0.05)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🚀 Overconfident
              </span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#ec4899', background: 'rgba(236, 72, 153, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                {dynamicEmotionStats.OVERCONFIDENT.total > 0 ? `${Math.round((dynamicEmotionStats.OVERCONFIDENT.wins / dynamicEmotionStats.OVERCONFIDENT.total) * 100)}% WR` : 'NO DATA'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{dynamicEmotionStats.OVERCONFIDENT.total} Trades</span>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 900, color: dynamicEmotionStats.OVERCONFIDENT.pnlUsd >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                {dynamicEmotionStats.OVERCONFIDENT.pnlUsd >= 0 ? '+' : ''}${dynamicEmotionStats.OVERCONFIDENT.pnlUsd.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '9px', color: 'var(--color-text-secondary)' }}>
              <span>Average Risk Yield:</span>
              <strong style={{ color: dynamicEmotionStats.OVERCONFIDENT.avgR >= 0 ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                {dynamicEmotionStats.OVERCONFIDENT.avgR >= 0 ? `+${dynamicEmotionStats.OVERCONFIDENT.avgR} R` : `${dynamicEmotionStats.OVERCONFIDENT.avgR} R`}
              </strong>
            </div>
          </div>
        </div>

        {/* Emotional Leak Callout Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: quantMetrics.emotionalLeakUsd > 0 ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${quantMetrics.emotionalLeakUsd > 0 ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {quantMetrics.emotionalLeakUsd > 0 ? (
              <AlertTriangle size={15} color="var(--color-bearish)" />
            ) : (
              <ShieldCheck size={15} color="var(--color-bullish)" />
            )}
            <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 700 }}>
              {quantMetrics.emotionalLeakUsd > 0 ? (
                <>
                  <strong style={{ color: 'var(--color-bearish)' }}>Emotional Capital Leak Detected:</strong> You gave back{' '}
                  <strong className="mono" style={{ color: 'var(--color-bearish)' }}>
                    -${quantMetrics.emotionalLeakUsd.toLocaleString()} USD
                  </strong>{' '}
                  on trades taken under FOMO, Revenge, or Overconfidence.
                </>
              ) : (
                <>
                  <strong style={{ color: 'var(--color-bullish)' }}>Zero Emotional Capital Leak:</strong> 100% of realized positions adhered strictly to calm, calculated trading rules.
                </>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Discipline Alpha:</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 900,
                color: dynamicEmotionStats.CALM.avgR >= 0 ? 'var(--color-bullish)' : 'var(--color-text-muted)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                padding: '2px 8px',
                borderRadius: '3px',
              }}
            >
              Calm Avg {dynamicEmotionStats.CALM.avgR >= 0 ? `+${dynamicEmotionStats.CALM.avgR}R` : `${dynamicEmotionStats.CALM.avgR}R`}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-sm)', padding: '3px', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('OPEN')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'OPEN' ? 'var(--color-accent-primary)' : 'transparent',
              color: activeTab === 'OPEN' ? '#08080a' : 'var(--color-text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            OPEN POSITIONS ({openEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CLOSED')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'CLOSED' ? 'var(--color-accent-primary)' : 'transparent',
              color: activeTab === 'CLOSED' ? '#08080a' : 'var(--color-text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            CLOSED HISTORY ({closedEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'ALL' ? 'var(--color-accent-primary)' : 'transparent',
              color: activeTab === 'ALL' ? '#08080a' : 'var(--color-text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            ALL RECORDS ({entries.length})
          </button>
        </div>

        {/* Search Ticker & Emotion Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={emotionFilter}
            onChange={(e) => setEmotionFilter(e.target.value)}
            style={{
              height: '32px',
              fontSize: '11px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-xs)',
              color: '#fff',
              padding: '0 8px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Psychological States</option>
            <option value="CALM">😌 Calm & Planned Only</option>
            <option value="FOMO">⚡ FOMO Only</option>
            <option value="REVENGE">🔥 Revenge Only</option>
          </select>

          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search symbol..."
              className="mono"
              style={{
                width: '160px',
                height: '32px',
                fontSize: '11px',
                paddingLeft: '30px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-xs)',
                color: '#fff',
                outline: 'none',
              }}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {openEntries.map((trade) => {
              const currentPrice = trade.takeProfitPrice ? (trade.entryPrice + trade.takeProfitPrice) / 2 : trade.entryPrice * 1.02;
              const unrealizedPnlUsd =
                trade.direction === 'LONG'
                  ? (currentPrice - trade.entryPrice) * trade.positionSize
                  : (trade.entryPrice - currentPrice) * trade.positionSize;

              const slDist = Math.abs(trade.entryPrice - trade.stopLossPrice);
              const slDistPercent = trade.entryPrice > 0 ? (slDist / trade.entryPrice) * 100 : 0;
              const tpDist = trade.takeProfitPrice ? Math.abs(trade.takeProfitPrice - trade.entryPrice) : 0;
              const tpDistPercent = trade.entryPrice > 0 ? (tpDist / trade.entryPrice) * 100 : 0;
              const { emoji, label } = parsePsychology(trade.psychologicalState);

              return (
                <div
                  key={trade.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderLeft: `3px solid ${trade.direction === 'LONG' ? 'var(--color-bullish)' : 'var(--color-bearish)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 18px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TokenIcon symbol={trade.symbol} size={32} />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="mono" style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>
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
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          {emoji} {label}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Opened: {new Date(trade.openedAt).toLocaleDateString()} {new Date(trade.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Target Track Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>ENTRY</span>
                      <div className="mono" style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>
                        ${trade.entryPrice.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--color-bearish)', display: 'block', fontWeight: 700 }}>
                        STOP LOSS (-{slDistPercent.toFixed(1)}%)
                      </span>
                      <div className="mono bearish-text" style={{ fontWeight: 800, fontSize: '13px' }}>
                        ${trade.stopLossPrice.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--color-bullish)', display: 'block', fontWeight: 700 }}>
                        TARGET TP (+{tpDistPercent.toFixed(1)}%)
                      </span>
                      <div className="mono bullish-text" style={{ fontWeight: 800, fontSize: '13px' }}>
                        ${trade.takeProfitPrice ? trade.takeProfitPrice.toLocaleString() : '-'}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>LOT SIZE</span>
                      <div className="mono" style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>
                        {trade.positionSize} Coins
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>EST. FLOATING PNL</span>
                      <DualCurrencyValue usd={unrealizedPnlUsd} layout="row" sentiment={unrealizedPnlUsd >= 0 ? 'bullish' : 'bearish'} size="sm" />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {trade.ideaId && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleViewScreenshots(trade)}
                        title="View Chart Evidence Vault"
                        style={{ height: '34px', padding: '0 10px', backgroundColor: 'rgba(255,255,255,0.04)' }}
                      >
                        <ImageIcon size={14} />
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      data-testid="btn-close-position"
                      onClick={() => handleOpenCloseModal(trade)}
                      style={{ height: '34px', fontSize: '11px', fontWeight: 800, padding: '0 14px' }}
                    >
                      <CheckCircle size={14} />
                      <span>Close Position</span>
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDeleteEntry(trade.id)}
                      title="Delete Entry"
                      style={{ height: '34px', padding: '0 8px', color: 'var(--color-bearish)', backgroundColor: 'rgba(255,255,255,0.04)' }}
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
        <div
          style={{
            textAlign: 'center',
            padding: '54px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.015)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <Layers size={38} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: 0 }}>No Open Positions Running</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '6px auto 18px' }}>
            Dispatch mature setups from the Pipeline Incubator or click below to log an active execution manually.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/pipeline')} style={{ height: '36px', fontSize: '12px' }}>
              <Compass size={14} />
              <span>Open Pipeline Incubator</span>
            </button>
            <button className="btn btn-primary" onClick={() => setShowNewModal(true)} style={{ height: '36px', fontSize: '12px', fontWeight: 800 }}>
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
            <div
              style={{
                textAlign: 'center',
                padding: '54px 24px',
                backgroundColor: 'rgba(255, 255, 255, 0.015)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <BookOpen size={38} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: 0 }}>No Closed Trades Recorded</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
                Positions you close are automatically recorded here with quantitative R-Multiple metrics, psychological state, and realized P&L audit.
              </p>
            </div>
          ) : (
            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                overflowX: 'auto',
                backgroundColor: '#000000',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em' }}>
                      ASSET & DIRECTION
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em' }}>
                      ENTRY ➔ EXIT
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em' }}>
                      R-MULTIPLE
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em' }}>
                      REALIZED P&L
                    </th>
                    <th style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em' }}>
                      PSYCHOLOGY & EVALUATION
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em' }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedEntries
                    .filter((e) => activeTab === 'ALL' || e.status === 'CLOSED')
                    .map((trade) => {
                      const { emoji, label, color, notes } = parsePsychology(trade.psychologicalState);
                      return (
                        <tr
                          key={trade.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TokenIcon symbol={trade.symbol} size={22} />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className="mono" style={{ fontWeight: 900, color: '#fff', fontSize: '13px' }}>
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
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                  {trade.closedAt ? new Date(trade.closedAt).toLocaleDateString() : '-'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div className="mono" style={{ color: '#fff', fontWeight: 800, fontSize: '12px' }}>
                              ${trade.entryPrice.toLocaleString()} &rarr; ${(trade.exitPrice || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {trade.positionSize} Coins
                            </div>
                          </td>

                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <span
                              className="mono"
                              style={{
                                fontWeight: 900,
                                fontSize: '13px',
                                color: (trade.rMultiple || 0) >= 0 ? 'var(--color-accent-primary)' : 'var(--color-bearish)',
                              }}
                            >
                              {(trade.rMultiple || 0) >= 0 ? '+' : ''}{trade.rMultiple || 0} R
                            </span>
                          </td>

                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <DualCurrencyValue
                              usd={trade.pnlUsd || 0}
                              idr={trade.pnlIdr || 0}
                              layout="row"
                              size="sm"
                              sentiment={(trade.pnlUsd || 0) >= 0 ? 'bullish' : 'bearish'}
                            />
                          </td>

                          <td style={{ padding: '12px 16px', maxWidth: '340px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  color: color,
                                  border: `1px solid ${color}40`,
                                }}
                              >
                                {emoji} {label}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {trade.lessonsLearned || notes || '-'}
                            </div>
                          </td>

                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              {trade.ideaId && (
                                <button
                                  onClick={() => handleViewScreenshots(trade)}
                                  style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', cursor: 'pointer', padding: '4px' }}
                                  title="View Chart Evidence"
                                >
                                  <ImageIcon size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteEntry(trade.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-bearish)', cursor: 'pointer', padding: '4px' }}
                                title="Delete Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
