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
  PieChart,
  Copy,
  Target,
  Lock,
  Unlock,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettingsStore } from '../store/settings.store';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';
import { TokenIcon } from '../components/common/TokenIcon';
import { ExchangeIcon } from '../components/common/ExchangeIcon';
import { InteractiveDonutChart, DonutSegment } from '../components/portfolio/InteractiveDonutChart';

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

interface CategoryTargets {
  btc: number;
  cash: number;
  altcoins: number;
}

const DEFAULT_CATEGORY_TARGETS: CategoryTargets = {
  btc: 50,
  cash: 20,
  altcoins: 30,
};

// Asset Categorization Helpers
export const isBtc = (sym: string): boolean => {
  const s = (sym || '').toUpperCase().trim();
  return s === 'BTC' || s === 'WBTC' || s === 'BTCB';
};

export const isCash = (sym: string): boolean => {
  const s = (sym || '').toUpperCase().trim();
  return ['USDT', 'USDC', 'DAI', 'FDUSD', 'USDE', 'TUSD', 'BUSD', 'IDR', 'USD', 'PYUSD', 'FRAX', 'GUSD', 'EUR'].includes(s);
};

export const getCategory = (sym: string): 'BTC' | 'CASH' | 'ALTCOINS' => {
  if (isBtc(sym)) return 'BTC';
  if (isCash(sym)) return 'CASH';
  return 'ALTCOINS';
};

export const RebalancingPage: React.FC = () => {
  const navigate = useNavigate();
  const { usdToIdrRate } = useSettingsStore();

  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [hideDust, setHideDust] = useState<boolean>(true);

  // Category Target State (persisted in localStorage)
  const [categoryTargets, setCategoryTargets] = useState<CategoryTargets>(() => {
    try {
      const saved = localStorage.getItem('cryptoos_rebalance_category_targets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CATEGORY_TARGETS;
  });

  // Table filter tab: 'ALL' | 'BTC' | 'CASH' | 'ALTCOINS'
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'ALL' | 'BTC' | 'CASH' | 'ALTCOINS'>('ALL');

  // Time-based cycle
  const [cycleDays] = useState<number>(60); // 60 days
  const [daysRemaining, setDaysRemaining] = useState<number>(24);

  // Target Editor Modal
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [tempCategoryTargets, setTempCategoryTargets] = useState<CategoryTargets>(categoryTargets);
  const [activeCategory, setActiveCategory] = useState<'btc' | 'cash' | 'altcoins'>('btc');
  const [hoveredWheelCat, setHoveredWheelCat] = useState<'btc' | 'cash' | 'altcoins' | null>(null);
  const [lockedCategories, setLockedCategories] = useState<{ btc: boolean; cash: boolean; altcoins: boolean }>({
    btc: false,
    cash: false,
    altcoins: false,
  });
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [isSavingTargets, setIsSavingTargets] = useState(false);
  const [showGranularTargets, setShowGranularTargets] = useState(false);

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
          initTargets[h.id] = h.targetPercent || 0;
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

  // Sync temp targets when opening modal
  useEffect(() => {
    if (showTargetModal) {
      setTempCategoryTargets(categoryTargets);
    }
  }, [showTargetModal, categoryTargets]);

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
      category: 'BTC' | 'CASH' | 'ALTCOINS';
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
          targetPercent: 0,
          deviationPercent: 0,
          category: getCategory(h.symbol),
          holdings: [],
        };
      }
      aggregatedBySymbol[h.symbol].totalAmount += h.amount;
      aggregatedBySymbol[h.symbol].currentValueUsd += h.currentValueUsd;
      aggregatedBySymbol[h.symbol].targetPercent = Math.max(
        aggregatedBySymbol[h.symbol].targetPercent,
        h.targetPercent || 0
      );
      aggregatedBySymbol[h.symbol].holdings.push(h);
    }

    for (const sym of Object.keys(aggregatedBySymbol)) {
      const item = aggregatedBySymbol[sym];
      item.actualPercent = parseFloat(((item.currentValueUsd / totalNetWorth) * 100).toFixed(1));
      item.deviationPercent = parseFloat((item.actualPercent - item.targetPercent).toFixed(1));
    }
  }

  const assetList = Object.values(aggregatedBySymbol);

  // --- CATEGORY LEVEL CALCULATIONS ---
  let btcValueUsd = 0;
  let cashValueUsd = 0;
  let altcoinsValueUsd = 0;

  for (const asset of assetList) {
    if (asset.category === 'BTC') {
      btcValueUsd += asset.currentValueUsd;
    } else if (asset.category === 'CASH') {
      cashValueUsd += asset.currentValueUsd;
    } else {
      altcoinsValueUsd += asset.currentValueUsd;
    }
  }

  const totalPortfolioUsd = summary?.totalNetWorthUsd || (btcValueUsd + cashValueUsd + altcoinsValueUsd) || 1;

  const btcActualPercent = parseFloat(((btcValueUsd / totalPortfolioUsd) * 100).toFixed(1));
  const cashActualPercent = parseFloat(((cashValueUsd / totalPortfolioUsd) * 100).toFixed(1));
  const altcoinsActualPercent = parseFloat(((altcoinsValueUsd / totalPortfolioUsd) * 100).toFixed(1));

  // Category Target USD values
  const btcTargetUsd = totalPortfolioUsd * (categoryTargets.btc / 100);
  const cashTargetUsd = totalPortfolioUsd * (categoryTargets.cash / 100);
  const altcoinsTargetUsd = totalPortfolioUsd * (categoryTargets.altcoins / 100);

  // Category Drift
  const btcDiffUsd = btcValueUsd - btcTargetUsd;
  const cashDiffUsd = cashValueUsd - cashTargetUsd;
  const altcoinsDiffUsd = altcoinsValueUsd - altcoinsTargetUsd;

  const btcDeviation = parseFloat((btcActualPercent - categoryTargets.btc).toFixed(1));
  const cashDeviation = parseFloat((cashActualPercent - categoryTargets.cash).toFixed(1));
  const altcoinsDeviation = parseFloat((altcoinsActualPercent - categoryTargets.altcoins).toFixed(1));

  const totalCategoryTargetSum = categoryTargets.btc + categoryTargets.cash + categoryTargets.altcoins;

  // Donut Segments for Chart 1: Actual Allocation (Current)
  // Donut Segments for Chart 1: Actual Allocation (Current)
  const actualCategorySegments: DonutSegment[] = [
    {
      id: 'BTC',
      label: 'Bitcoin (BTC)',
      subLabel: `${btcActualPercent}% • $${btcValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      valueUsd: btcValueUsd,
      valueIdr: Math.round(btcValueUsd * usdToIdrRate),
      percent: btcActualPercent,
      color: '#F7931A', // Signature Bitcoin Gold
      icon: <TokenIcon symbol="BTC" size={18} />,
    },
    {
      id: 'CASH',
      label: 'Cash (USDT/USDC)',
      subLabel: `${cashActualPercent}% • $${cashValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      valueUsd: cashValueUsd,
      valueIdr: Math.round(cashValueUsd * usdToIdrRate),
      percent: cashActualPercent,
      color: '#30D158', // Signature Cash/Liquidity Green
      icon: <TokenIcon symbol="USDT" size={18} />,
    },
    {
      id: 'ALTCOINS',
      label: 'Altcoins (Alpha)',
      subLabel: `${altcoinsActualPercent}% • $${altcoinsValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      valueUsd: altcoinsValueUsd,
      valueIdr: Math.round(altcoinsValueUsd * usdToIdrRate),
      percent: altcoinsActualPercent,
      color: '#AF52DE', // Signature Altcoin Purple
      icon: <Sparkles size={16} color="#AF52DE" />,
    },
  ];

  // Donut Segments for Chart 2: Target Model Allocation (Ideal)
  const targetCategorySegments: DonutSegment[] = [
    {
      id: 'BTC',
      label: 'Bitcoin Target',
      subLabel: `Target ${categoryTargets.btc}% • $${btcTargetUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      valueUsd: btcTargetUsd,
      valueIdr: Math.round(btcTargetUsd * usdToIdrRate),
      percent: categoryTargets.btc,
      color: '#F7931A',
      icon: <TokenIcon symbol="BTC" size={18} />,
    },
    {
      id: 'CASH',
      label: 'Cash Target',
      subLabel: `Target ${categoryTargets.cash}% • $${cashTargetUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      valueUsd: cashTargetUsd,
      valueIdr: Math.round(cashTargetUsd * usdToIdrRate),
      percent: categoryTargets.cash,
      color: '#30D158',
      icon: <TokenIcon symbol="USDT" size={18} />,
    },
    {
      id: 'ALTCOINS',
      label: 'Altcoins Target',
      subLabel: `Target ${categoryTargets.altcoins}% • $${altcoinsTargetUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      valueUsd: altcoinsTargetUsd,
      valueIdr: Math.round(altcoinsTargetUsd * usdToIdrRate),
      percent: categoryTargets.altcoins,
      color: '#AF52DE',
      icon: <Sparkles size={16} color="#AF52DE" />,
    },
  ];

  // Category Level Rebalancing Action Signals
  const topAltcoins = assetList
    .filter((a) => a.category === 'ALTCOINS' && a.currentValueUsd >= 5)
    .sort((a, b) => b.currentValueUsd - a.currentValueUsd)
    .slice(0, 3);

  const categoryRecommendations = [
    {
      category: 'BTC' as const,
      label: 'Bitcoin (BTC)',
      action: btcDiffUsd > 25 && btcDeviation >= 1.5 ? 'TRIM' : btcDiffUsd < -25 && btcDeviation <= -1.5 ? 'ACCUMULATE' : 'BALANCED',
      diffUsd: Math.abs(btcDiffUsd),
      deviationPercent: btcDeviation,
      actualPercent: btcActualPercent,
      targetPercent: categoryTargets.btc,
      color: '#F7931A',
      explanation: btcDiffUsd < -25
        ? `${Math.abs(btcDeviation)}% allocation deficit. Accumulate +$${Math.abs(btcDiffUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })} (~${(Math.abs(btcDiffUsd) / (assetList.find((a) => isBtc(a.symbol))?.currentPriceUsd || 80000)).toFixed(3)} BTC) to anchor portfolio baseline.`
        : btcDiffUsd > 25
        ? `+${btcDeviation}% surplus. Trim $${btcDiffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} and rotate into Cash reserves.`
        : 'Within target allocation tolerance range.',
    },
    {
      category: 'CASH' as const,
      label: 'Cash (USDT/USDC)',
      action: cashDiffUsd > 25 && cashDeviation >= 1.5 ? 'TRIM' : cashDiffUsd < -25 && cashDeviation <= -1.5 ? 'ACCUMULATE' : 'BALANCED',
      diffUsd: Math.abs(cashDiffUsd),
      deviationPercent: cashDeviation,
      actualPercent: cashActualPercent,
      targetPercent: categoryTargets.cash,
      color: '#30D158',
      explanation: cashDiffUsd < -25
        ? `Liquidity reserve is short ${Math.abs(cashDeviation)}%. Secure +$${Math.abs(cashDiffUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })} into USDT/USDC as dry powder.`
        : cashDiffUsd > 25
        ? `Cash drag surplus (+${cashDeviation}%). Deploy $${cashDiffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} into BTC / high-conviction assets.`
        : 'Liquidity reserve is optimal and balanced.',
    },
    {
      category: 'ALTCOINS' as const,
      label: 'Altcoins (Alpha)',
      action: altcoinsDiffUsd > 25 && altcoinsDeviation >= 1.5 ? 'TRIM' : altcoinsDiffUsd < -25 && altcoinsDeviation <= -1.5 ? 'ACCUMULATE' : 'BALANCED',
      diffUsd: Math.abs(altcoinsDiffUsd),
      deviationPercent: altcoinsDeviation,
      actualPercent: altcoinsActualPercent,
      targetPercent: categoryTargets.altcoins,
      color: '#AF52DE',
      explanation: altcoinsDiffUsd > 25
        ? `Over-leveraged altcoin exposure (+${altcoinsDeviation}%). Harvest -$${altcoinsDiffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} profit from top coins (${topAltcoins.map((a) => a.symbol).join(', ') || 'holdings'}) and rotate into BTC / Cash.`
        : altcoinsDiffUsd < -25
        ? `Allocation deficit of ${Math.abs(altcoinsDeviation)}%. Accumulate +$${Math.abs(altcoinsDiffUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })} into high-alpha assets.`
        : 'Altcoin exposure is within calibrated risk boundaries.',
      topAssets: topAltcoins,
    },
  ];

  // Self-Funding Cashflow Calculation
  const totalCategoryTrimUsd = categoryRecommendations
    .filter((r) => r.action === 'TRIM')
    .reduce((sum, r) => sum + r.diffUsd, 0);

  const totalCategoryAccumulateUsd = categoryRecommendations
    .filter((r) => r.action === 'ACCUMULATE')
    .reduce((sum, r) => sum + r.diffUsd, 0);

  const netCategoryDifference = totalCategoryTrimUsd - totalCategoryAccumulateUsd;

  const handleCopyPlan = () => {
    let text = `CRYPTOOS MACRO REBALANCING EXECUTION PLAN\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `Total Portfolio Net Worth: $${totalPortfolioUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n\n`;

    text += `[TARGET STRATEGY ALLOCATION]\n`;
    text += `• Bitcoin (BTC): Target ${categoryTargets.btc}% (Actual: ${btcActualPercent}% | Drift: ${btcDeviation > 0 ? '+' : ''}${btcDeviation}%)\n`;
    text += `• Cash & Stables: Target ${categoryTargets.cash}% (Actual: ${cashActualPercent}% | Drift: ${cashDeviation > 0 ? '+' : ''}${cashDeviation}%)\n`;
    text += `• Altcoins (Alpha): Target ${categoryTargets.altcoins}% (Actual: ${altcoinsActualPercent}% | Drift: ${altcoinsDeviation > 0 ? '+' : ''}${altcoinsDeviation}%)\n\n`;

    text += `[EXECUTIVE REBALANCE ACTIONS]\n`;
    categoryRecommendations.forEach((r) => {
      if (r.action === 'TRIM') {
        text += `• SELL / TRIM ${r.label}: -$${r.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD (${r.explanation})\n`;
      } else if (r.action === 'ACCUMULATE') {
        text += `• BUY / ACCUMULATE ${r.label}: +$${r.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD (${r.explanation})\n`;
      } else {
        text += `• HOLD ${r.label}: Within safe allocation tolerance (Deviation: ${r.deviationPercent}%)\n`;
      }
    });

    text += `\n[NET CASHFLOW IMPACT]\n`;
    if (netCategoryDifference >= 0) {
      text += `Self-Funding Rebalance: +$${netCategoryDifference.toFixed(2)} USD Cash Surplus (No external capital injection required)\n`;
    } else {
      text += `Net Liquidity Needed: $${Math.abs(netCategoryDifference).toFixed(2)} USD to reach ideal strategic target\n`;
    }

    navigator.clipboard.writeText(text);
    showToast('Macro rebalancing execution plan copied to clipboard!');
  };

  // Generate Suggested Granular Orders for table
  const suggestedOrders = assetList.map((asset) => {
    const totalNetWorth = summary?.totalNetWorthUsd || 0;
    const targetValueUsd = totalNetWorth * (asset.targetPercent / 100);
    const diffUsd = asset.currentValueUsd - targetValueUsd;
    const diffCoins = asset.currentPriceUsd > 0 ? Math.abs(diffUsd) / asset.currentPriceUsd : 0;

    let action: 'SELL' | 'BUY' | 'HOLD' | 'UNASSIGNED' = 'HOLD';
    if (asset.targetPercent === 0) {
      action = 'UNASSIGNED';
    } else if (diffUsd > 100 && Math.abs(asset.deviationPercent) >= 2.0) {
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

  // Calculate deviation only for assets that have an assigned target
  const targetedAssets = assetList.filter((a) => a.targetPercent > 0);
  const maxDeviation = targetedAssets.length > 0
    ? targetedAssets.reduce((max, a) => Math.max(max, Math.abs(a.deviationPercent)), 0)
    : Math.max(Math.abs(btcDeviation), Math.abs(cashDeviation), Math.abs(altcoinsDeviation));

  const totalDriftUsd = Math.max(
    totalCategoryTrimUsd,
    suggestedOrders
      .filter((o) => o.action === 'SELL' || o.action === 'BUY')
      .reduce((sum, o) => sum + o.diffUsd, 0)
  );

  const filteredAssets = assetList
    .filter((a) => {
      if (selectedCategoryTab === 'BTC') return a.category === 'BTC';
      if (selectedCategoryTab === 'CASH') return a.category === 'CASH';
      if (selectedCategoryTab === 'ALTCOINS') return a.category === 'ALTCOINS';
      return true;
    })
    .filter((a) => !hideDust || a.currentValueUsd >= 5 || a.targetPercent > 0);

  // Save Category & Holding Targets
  const handleSaveCategoryTargets = async () => {
    try {
      setIsSavingTargets(true);
      // Save category targets to localStorage
      localStorage.setItem('cryptoos_rebalance_category_targets', JSON.stringify(tempCategoryTargets));
      setCategoryTargets(tempCategoryTargets);

      // Save granular holding targets
      for (const [id, targetPercent] of Object.entries(targets)) {
        await api.put(`/portfolio/holdings/${id}`, { targetPercent });
      }

      showToast('Macro portfolio target allocations saved successfully!');
      setShowTargetModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to save targets:', err);
      showToast('Failed to save allocation targets.');
    } finally {
      setIsSavingTargets(false);
    }
  };

  const handleApplyPreset = (btc: number, cash: number, altcoins: number) => {
    setTempCategoryTargets({ btc, cash, altcoins });
    setLockedCategories({ btc: false, cash: false, altcoins: false });
  };

  const toggleLock = (cat: 'btc' | 'cash' | 'altcoins') => {
    const currentLockedCount = Object.values(lockedCategories).filter(Boolean).length;
    if (!lockedCategories[cat] && currentLockedCount >= 2) {
      showToast('At least 1 category must remain unlocked to balance 100%.');
      return;
    }
    setLockedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const updateCategoryProportionally = (
    changedCat: 'btc' | 'cash' | 'altcoins',
    newVal: number
  ) => {
    const targetVal = Math.max(0, Math.min(100, Math.round(newVal)));
    const allKeys: ('btc' | 'cash' | 'altcoins')[] = ['btc', 'cash', 'altcoins'];
    const otherKeys = allKeys.filter((k) => k !== changedCat);
    const unlockedOthers = otherKeys.filter((k) => !lockedCategories[k]);

    if (unlockedOthers.length === 0) {
      showToast('All other categories are locked. Unlock one to adjust allocation.');
      return;
    }

    const currentVal = tempCategoryTargets[changedCat];
    if (targetVal === currentVal) return;

    const lockedSum = otherKeys
      .filter((k) => lockedCategories[k])
      .reduce((sum, k) => sum + tempCategoryTargets[k], 0);

    const clampedTargetVal = Math.min(targetVal, 100 - lockedSum);
    const remainingForUnlocked = 100 - clampedTargetVal - lockedSum;

    const updated = { ...tempCategoryTargets, [changedCat]: clampedTargetVal };

    if (unlockedOthers.length === 1) {
      updated[unlockedOthers[0]] = Math.max(0, remainingForUnlocked);
    } else if (unlockedOthers.length === 2) {
      const [k1, k2] = unlockedOthers;
      const currentUnlockedSum = tempCategoryTargets[k1] + tempCategoryTargets[k2];

      if (currentUnlockedSum > 0) {
        const ratio1 = tempCategoryTargets[k1] / currentUnlockedSum;
        const v1 = Math.round(remainingForUnlocked * ratio1);
        const v2 = remainingForUnlocked - v1;
        updated[k1] = Math.max(0, v1);
        updated[k2] = Math.max(0, v2);
      } else {
        const half = Math.floor(remainingForUnlocked / 2);
        updated[k1] = half;
        updated[k2] = remainingForUnlocked - half;
      }
    }

    // Ensure sum is always exactly 100
    const total = updated.btc + updated.cash + updated.altcoins;
    if (total !== 100 && unlockedOthers.length > 0) {
      const diff = 100 - total;
      updated[unlockedOthers[0]] = Math.max(0, updated[unlockedOthers[0]] + diff);
    }

    setTempCategoryTargets(updated);
  };

  const handleMarkRebalancedToday = () => {
    setDaysRemaining(cycleDays);
    showToast('Rebalancing cycle reset to 60 days!');
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
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="modal-dialog-animate"
            style={{
              width: '100%',
              maxWidth: '720px',
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '22px 24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.95)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.04em' }}>
                    TARGET ALLOCATION MODEL
                  </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>&bull;</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-bullish)', fontWeight: 700 }}>
                    100% PROPORTIONAL CIRCULAR ALLOCATOR
                  </span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: '2px 0 0' }}>
                  Configure Target Portfolio Model
                </h2>
              </div>
              <button
                onClick={() => setShowTargetModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Configure macro target allocations using the interactive circular allocator wheel below. Every adjustment automatically balances proportionally across unlocked categories so the total remains exactly 100%. Use the lock toggle (🔒) to freeze specific category weights.
            </p>

            {/* Strategy Benchmark Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  STRATEGY BENCHMARK PRESETS:
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  Total: <strong style={{ color: 'var(--color-bullish)' }}>100% Locked</strong>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(50, 20, 30)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: tempCategoryTargets.btc === 50 && tempCategoryTargets.cash === 20 && tempCategoryTargets.altcoins === 30
                      ? '1px solid var(--color-accent-primary)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: tempCategoryTargets.btc === 50 && tempCategoryTargets.cash === 20 && tempCategoryTargets.altcoins === 30
                      ? 'rgba(212, 175, 55, 0.12)'
                      : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>Balanced Barbell</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-accent-primary)', fontWeight: 700 }} className="mono">50 / 20 / 30</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(60, 25, 15)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: tempCategoryTargets.btc === 60 && tempCategoryTargets.cash === 25 && tempCategoryTargets.altcoins === 15
                      ? '1px solid var(--color-bullish)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: tempCategoryTargets.btc === 60 && tempCategoryTargets.cash === 25 && tempCategoryTargets.altcoins === 15
                      ? 'rgba(48, 209, 88, 0.12)'
                      : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>Conservative</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-bullish)', fontWeight: 700 }} className="mono">60 / 25 / 15</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(35, 15, 50)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: tempCategoryTargets.btc === 35 && tempCategoryTargets.cash === 15 && tempCategoryTargets.altcoins === 50
                      ? '1px solid var(--color-cyan)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: tempCategoryTargets.btc === 35 && tempCategoryTargets.cash === 15 && tempCategoryTargets.altcoins === 50
                      ? 'rgba(100, 210, 255, 0.12)'
                      : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>Growth Bull</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-cyan)', fontWeight: 700 }} className="mono">35 / 15 / 50</div>
                </button>
              </div>
            </div>

            {/* Circular Allocator Stage (Interactive Wheel + Proportional Controls) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '240px 1fr',
                gap: '18px',
                alignItems: 'center',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Left Column: Interactive Circular Donut Wheel */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative', width: '220px', height: '220px' }}>
                  {(() => {
                    const wheelRadius = 76;
                    const wheelStroke = 22;
                    const wheelActiveStroke = 29;
                    const wheelCx = 110;
                    const wheelCy = 110;
                    const wheelCircumference = 2 * Math.PI * wheelRadius; // ~477.52

                    const btcArc = (tempCategoryTargets.btc / 100) * wheelCircumference;
                    const cashArc = (tempCategoryTargets.cash / 100) * wheelCircumference;
                    const altcoinsArc = (tempCategoryTargets.altcoins / 100) * wheelCircumference;

                    const sliceGap = 3.0;
                    const btcOffset = sliceGap / 2;
                    const cashOffset = btcArc + sliceGap / 2;
                    const altcoinsOffset = btcArc + cashArc + sliceGap / 2;

                    return (
                      <>
                        <svg
                          width="220"
                          height="220"
                          viewBox="0 0 220 220"
                          style={{
                            overflow: 'visible',
                            transform: 'rotate(-90deg)',
                            transformOrigin: 'center',
                          }}
                        >
                          {/* Background Track */}
                          <circle
                            cx={wheelCx}
                            cy={wheelCy}
                            r={wheelRadius}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.05)"
                            strokeWidth={wheelStroke}
                          />

                          {/* Bitcoin Slice */}
                          {tempCategoryTargets.btc > 0 && (
                            <circle
                              cx={wheelCx}
                              cy={wheelCy}
                              r={wheelRadius}
                              fill="none"
                              stroke="#F7931A"
                              strokeWidth={activeCategory === 'btc' || hoveredWheelCat === 'btc' ? wheelActiveStroke : wheelStroke}
                              strokeDasharray={`${Math.max(0, btcArc - sliceGap)} ${wheelCircumference}`}
                              strokeDashoffset={-btcOffset}
                              strokeLinecap="butt"
                              onClick={() => setActiveCategory('btc')}
                              onMouseEnter={() => setHoveredWheelCat('btc')}
                              onMouseLeave={() => setHoveredWheelCat(null)}
                              style={{
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                filter: activeCategory === 'btc' ? 'drop-shadow(0 0 10px rgba(247, 147, 26, 0.6))' : 'none',
                                opacity: hoveredWheelCat && hoveredWheelCat !== 'btc' ? 0.6 : 1,
                              }}
                            />
                          )}

                          {/* Cash Slice */}
                          {tempCategoryTargets.cash > 0 && (
                            <circle
                              cx={wheelCx}
                              cy={wheelCy}
                              r={wheelRadius}
                              fill="none"
                              stroke="#30D158"
                              strokeWidth={activeCategory === 'cash' || hoveredWheelCat === 'cash' ? wheelActiveStroke : wheelStroke}
                              strokeDasharray={`${Math.max(0, cashArc - sliceGap)} ${wheelCircumference}`}
                              strokeDashoffset={-cashOffset}
                              strokeLinecap="butt"
                              onClick={() => setActiveCategory('cash')}
                              onMouseEnter={() => setHoveredWheelCat('cash')}
                              onMouseLeave={() => setHoveredWheelCat(null)}
                              style={{
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                filter: activeCategory === 'cash' ? 'drop-shadow(0 0 10px rgba(48, 209, 88, 0.6))' : 'none',
                                opacity: hoveredWheelCat && hoveredWheelCat !== 'cash' ? 0.6 : 1,
                              }}
                            />
                          )}

                          {/* Altcoins Slice */}
                          {tempCategoryTargets.altcoins > 0 && (
                            <circle
                              cx={wheelCx}
                              cy={wheelCy}
                              r={wheelRadius}
                              fill="none"
                              stroke="#AF52DE"
                              strokeWidth={activeCategory === 'altcoins' || hoveredWheelCat === 'altcoins' ? wheelActiveStroke : wheelStroke}
                              strokeDasharray={`${Math.max(0, altcoinsArc - sliceGap)} ${wheelCircumference}`}
                              strokeDashoffset={-altcoinsOffset}
                              strokeLinecap="butt"
                              onClick={() => setActiveCategory('altcoins')}
                              onMouseEnter={() => setHoveredWheelCat('altcoins')}
                              onMouseLeave={() => setHoveredWheelCat(null)}
                              style={{
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                filter: activeCategory === 'altcoins' ? 'drop-shadow(0 0 10px rgba(175, 82, 222, 0.6))' : 'none',
                                opacity: hoveredWheelCat && hoveredWheelCat !== 'altcoins' ? 0.6 : 1,
                              }}
                            />
                          )}
                        </svg>

                        {/* Center Display Overlay */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            textAlign: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              color: 'var(--color-text-muted)',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {activeCategory === 'btc' ? 'Bitcoin' : activeCategory === 'cash' ? 'Cash & Stables' : 'Altcoins'}
                          </span>
                          <span
                            className="mono"
                            style={{
                              fontSize: '28px',
                              fontWeight: 900,
                              color: activeCategory === 'btc' ? '#F7931A' : activeCategory === 'cash' ? '#30D158' : '#AF52DE',
                              lineHeight: 1.1,
                              margin: '2px 0',
                            }}
                          >
                            {tempCategoryTargets[activeCategory]}%
                          </span>
                          <span className="mono" style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                            ~${Math.round(totalPortfolioUsd * (tempCategoryTargets[activeCategory] / 100)).toLocaleString()} USD
                          </span>
                          <div
                            style={{
                              marginTop: '6px',
                              fontSize: '8px',
                              fontWeight: 800,
                              color: 'var(--color-bullish)',
                              background: 'rgba(48, 209, 88, 0.12)',
                              border: '1px solid rgba(48, 209, 88, 0.3)',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              letterSpacing: '0.04em',
                            }}
                          >
                            100% PROPORTIONAL ✓
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  Click slice to select category
                </span>
              </div>

              {/* Right Column: Category Sliders & Auto-Balancing Directives */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Active Category Quick Delta Stepper */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                    STEPPER ({activeCategory.toUpperCase()}):
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => updateCategoryProportionally(activeCategory, tempCategoryTargets[activeCategory] - 10)}
                      className="btn btn-secondary"
                      style={{ height: '22px', padding: '0 6px', fontSize: '10px', fontWeight: 800 }}
                    >
                      -10%
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCategoryProportionally(activeCategory, tempCategoryTargets[activeCategory] - 5)}
                      className="btn btn-secondary"
                      style={{ height: '22px', padding: '0 6px', fontSize: '10px', fontWeight: 800 }}
                    >
                      -5%
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCategoryProportionally(activeCategory, tempCategoryTargets[activeCategory] + 5)}
                      className="btn btn-secondary"
                      style={{ height: '22px', padding: '0 6px', fontSize: '10px', fontWeight: 800 }}
                    >
                      +5%
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCategoryProportionally(activeCategory, tempCategoryTargets[activeCategory] + 10)}
                      className="btn btn-secondary"
                      style={{ height: '22px', padding: '0 6px', fontSize: '10px', fontWeight: 800 }}
                    >
                      +10%
                    </button>
                  </div>
                </div>

                {/* 3 Proportional Category Controllers */}
                {(
                  [
                    {
                      key: 'btc' as const,
                      label: 'Bitcoin (BTC)',
                      color: '#F7931A',
                    },
                    {
                      key: 'cash' as const,
                      label: 'Cash & Stables (USDT/USDC)',
                      color: '#30D158',
                    },
                    {
                      key: 'altcoins' as const,
                      label: 'Altcoins (Alpha Exposure)',
                      color: '#AF52DE',
                    },
                  ] as const
                ).map((cat) => {
                  const isCatActive = activeCategory === cat.key;
                  const isLocked = lockedCategories[cat.key];

                  return (
                    <div
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isCatActive ? `${cat.color}0D` : 'rgba(255, 255, 255, 0.02)',
                        border: isCatActive ? `1px solid ${cat.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} />
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#fff' }}>
                            {cat.label}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }} className="mono">
                            ~${Math.round(totalPortfolioUsd * (tempCategoryTargets[cat.key] / 100)).toLocaleString()} USD
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Lock / Unlock Auto-Balance Toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLock(cat.key);
                            }}
                            title={isLocked ? "Terkunci: Nilai ini tetap saat kategori lain disesuaikan" : "Bebas: Nilai ini otomatis menyesuaikan saat kategori lain diubah"}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: isLocked ? `${cat.color}20` : 'rgba(255, 255, 255, 0.04)',
                              border: isLocked ? `1px solid ${cat.color}60` : '1px solid rgba(255, 255, 255, 0.1)',
                              color: isLocked ? cat.color : 'var(--color-text-muted)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: '9px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                            <span>{isLocked ? 'LOCKED' : 'AUTO'}</span>
                          </button>

                          {/* Number Input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              value={tempCategoryTargets[cat.key]}
                              onChange={(e) => updateCategoryProportionally(cat.key, parseFloat(e.target.value) || 0)}
                              className="form-input mono"
                              style={{ width: '56px', height: '26px', textAlign: 'right', fontSize: '12px', fontWeight: 800 }}
                            />
                            <span style={{ fontSize: '11px', color: cat.color, fontWeight: 800 }}>%</span>
                          </div>
                        </div>
                      </div>

                      {/* Proportional Range Slider */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={tempCategoryTargets[cat.key]}
                        onChange={(e) => updateCategoryProportionally(cat.key, parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          accentColor: cat.color,
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Collapsible Granular Holding Targets (Optional) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowGranularTargets(!showGranularTargets)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 0,
                }}
              >
                <span>{showGranularTargets ? '▼ Hide Specific Coin Targets' : '▶ Configure Specific Coin Targets (Optional)'}</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>({summary?.holdings?.length || 0} holdings)</span>
              </button>

              {showGranularTargets && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {summary?.holdings?.map((h) => (
                      <div
                        key={h.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TokenIcon symbol={h.symbol} size={18} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 800, color: '#fff', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                                {h.symbol}
                              </span>
                              <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                                {h.exchange}
                              </span>
                            </div>
                            <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block' }} className="mono">
                              ${h.currentValueUsd.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={targets[h.id] ?? 0}
                            onChange={(e) => setTargets({ ...targets, [h.id]: parseFloat(e.target.value) || 0 })}
                            className="form-input mono"
                            style={{ width: '56px', height: '26px', textAlign: 'right', fontSize: '11px', fontWeight: 700 }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', fontSize: '10px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Total Specific Coin Target:</span>
                    <span className="mono" style={{ color: totalTargetSum === 100 ? 'var(--color-bullish)' : 'var(--color-text-secondary)', fontWeight: 700 }}>
                      {totalTargetSum}%
                    </span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button className="btn btn-secondary" onClick={() => setShowTargetModal(false)} style={{ height: '34px', fontSize: '12px' }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveCategoryTargets}
                disabled={isSavingTargets}
                style={{ height: '34px', fontSize: '12px', fontWeight: 800 }}
              >
                {isSavingTargets ? 'Saving...' : 'Save Portfolio Targets'}
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
            Periodic rebalancing cycles, actual vs. target weight deviation audit, and automated order recommendations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/portfolio')}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
          >
            <Wallet size={13} />
            <span>View Portfolio</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleMarkRebalancedToday}
            style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
          >
            <CheckCircle2 size={13} color="var(--color-bullish)" />
            <span>Reset 60-Day Cycle</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowTargetModal(true)}
            style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}
          >
            <SlidersHorizontal size={14} />
            <span>Configure Targets</span>
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
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#000000',
        }}
      >
        {/* Cycle Days Cell */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              REBALANCING CYCLE
            </span>
            <Calendar size={13} color="var(--color-accent-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span className="value-number" style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
              {daysRemaining} Days
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              remaining of {cycleDays} days
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
              Threshold ±2.5%
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {maxDeviation >= 3.0 ? 'Weight deviation exceeds tolerance threshold' : 'Portfolio weights within safe tolerance'}
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
            Estimated spot adjustment volume
          </span>
        </div>

        {/* Portfolio Valuation Cell */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              PORTFOLIO VALUATION BASIS
            </span>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              MULTI-EXCHANGE
            </span>
          </div>
          <div style={{ marginTop: '2px' }}>
            <DualCurrencyValue
              usd={summary?.totalNetWorthUsd || 0}
              idr={summary?.totalNetWorthIdr || 0}
              size="lg"
            />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            1 USD = Rp {(summary?.usdToIdrRate || usdToIdrRate).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Category-Level Visual Rebalancing Engine: Actual vs Model Comparison & Directives */}
      <div
        className="cardless-sheet"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#000000',
        }}
      >
        {/* Pane 1: Current Realized Category Allocation */}
        <div
          style={{
            padding: '18px 20px',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '360px',
            backgroundColor: '#000000',
          }}
        >
          <InteractiveDonutChart
            title="Current Allocation (Actual)"
            subtitle="Realized portfolio weights by category"
            badgeText="REALIZED"
            badgeType="gold"
            items={actualCategorySegments}
            emptyMessage="No spot asset data recorded"
            icon={<PieChart size={14} color="var(--color-accent-primary)" />}
            unitLabel="CATEGORIES"
            isPane
          />
        </div>

        {/* Pane 2: Target Model Strategy Allocation */}
        <div
          onClick={() => setShowTargetModal(true)}
          style={{
            padding: '18px 20px',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '360px',
            backgroundColor: '#000000',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          title="Click to configure circular target model"
        >
          <InteractiveDonutChart
            title="Target Model Allocation (Ideal)"
            subtitle={`${categoryTargets.btc}% BTC • ${categoryTargets.cash}% Cash • ${categoryTargets.altcoins}% Alt • Click to edit`}
            badgeText={totalCategoryTargetSum === 100 ? "BALANCED 100%" : "DRIFT MODEL"}
            badgeType={totalCategoryTargetSum === 100 ? "bullish" : "neutral"}
            items={targetCategorySegments}
            emptyMessage="Target configuration missing"
            icon={<Target size={14} color="var(--color-cyan)" />}
            unitLabel="CATEGORIES"
            isPane
          />
        </div>

        {/* Pane 3: Executive Rebalancing Signals & Directives */}
        <div
          style={{
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#000000',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <ArrowRightLeft size={13} color="var(--color-accent-primary)" />
              <span
                style={{
                  fontSize: '9.5px',
                  color: 'var(--color-text-muted)',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                REBALANCE DIRECTIVES & SIGNALS
              </span>
            </div>
            <button
              onClick={handleCopyPlan}
              className="btn btn-secondary"
              style={{
                height: '24px',
                padding: '0 8px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Copy executive rebalance execution plan to clipboard"
            >
              <Copy size={11} />
              <span>Copy Plan</span>
            </button>
          </div>

          {/* Directives for the 3 Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categoryRecommendations.map((rec) => {
              const isTrim = rec.action === 'TRIM';
              const isAcc = rec.action === 'ACCUMULATE';
              const badgeClass = isTrim ? 'bearish-badge' : isAcc ? 'bullish-badge' : 'neutral-badge';
              const badgeLabel = isTrim
                ? `TRIM (SELL) -$${rec.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : isAcc
                ? `ACCUMULATE (BUY) +$${rec.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : 'ON TARGET (BALANCED)';

              return (
                <div
                  key={rec.category}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: rec.color,
                        }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>
                        {rec.label}
                      </span>
                      <span className="mono" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        {rec.actualPercent}% → {rec.targetPercent}%
                      </span>
                    </div>
                    <span className={badgeClass} style={{ fontSize: '9px', padding: '1px 5px', fontWeight: 800 }}>
                      {badgeLabel}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
                    {rec.explanation}
                  </span>

                  {/* 1-Click Action to Position Sizer */}
                  {rec.action !== 'BALANCED' && rec.diffUsd > 10 && (
                    <button
                      onClick={() => {
                        if (rec.category === 'BTC') {
                          const btcAsset = assetList.find((a) => a.category === 'BTC');
                          const price = btcAsset?.currentPriceUsd || 68000;
                          navigate('/calculator', {
                            state: {
                              source: 'rebalance',
                              ticker: 'BTCUSDT',
                              direction: rec.action === 'ACCUMULATE' ? 'LONG' : 'SHORT',
                              rebalanceAction: rec.action === 'ACCUMULATE' ? 'BUY' : 'SELL',
                              entryPrice: price,
                              targetDiffUsd: rec.diffUsd,
                              targetDiffCoins: price > 0 ? rec.diffUsd / price : 0,
                              portfolioNetWorth: totalPortfolioUsd,
                              currentWeight: rec.actualPercent,
                              targetWeight: rec.targetPercent,
                              category: 'BTC',
                              reason: `Rebalance BTC ${rec.action === 'ACCUMULATE' ? 'deficit' : 'surplus'}: Allocation ${rec.actualPercent}% vs target ${rec.targetPercent}%.`,
                            },
                          });
                        } else if (rec.category === 'ALTCOINS') {
                          const topAlt = [...assetList]
                            .filter((a) => a.category === 'ALTCOINS')
                            .sort((a, b) => b.currentValueUsd - a.currentValueUsd)[0];
                          if (topAlt) {
                            navigate('/calculator', {
                              state: {
                                source: 'rebalance',
                                ticker: `${topAlt.symbol}USDT`,
                                direction: rec.action === 'TRIM' ? 'SHORT' : 'LONG',
                                rebalanceAction: rec.action === 'TRIM' ? 'SELL' : 'BUY',
                                entryPrice: topAlt.currentPriceUsd,
                                targetDiffUsd: Math.min(topAlt.currentValueUsd, rec.diffUsd),
                                targetDiffCoins: topAlt.currentPriceUsd > 0 ? Math.min(topAlt.currentValueUsd, rec.diffUsd) / topAlt.currentPriceUsd : 0,
                                portfolioNetWorth: totalPortfolioUsd,
                                currentWeight: rec.actualPercent,
                                targetWeight: rec.targetPercent,
                                category: 'ALTCOINS',
                                reason: `Rebalance Altcoins ${rec.action === 'TRIM' ? 'overweight' : 'deficit'}: Rotate ${topAlt.symbol} by $${Math.min(topAlt.currentValueUsd, rec.diffUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}.`,
                              },
                            });
                          }
                        } else if (rec.category === 'CASH') {
                          const topAlt = [...assetList]
                            .filter((a) => a.category === 'ALTCOINS')
                            .sort((a, b) => b.currentValueUsd - a.currentValueUsd)[0];
                          if (topAlt) {
                            navigate('/calculator', {
                              state: {
                                source: 'rebalance',
                                ticker: `${topAlt.symbol}USDT`,
                                direction: 'SHORT',
                                rebalanceAction: 'SELL',
                                entryPrice: topAlt.currentPriceUsd,
                                targetDiffUsd: Math.min(topAlt.currentValueUsd, rec.diffUsd),
                                targetDiffCoins: topAlt.currentPriceUsd > 0 ? Math.min(topAlt.currentValueUsd, rec.diffUsd) / topAlt.currentPriceUsd : 0,
                                portfolioNetWorth: totalPortfolioUsd,
                                currentWeight: rec.actualPercent,
                                targetWeight: rec.targetPercent,
                                category: 'CASH',
                                reason: `Rebalance Cash reserves: Harvest profits from ${topAlt.symbol} to fund USDT/USDC allocation (deficit +$${rec.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}).`,
                              },
                            });
                          }
                        }
                      }}
                      className="btn btn-secondary"
                      style={{
                        height: '24px',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        marginTop: '4px',
                        color: isTrim ? 'var(--color-bearish)' : 'var(--color-bullish)',
                        borderColor: isTrim ? 'rgba(244, 63, 94, 0.3)' : 'rgba(48, 209, 88, 0.3)',
                        background: isTrim ? 'rgba(244, 63, 94, 0.08)' : 'rgba(48, 209, 88, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        width: '100%',
                      }}
                    >
                      <Zap size={10} />
                      <span>
                        {rec.category === 'BTC'
                          ? `Execute BTC Sizing Order (+$${rec.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}) →`
                          : rec.category === 'ALTCOINS'
                          ? `Execute Altcoin Trim Sizing (-$${rec.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}) →`
                          : `Secure Cash Liquidity Reserve (+$${rec.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}) →`}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Self-Funding Liquidity Indicator */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: netCategoryDifference >= 0 ? 'rgba(48, 209, 88, 0.08)' : 'rgba(255, 159, 10, 0.08)',
              border: netCategoryDifference >= 0 ? '1px solid rgba(48, 209, 88, 0.25)' : '1px solid rgba(255, 159, 10, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={12} color={netCategoryDifference >= 0 ? 'var(--color-bullish)' : 'var(--color-amber)'} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>
                {netCategoryDifference >= 0 ? 'Self-Funding Rebalance' : 'Net Liquidity Needed'}
              </span>
            </div>
            <span
              className="mono"
              style={{
                fontSize: '11px',
                fontWeight: 900,
                color: netCategoryDifference >= 0 ? 'var(--color-bullish)' : 'var(--color-amber)',
              }}
            >
              {netCategoryDifference >= 0 ? `+$${netCategoryDifference.toLocaleString(undefined, { maximumFractionDigits: 0 })} Surplus` : `-$${Math.abs(netCategoryDifference).toLocaleString(undefined, { maximumFractionDigits: 0 })} Deficit`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Rebalancing Matrix (Pure Cardless Table Sheet) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
              REBALANCING MATRIX & DRIFT AUDIT
            </span>
            <span className="neutral-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              {filteredAssets.length} OF {assetList.length} ASSETS
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Category Filter Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedCategoryTab('ALL')}
                style={{
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: selectedCategoryTab === 'ALL' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: selectedCategoryTab === 'ALL' ? '#ffffff' : 'var(--color-text-secondary)',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                ALL ({assetList.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryTab('BTC')}
                style={{
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: selectedCategoryTab === 'BTC' ? 'rgba(247, 147, 26, 0.2)' : 'transparent',
                  color: selectedCategoryTab === 'BTC' ? '#F7931A' : 'var(--color-text-secondary)',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#F7931A' }} />
                <span>BITCOIN ({assetList.filter(a => a.category === 'BTC').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryTab('CASH')}
                style={{
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: selectedCategoryTab === 'CASH' ? 'rgba(48, 209, 88, 0.2)' : 'transparent',
                  color: selectedCategoryTab === 'CASH' ? '#30D158' : 'var(--color-text-secondary)',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#30D158' }} />
                <span>CASH & STABLES ({assetList.filter(a => a.category === 'CASH').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryTab('ALTCOINS')}
                style={{
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: selectedCategoryTab === 'ALTCOINS' ? 'rgba(175, 82, 222, 0.2)' : 'transparent',
                  color: selectedCategoryTab === 'ALTCOINS' ? '#AF52DE' : 'var(--color-text-secondary)',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#AF52DE' }} />
                <span>ALTCOINS ({assetList.filter(a => a.category === 'ALTCOINS').length})</span>
              </button>
            </div>

            {/* Dust Filter Pill */}
            <button
              onClick={() => setHideDust(!hideDust)}
              style={{
                height: '24px',
                padding: '0 8px',
                borderRadius: '999px',
                border: hideDust ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                background: hideDust ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                color: hideDust ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title="Toggle small / zero balance holdings without a target"
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: hideDust ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                }}
              />
              <span>Hide Dust / Inactive (&lt; $5)</span>
              {assetList.length - assetList.filter(a => !hideDust || a.currentValueUsd >= 5 || a.targetPercent > 0).length > 0 && (
                <span className="mono" style={{ opacity: 0.85 }}>
                  ({assetList.length - assetList.filter(a => !hideDust || a.currentValueUsd >= 5 || a.targetPercent > 0).length})
                </span>
              )}
            </button>
          </div>
        </div>

        <div
          className="cardless-sheet"
          style={{
            padding: 0,
            overflowX: 'auto',
            background: '#000000',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <table className="cardless-table" style={{ fontSize: '11px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: '170px' }}>ASSET</th>
                <th style={{ textAlign: 'right', width: '120px' }}>CURRENT PRICE</th>
                <th style={{ textAlign: 'right', minWidth: '180px' }}>ACTUAL VALUE</th>
                <th style={{ textAlign: 'right', minWidth: '170px' }}>ACTUAL VS TARGET</th>
                <th style={{ textAlign: 'right', width: '110px' }}>DEVIATION</th>
                <th style={{ textAlign: 'left', minWidth: '220px' }}>RECOMMENDED ACTION</th>
                <th style={{ textAlign: 'center', width: '100px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                    No spot holdings matching current filter.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const order = suggestedOrders.find((o) => o.symbol === asset.symbol);
                  const isOver = asset.deviationPercent > 0;
                  const isSig = Math.abs(asset.deviationPercent) >= 2.5;

                  return (
                    <tr key={asset.symbol}>
                      {/* Asset Column with TokenIcon, Symbol, and Exchange Logos */}
                      <td style={{ fontWeight: 800 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <TokenIcon symbol={asset.symbol} size={22} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                {asset.symbol}
                              </span>
                              {/* Category Pill */}
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  backgroundColor:
                                    asset.category === 'BTC'
                                      ? 'rgba(247, 147, 26, 0.15)'
                                      : asset.category === 'CASH'
                                      ? 'rgba(48, 209, 88, 0.15)'
                                      : 'rgba(175, 82, 222, 0.15)',
                                  color:
                                    asset.category === 'BTC'
                                      ? '#F7931A'
                                      : asset.category === 'CASH'
                                      ? '#30D158'
                                      : '#AF52DE',
                                  border: `1px solid ${
                                    asset.category === 'BTC'
                                      ? 'rgba(247, 147, 26, 0.3)'
                                      : asset.category === 'CASH'
                                      ? 'rgba(48, 209, 88, 0.3)'
                                      : 'rgba(175, 82, 222, 0.3)'
                                  }`,
                                }}
                              >
                                {asset.category === 'BTC' ? 'BTC' : asset.category === 'CASH' ? 'CASH' : 'ALT'}
                              </span>
                              {/* Exchange Logos where this asset is stored */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                {Array.from(new Set(asset.holdings.map((h) => h.exchange))).map((ex) => (
                                  <ExchangeIcon key={ex} exchange={ex} size={14} />
                                ))}
                              </div>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }} className="mono">
                              {asset.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {asset.symbol}
                            </span>
                          </div>
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
                              {asset.targetPercent > 0 ? `/ Target ${asset.targetPercent}%` : '/ Target —'}
                            </span>
                          </div>
                          <div style={{ width: '80px', height: '3px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, asset.actualPercent)}%`,
                                height: '100%',
                                backgroundColor: asset.targetPercent > 0
                                  ? (isSig ? (isOver ? 'var(--color-amber)' : 'var(--color-cyan)') : 'var(--color-bullish)')
                                  : 'rgba(255, 255, 255, 0.2)',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {asset.targetPercent > 0 ? (
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
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>—</span>
                        )}
                      </td>

                      <td>
                        {order && order.action === 'UNASSIGNED' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => setShowTargetModal(true)}
                              style={{
                                background: 'none',
                                border: '1px dashed rgba(212, 175, 55, 0.45)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-xs)',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: 'var(--color-accent-primary)',
                                cursor: 'pointer',
                              }}
                              title="Click to configure target allocation for this asset"
                            >
                              + Set Target %
                            </button>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                              Untargeted asset
                            </span>
                          </div>
                        )}
                        {order && order.action === 'SELL' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span className="bearish-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>
                              TRIM (SELL)
                            </span>
                            <span className="mono" style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>
                              ${order.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({order.diffCoins.toFixed(3)} {asset.symbol})
                            </span>
                          </div>
                        )}
                        {order && order.action === 'BUY' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span className="bullish-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>
                              ACCUMULATE (BUY)
                            </span>
                            <span className="mono" style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>
                              ${order.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({order.diffCoins.toFixed(3)} {asset.symbol})
                            </span>
                          </div>
                        )}
                        {order && order.action === 'HOLD' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span className="neutral-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>
                              HOLD (BALANCED)
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                              Within target range
                            </span>
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {order && order.action === 'SELL' && (
                          <button
                            onClick={() =>
                              navigate('/calculator', {
                                state: {
                                  source: 'rebalance',
                                  ticker: `${asset.symbol}USDT`,
                                  direction: 'SHORT',
                                  rebalanceAction: 'SELL',
                                  entryPrice: asset.currentPriceUsd,
                                  targetDiffUsd: order.diffUsd,
                                  targetDiffCoins: order.diffCoins,
                                  portfolioNetWorth: totalPortfolioUsd,
                                  currentWeight: asset.actualPercent,
                                  targetWeight: asset.targetPercent,
                                  category: asset.category,
                                  exchange: asset.holdings?.[0]?.exchange || 'Binance',
                                  reason: `Rebalance Trim: Over-allocation by +${asset.deviationPercent}%. Sell $${order.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} to restore target.`,
                                },
                              })
                            }
                            className="btn btn-secondary"
                            style={{
                              height: '28px',
                              fontSize: '10px',
                              padding: '0 8px',
                              fontWeight: 700,
                              borderColor: 'rgba(244, 63, 94, 0.4)',
                              color: 'var(--color-bearish)',
                              background: 'rgba(244, 63, 94, 0.08)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Size trim order in Position Sizer"
                          >
                            <Zap size={11} />
                            <span>Size Trim (${order.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                          </button>
                        )}

                        {order && order.action === 'BUY' && (
                          <button
                            onClick={() =>
                              navigate('/calculator', {
                                state: {
                                  source: 'rebalance',
                                  ticker: `${asset.symbol}USDT`,
                                  direction: 'LONG',
                                  rebalanceAction: 'BUY',
                                  entryPrice: asset.currentPriceUsd,
                                  targetDiffUsd: order.diffUsd,
                                  targetDiffCoins: order.diffCoins,
                                  portfolioNetWorth: totalPortfolioUsd,
                                  currentWeight: asset.actualPercent,
                                  targetWeight: asset.targetPercent,
                                  category: asset.category,
                                  exchange: asset.holdings?.[0]?.exchange || 'Binance',
                                  reason: `Rebalance Accumulate: Under-allocation by ${asset.deviationPercent}%. Buy +$${order.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} to reach target.`,
                                },
                              })
                            }
                            className="btn btn-secondary"
                            style={{
                              height: '28px',
                              fontSize: '10px',
                              padding: '0 8px',
                              fontWeight: 700,
                              borderColor: 'rgba(48, 209, 88, 0.4)',
                              color: 'var(--color-bullish)',
                              background: 'rgba(48, 209, 88, 0.08)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Size buy order in Position Sizer"
                          >
                            <Zap size={11} />
                            <span>Size Buy (${order.diffUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                          </button>
                        )}

                        {order && order.action === 'UNASSIGNED' && (
                          <button
                            onClick={() => {
                              const trimAmount = Math.min(
                                asset.currentValueUsd,
                                Math.round(asset.currentValueUsd * 0.25)
                              );
                              navigate('/calculator', {
                                state: {
                                  source: 'rebalance',
                                  ticker: `${asset.symbol}USDT`,
                                  direction: 'SHORT',
                                  rebalanceAction: 'SELL',
                                  entryPrice: asset.currentPriceUsd,
                                  targetDiffUsd: trimAmount,
                                  targetDiffCoins: asset.currentPriceUsd > 0 ? trimAmount / asset.currentPriceUsd : 0,
                                  portfolioNetWorth: totalPortfolioUsd,
                                  currentWeight: asset.actualPercent,
                                  targetWeight: 0,
                                  category: asset.category,
                                  exchange: asset.holdings?.[0]?.exchange || 'Binance',
                                  reason: `Rebalance Trim Untargeted: Trim $${trimAmount.toLocaleString()} from untargeted holding to fund rotation into BTC / Cash.`,
                                },
                              });
                            }}
                            className="btn btn-secondary"
                            style={{
                              height: '28px',
                              fontSize: '10px',
                              padding: '0 8px',
                              fontWeight: 700,
                              borderColor: 'rgba(255, 159, 10, 0.35)',
                              color: 'var(--color-amber)',
                              background: 'rgba(255, 159, 10, 0.05)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Size profit trim to fund rebalance"
                          >
                            <Zap size={11} />
                            <span>Size Trim</span>
                          </button>
                        )}

                        {order && order.action === 'HOLD' && (
                          <button
                            onClick={() =>
                              navigate('/calculator', {
                                state: {
                                  ticker: `${asset.symbol}USDT`,
                                  direction: 'LONG',
                                  entryPrice: asset.currentPriceUsd,
                                  portfolioNetWorth: totalPortfolioUsd,
                                },
                              })
                            }
                            className="btn btn-secondary"
                            style={{ height: '28px', fontSize: '10px', padding: '0 8px' }}
                            title="Export parameters to Position Sizer"
                          >
                            <Calculator size={11} />
                            <span>Sizer</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Table Footer when Dust is Hidden */}
          {hideDust && (assetList.length - assetList.filter(a => a.currentValueUsd >= 5 || a.targetPercent > 0).length) > 0 && (
            <div
              style={{
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(255, 255, 255, 0.01)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Showing {assetList.filter(a => a.currentValueUsd >= 5 || a.targetPercent > 0).length} active holdings (hiding {assetList.length - assetList.filter(a => a.currentValueUsd >= 5 || a.targetPercent > 0).length} zero/inactive balances)
              </span>
              <button
                onClick={() => setHideDust(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent-primary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Reveal {assetList.length - assetList.filter(a => a.currentValueUsd >= 5 || a.targetPercent > 0).length} inactive balances
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
