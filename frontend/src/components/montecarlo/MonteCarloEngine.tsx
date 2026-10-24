import React, { useState, useMemo } from 'react';
import {
  Dice5,
  ShieldCheck,
  RotateCcw,
  TrendingUp,
  Info,
  Percent,
  X,
} from 'lucide-react';

export interface MonteCarloEngineProps {
  initialWinRate?: number;
  initialPayoff?: number;
  initialAccountSize?: number;
  initialRiskPercent?: number;
  sourceLabel?: string;
  onClose?: () => void;
  isEmbedded?: boolean;
}

function formatCompactCurrency(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '$0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e5) return `${sign}$${(abs / 1e3).toFixed(0)}k`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

export const MonteCarloEngine: React.FC<MonteCarloEngineProps> = ({
  initialWinRate = 60,
  initialPayoff = 2.23,
  initialAccountSize = 25000,
  initialRiskPercent = 2.0,
  sourceLabel = 'Journal Analytics',
  onClose,
  isEmbedded = false,
}) => {
  // Sanitize initial values against extreme sample anomalies (e.g. 1 trade = 100% WR & 99 PF)
  const safeInitialWinRate = Math.min(75, Math.max(35, initialWinRate >= 99 ? 60 : initialWinRate));
  const safeInitialPayoff = Math.min(4.5, Math.max(0.8, initialPayoff >= 10 ? 2.23 : initialPayoff));

  // Simulation Parameters
  const [startingCapital, setStartingCapital] = useState<number>(initialAccountSize);
  const [winRate, setWinRate] = useState<number>(safeInitialWinRate);
  const [payoffRatio, setPayoffRatio] = useState<number>(safeInitialPayoff);
  const [riskPerTrade, setRiskPerTrade] = useState<number>(initialRiskPercent);
  const [numTrades, setNumTrades] = useState<number>(100);
  const [ruinDrawdownThreshold, setRuinDrawdownThreshold] = useState<number>(25); // 25% max DD = Ruin
  const [randomSeed, setRandomSeed] = useState<number>(Date.now());
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Visual Display Mode
  const [activeTab, setActiveTab] = useState<'CONE' | 'DISTRIBUTION' | 'STREAKS' | 'KELLY'>('CONE');
  const [hoveredTradeIdx, setHoveredTradeIdx] = useState<number | null>(null);

  // Trigger Re-roll with micro-animation
  const handleReroll = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setRandomSeed(Date.now() + Math.random());
      setIsSimulating(false);
    }, 120);
  };

  // Preset Handlers
  const handleLoadJournalDefaults = () => {
    setWinRate(safeInitialWinRate);
    setPayoffRatio(safeInitialPayoff);
    setStartingCapital(initialAccountSize);
    setRiskPerTrade(initialRiskPercent);
    handleReroll();
  };

  const handleLoadStressTestPreset = () => {
    setWinRate(42);
    setPayoffRatio(1.3);
    setRiskPerTrade(2.5);
    setRuinDrawdownThreshold(25);
    handleReroll();
  };

  const handleLoadConservativePreset = () => {
    setWinRate(58);
    setPayoffRatio(2.0);
    setRiskPerTrade(1.0);
    setRuinDrawdownThreshold(20);
    handleReroll();
  };

  // Monte Carlo Calculation Engine (1,000 Independent Stochastic Runs)
  const simulationResults = useMemo(() => {
    const NUM_SIMS = 1000;
    const wr = Math.max(1, Math.min(99, winRate)) / 100;
    const payoff = Math.max(0.1, payoffRatio);
    const riskFraction = Math.max(0.1, Math.min(25, riskPerTrade)) / 100;
    const ruinThresholdFraction = ruinDrawdownThreshold / 100;

    // Trackers
    const trajectories: number[][] = []; // sample of 40 paths for backdrop
    const maxDrawdowns: number[] = [];
    const finalEquities: number[] = [];
    let ruinedSimulations = 0;
    let worstDdRun = { maxDd: 0, path: [] as number[] };
    let bestFinalRun = { finalEq: 0, path: [] as number[] };
    let maxConsecutiveLossesObserved: number[] = [];

    // Matrix to compute percentiles across each trade step: [step][simIndex]
    const stepEquities: number[][] = Array.from({ length: numTrades + 1 }, () => []);

    for (let sim = 0; sim < NUM_SIMS; sim++) {
      let equity = startingCapital;
      let peak = startingCapital;
      let maxDdPct = 0;
      let breachedRuin = false;
      let currentLossStreak = 0;
      let maxLossStreak = 0;

      const path: number[] = [startingCapital];
      stepEquities[0].push(startingCapital);

      for (let t = 1; t <= numTrades; t++) {
        const isWin = Math.random() < wr;
        const riskAmount = equity * riskFraction;

        if (isWin) {
          equity += riskAmount * payoff;
          currentLossStreak = 0;
        } else {
          equity -= riskAmount;
          currentLossStreak++;
          if (currentLossStreak > maxLossStreak) {
            maxLossStreak = currentLossStreak;
          }
        }

        if (equity > peak) peak = equity;
        const currentDd = peak > 0 ? (peak - equity) / peak : 0;
        if (currentDd > maxDdPct) maxDdPct = currentDd;
        if (currentDd >= ruinThresholdFraction) breachedRuin = true;

        path.push(parseFloat(equity.toFixed(2)));
        stepEquities[t].push(equity);
      }

      maxDrawdowns.push(maxDdPct);
      finalEquities.push(equity);
      maxConsecutiveLossesObserved.push(maxLossStreak);
      if (breachedRuin) ruinedSimulations++;

      if (maxDdPct > worstDdRun.maxDd) {
        worstDdRun = { maxDd: maxDdPct, path };
      }
      if (equity > bestFinalRun.finalEq) {
        bestFinalRun = { finalEq: equity, path };
      }

      // Store a representative subset of 40 trajectories for visual density
      if (sim < 40) {
        trajectories.push(path);
      }
    }

    // Step-by-step Percentile Trajectories (5th, 25th, 50th/Median, 75th, 95th)
    const percentileBands: Array<{
      step: number;
      p5: number;
      p25: number;
      p50: number; // Median
      p75: number;
      p95: number;
    }> = [];

    for (let t = 0; t <= numTrades; t++) {
      const sorted = [...stepEquities[t]].sort((a, b) => a - b);
      percentileBands.push({
        step: t,
        p5: sorted[Math.floor(NUM_SIMS * 0.05)],
        p25: sorted[Math.floor(NUM_SIMS * 0.25)],
        p50: sorted[Math.floor(NUM_SIMS * 0.5)],
        p75: sorted[Math.floor(NUM_SIMS * 0.75)],
        p95: sorted[Math.floor(NUM_SIMS * 0.95)],
      });
    }

    // Drawdown distribution percentiles
    const sortedDds = [...maxDrawdowns].sort((a, b) => a - b);
    const medianDrawdownPct = parseFloat((sortedDds[Math.floor(NUM_SIMS * 0.5)] * 100).toFixed(2));
    const valueAtRisk95 = parseFloat((sortedDds[Math.floor(NUM_SIMS * 0.95)] * 100).toFixed(2));
    const worstDrawdownPct = parseFloat((worstDdRun.maxDd * 100).toFixed(2));

    // Final Equity percentiles
    const sortedFinals = [...finalEquities].sort((a, b) => a - b);
    const medianFinalEquity = Math.round(sortedFinals[Math.floor(NUM_SIMS * 0.5)]);
    const p95FinalEquity = Math.round(sortedFinals[Math.floor(NUM_SIMS * 0.95)]);
    const p5FinalEquity = Math.round(sortedFinals[Math.floor(NUM_SIMS * 0.05)]);

    const ruinProbabilityPct = parseFloat(((ruinedSimulations / NUM_SIMS) * 100).toFixed(2));
    const lossProbabilityPct = parseFloat(
      ((finalEquities.filter((e) => e < startingCapital).length / NUM_SIMS) * 100).toFixed(1)
    );

    // Consecutive Loss Clustering Probability Formula:
    // P(at least k consecutive losses in N trades) approximate Markov formula
    const lossProb = 1 - wr;
    const calcStreakRisk = (k: number) => {
      if (k > numTrades) return 0;
      // Exact approximation: 1 - exp(- (N - k + 1) * lossProb^k * wr)
      const expectedClusters = (numTrades - k + 1) * Math.pow(lossProb, k) * (k < numTrades ? wr : 1);
      const prob = (1 - Math.exp(-expectedClusters)) * 100;
      return Math.min(99.9, Math.max(0.1, parseFloat(prob.toFixed(1))));
    };

    const streakProbabilities = {
      three: calcStreakRisk(3),
      four: calcStreakRisk(4),
      five: calcStreakRisk(5),
      six: calcStreakRisk(6),
      eight: calcStreakRisk(8),
      ten: calcStreakRisk(10),
    };

    // Kelly Criterion Formula: K% = (W * (R + 1) - 1) / R
    const fullKellyPct = parseFloat((((wr * (payoff + 1) - 1) / payoff) * 100).toFixed(2));
    const halfKellyPct = parseFloat((Math.max(0, fullKellyPct) / 2).toFixed(2));

    // Sensitivity Matrix of Risk % vs Ruin Probability
    const sensitivityGrid = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0].map((testRisk) => {
      let testRuined = 0;
      const testRiskFrac = testRisk / 100;
      for (let s = 0; s < 300; s++) {
        let eq = 100;
        let pk = 100;
        for (let t = 1; t <= numTrades; t++) {
          const win = Math.random() < wr;
          const r = eq * testRiskFrac;
          if (win) eq += r * payoff;
          else eq -= r;
          if (eq > pk) pk = eq;
          if ((pk - eq) / pk >= ruinThresholdFraction) {
            testRuined++;
            break;
          }
        }
      }
      const ruinRate = parseFloat(((testRuined / 300) * 100).toFixed(1));
      return { risk: testRisk, ruinRate };
    });

    // Drawdown Bins Histogram
    const ddBins = [
      { label: '<10%', count: 0, color: '#10b981' },
      { label: '10-15%', count: 0, color: '#3b82f6' },
      { label: '15-20%', count: 0, color: '#f59e0b' },
      { label: '20-25%', count: 0, color: '#f97316' },
      { label: '25-35%', count: 0, color: '#f43f5e' },
      { label: '>35%', count: 0, color: '#e11d48' },
    ];

    maxDrawdowns.forEach((dd) => {
      const p = dd * 100;
      if (p < 10) ddBins[0].count++;
      else if (p < 15) ddBins[1].count++;
      else if (p < 20) ddBins[2].count++;
      else if (p < 25) ddBins[3].count++;
      else if (p < 35) ddBins[4].count++;
      else ddBins[5].count++;
    });

    return {
      trajectories,
      percentileBands,
      medianDrawdownPct,
      valueAtRisk95,
      worstDrawdownPct,
      medianFinalEquity,
      p95FinalEquity,
      p5FinalEquity,
      ruinProbabilityPct,
      lossProbabilityPct,
      worstDdRun,
      bestFinalRun,
      streakProbabilities,
      fullKellyPct,
      halfKellyPct,
      sensitivityGrid,
      ddBins,
      numSims: NUM_SIMS,
    };
  }, [winRate, payoffRatio, riskPerTrade, numTrades, ruinDrawdownThreshold, startingCapital, randomSeed]);

  // Coordinate Mapping for Fan Chart SVG
  const svgW = 900;
  const svgH = 240;
  const padL = 70;
  const padR = 30;
  const padT = 25;
  const padB = 35;
  const pW = svgW - padL - padR;
  const pH = svgH - padT - padB;

  // Scale ranges
  const minEqVal = useMemo(() => {
    const p5Min = Math.min(...simulationResults.percentileBands.map((b) => b.p5));
    const worstMin = Math.min(...simulationResults.worstDdRun.path);
    return Math.max(100, Math.min(startingCapital * (1 - ruinDrawdownThreshold / 100) * 0.9, p5Min, worstMin));
  }, [simulationResults, startingCapital, ruinDrawdownThreshold]);

  const maxEqVal = useMemo(() => {
    const p95Max = Math.max(...simulationResults.percentileBands.map((b) => b.p95));
    return Math.max(startingCapital * 1.5, p95Max * 1.05);
  }, [simulationResults, startingCapital]);

  const eqRange = maxEqVal - minEqVal || 1;

  const getX = (step: number) => padL + (step / numTrades) * pW;
  const getY = (val: number) => padT + pH - ((val - minEqVal) / eqRange) * pH;

  // Build SVG Shaded Confidence Ribbon (5th to 95th Percentile)
  const ribbon90Path = useMemo(() => {
    const upper = simulationResults.percentileBands.map((b) => `${getX(b.step).toFixed(1)},${getY(b.p95).toFixed(1)}`);
    const lower = [...simulationResults.percentileBands]
      .reverse()
      .map((b) => `${getX(b.step).toFixed(1)},${getY(b.p5).toFixed(1)}`);
    return `M ${upper.join(' L ')} L ${lower.join(' L ')} Z`;
  }, [simulationResults, minEqVal, maxEqVal]);

  // Build SVG Inner Ribbon (25th to 75th Percentile)
  const ribbon50Path = useMemo(() => {
    const upper = simulationResults.percentileBands.map((b) => `${getX(b.step).toFixed(1)},${getY(b.p75).toFixed(1)}`);
    const lower = [...simulationResults.percentileBands]
      .reverse()
      .map((b) => `${getX(b.step).toFixed(1)},${getY(b.p25).toFixed(1)}`);
    return `M ${upper.join(' L ')} L ${lower.join(' L ')} Z`;
  }, [simulationResults, minEqVal, maxEqVal]);

  // Build Median Line Path
  const medianLinePath = useMemo(() => {
    return simulationResults.percentileBands
      .map((b, i) => `${i === 0 ? 'M' : 'L'} ${getX(b.step).toFixed(1)} ${getY(b.p50).toFixed(1)}`)
      .join(' ');
  }, [simulationResults, minEqVal, maxEqVal]);

  // Build Worst-Case Path
  const worstLinePath = useMemo(() => {
    if (simulationResults.worstDdRun.path.length === 0) return '';
    return simulationResults.worstDdRun.path
      .map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)}`)
      .join(' ');
  }, [simulationResults, minEqVal, maxEqVal]);

  // Ruin Threshold Y Position
  const ruinY = getY(startingCapital * (1 - ruinDrawdownThreshold / 100));
  const startCapitalY = getY(startingCapital);

  // Handle SVG Mouse Hover on Chart
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgW;
    const clampedX = Math.max(padL, Math.min(svgW - padR, mouseX));
    const step = Math.round(((clampedX - padL) / pW) * numTrades);
    setHoveredTradeIdx(step);
  };

  const inspectedStepData =
    hoveredTradeIdx !== null
      ? simulationResults.percentileBands[hoveredTradeIdx] || simulationResults.percentileBands[numTrades]
      : simulationResults.percentileBands[numTrades];

  // Ruin Risk Category
  const ruinCategory = useMemo(() => {
    const p = simulationResults.ruinProbabilityPct;
    if (p < 0.5) return { label: 'MINIMAL RISK', color: 'var(--color-bullish)', bg: 'rgba(16, 185, 129, 0.15)' };
    if (p < 3.0) return { label: 'MODERATE RISK', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    if (p < 10.0) return { label: 'ELEVATED RISK', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' };
    return { label: 'CATASTROPHIC RISK', color: 'var(--color-bearish)', bg: 'rgba(244, 63, 94, 0.2)' };
  }, [simulationResults.ruinProbabilityPct]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        backgroundColor: '#000000',
        borderRadius: isEmbedded ? '0' : 'var(--radius-md)',
        border: isEmbedded ? 'none' : '1px solid rgba(212, 175, 55, 0.3)',
        padding: isEmbedded ? '0' : '20px',
        color: '#ffffff',
      }}
    >
      {/* Engine Header & Quick Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Dice5 size={16} color="var(--color-accent-primary)" />
            <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.06em' }}>
              MONTE CARLO RISK SIMULATION & RUIN ENGINE
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              1,000 STOCHASTIC PATH AUDIT
            </span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', margin: '3px 0 0' }}>
            Ruin Probability & Outcome Envelope ({numTrades} Trades)
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '11px', margin: '2px 0 0' }}>
            Simulate 1,000 parallel market lifecycles to calculate risk of ruin, sequence-of-returns risk, and maximum drawdown confidence intervals.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Preset Buttons */}
          <button
            type="button"
            onClick={handleLoadJournalDefaults}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--color-text-secondary)',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ⚡ {sourceLabel}
          </button>
          <button
            type="button"
            onClick={handleLoadStressTestPreset}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              background: 'rgba(244, 63, 94, 0.06)',
              color: 'var(--color-bearish)',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ⚠️ Stress Regime
          </button>
          <button
            type="button"
            onClick={handleLoadConservativePreset}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              background: 'rgba(16, 185, 129, 0.06)',
              color: 'var(--color-bullish)',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🛡️ Conservative (1%)
          </button>
          <button
            id="btn-reroll-sims"
            type="button"
            onClick={handleReroll}
            disabled={isSimulating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--color-accent-primary)',
              background: isSimulating ? 'rgba(212, 175, 55, 0.3)' : 'rgba(212, 175, 55, 0.15)',
              color: 'var(--color-accent-primary)',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={12} className={isSimulating ? 'spin-animate' : ''} />
            <span>Re-Roll 1,000 Sims</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Top Monte Carlo Quant HUD (4 Key Risk Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 0',
        }}
      >
        {/* Card 1: Probability of Ruin */}
        <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
              PROBABILITY OF RUIN (&gt;{ruinDrawdownThreshold}% DD)
            </span>
            <span
              style={{
                fontSize: '8px',
                padding: '2px 6px',
                borderRadius: '3px',
                fontWeight: 900,
                backgroundColor: ruinCategory.bg,
                color: ruinCategory.color,
              }}
            >
              {ruinCategory.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span
              className="mono"
              style={{
                fontSize: '24px',
                fontWeight: 900,
                color: simulationResults.ruinProbabilityPct > 2 ? 'var(--color-bearish)' : 'var(--color-bullish)',
              }}
            >
              {simulationResults.ruinProbabilityPct}%
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              ({Math.round((simulationResults.ruinProbabilityPct / 100) * 1000)} / 1,000 runs)
            </span>
          </div>
          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
            {simulationResults.ruinProbabilityPct < 1
              ? 'Institutional-safe risk envelope'
              : 'Over-leveraged risk sizing warning!'}
          </span>
        </div>

        {/* Card 2: 95% Value-at-Risk (Drawdown) */}
        <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
              95% WORST-CASE DRAWDOWN (VaR)
            </span>
            <ShieldCheck size={12} color="var(--color-accent-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span className="mono bearish-text" style={{ fontSize: '24px', fontWeight: 900 }}>
              -{simulationResults.valueAtRisk95}%
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              Median: -{simulationResults.medianDrawdownPct}%
            </span>
          </div>
          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
            95% probability drawdown remains under this level
          </span>
        </div>

        {/* Card 3: Expected Median Final Equity */}
        <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
              MEDIAN EXPECTED CAPITAL (50TH %ILE)
            </span>
            <TrendingUp size={12} color="var(--color-bullish)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span className="mono bullish-text" style={{ fontSize: '24px', fontWeight: 900 }}>
              {formatCompactCurrency(simulationResults.medianFinalEquity)}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-bullish)', fontWeight: 800 }}>
              +{Math.min(9999, Math.round(((simulationResults.medianFinalEquity - startingCapital) / startingCapital) * 100))}%
            </span>
          </div>
          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
            90% Outcome Envelope: {formatCompactCurrency(simulationResults.p5FinalEquity)} - {formatCompactCurrency(simulationResults.p95FinalEquity)}
          </span>
        </div>

        {/* Card 4: Half-Kelly Recommendation */}
        <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
              RECOMMENDED RISK (HALF-KELLY)
            </span>
            <Percent size={12} color="#8b5cf6" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span className="mono" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-accent-primary)' }}>
              {Math.min(25, simulationResults.halfKellyPct)}%
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              Full: {Math.min(50, simulationResults.fullKellyPct)}%
            </span>
          </div>
          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
            Current: {riskPerTrade}% per trade ({riskPerTrade > simulationResults.halfKellyPct ? 'Above Half-Kelly' : 'Disciplined'})
          </span>
        </div>
      </div>

      {/* Interactive Parameter Controls Dock */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          padding: '12px 14px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Param 1: Risk Per Trade (%) Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>RISK PER TRADE</span>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 900, color: 'var(--color-accent-primary)' }}>
              {riskPerTrade}%
            </span>
          </div>
          <input
            id="slider-risk-per-trade"
            type="range"
            min="0.25"
            max="6.0"
            step="0.25"
            value={riskPerTrade}
            onChange={(e) => setRiskPerTrade(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-accent-primary)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#666', marginTop: '2px' }}>
            <span>0.5% (Safe)</span>
            <span>2.0% (Standard)</span>
            <span>5.0% (Aggressive)</span>
          </div>
        </div>

        {/* Param 2: Win Rate (%) Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>STRATEGY WIN RATE</span>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff' }}>
              {winRate}%
            </span>
          </div>
          <input
            id="slider-win-rate"
            type="range"
            min="30"
            max="80"
            step="1"
            value={winRate}
            onChange={(e) => setWinRate(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: 'var(--color-accent-primary)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#666', marginTop: '2px' }}>
            <span>40%</span>
            <span>55%</span>
            <span>70%</span>
          </div>
        </div>

        {/* Param 3: Payoff Ratio Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>PAYOFF RATIO (WIN/LOSS)</span>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff' }}>
              {payoffRatio}x
            </span>
          </div>
          <input
            id="slider-payoff-ratio"
            type="range"
            min="0.8"
            max="4.0"
            step="0.1"
            value={payoffRatio}
            onChange={(e) => setPayoffRatio(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-accent-primary)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#666', marginTop: '2px' }}>
            <span>1.0x</span>
            <span>2.0x</span>
            <span>3.5x</span>
          </div>
        </div>

        {/* Param 4: Ruin Threshold */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>RUIN DD THRESHOLD</span>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 900, color: 'var(--color-bearish)' }}>
              -{ruinDrawdownThreshold}%
            </span>
          </div>
          <input
            id="slider-ruin-threshold"
            type="range"
            min="15"
            max="50"
            step="5"
            value={ruinDrawdownThreshold}
            onChange={(e) => setRuinDrawdownThreshold(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: 'var(--color-bearish)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#666', marginTop: '2px' }}>
            <span>-15% (Tight)</span>
            <span>-25% (Standard)</span>
            <span>-50% (Max)</span>
          </div>
        </div>

        {/* Param 5: Trade Horizon Sequence */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>TRADE HORIZON</span>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff' }}>
              {numTrades} Trades
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
            {[50, 100, 200, 300].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setNumTrades(count)}
                style={{
                  flex: 1,
                  padding: '4px 0',
                  borderRadius: '3px',
                  border: numTrades === count ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: numTrades === count ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  color: numTrades === count ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                  fontSize: '9px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Workspace Mode Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-sm)', padding: '2px', gap: '2px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('CONE')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'CONE' ? 'var(--color-accent-primary)' : 'transparent',
              color: activeTab === 'CONE' ? '#08080a' : 'var(--color-text-secondary)',
            }}
          >
            📉 Cone of Outcomes (Fan Chart)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DISTRIBUTION')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'DISTRIBUTION' ? 'var(--color-accent-primary)' : 'transparent',
              color: activeTab === 'DISTRIBUTION' ? '#08080a' : 'var(--color-text-secondary)',
            }}
          >
            📊 Drawdown & VaR Distribution
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('STREAKS')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'STREAKS' ? 'var(--color-accent-primary)' : 'transparent',
              color: activeTab === 'STREAKS' ? '#08080a' : 'var(--color-text-secondary)',
            }}
          >
            🔥 Losing Streak Probability Clusters
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('KELLY')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'KELLY' ? 'var(--color-accent-primary)' : 'transparent',
              color: activeTab === 'KELLY' ? '#08080a' : 'var(--color-text-secondary)',
            }}
          >
            ⚖️ Kelly Risk Sizing Curve
          </button>
        </div>

        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
          Simulation Seed: <strong className="mono" style={{ color: '#aaa' }}>{randomSeed}</strong>
        </span>
      </div>

      {/* TAB 1: CONE OF OUTCOMES (FAN CHART) */}
      {activeTab === 'CONE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: `${svgH}px`,
              backgroundColor: '#040406',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <svg
              width="100%"
              height={svgH}
              viewBox={`0 0 ${svgW} ${svgH}`}
              preserveAspectRatio="none"
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={() => setHoveredTradeIdx(null)}
              style={{ cursor: 'crosshair', display: 'block' }}
            >
              <defs>
                <linearGradient id="mcRibbon90" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id="mcRibbon50" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
                </linearGradient>
              </defs>

              {/* Ruin Boundary Background Danger Zone */}
              <rect
                x={padL}
                y={ruinY}
                width={pW}
                height={Math.max(0, svgH - padB - ruinY)}
                fill="rgba(244, 63, 94, 0.06)"
              />
              <line
                x1={padL}
                y1={ruinY}
                x2={svgW - padR}
                y2={ruinY}
                stroke="rgba(244, 63, 94, 0.45)"
                strokeDasharray="4 4"
                strokeWidth="1.2"
              />
              <text
                x={svgW - padR - 6}
                y={ruinY - 4}
                textAnchor="end"
                fill="var(--color-bearish)"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="800"
              >
                RUIN THRESHOLD (-{ruinDrawdownThreshold}%)
              </text>

              {/* Starting Capital Watermark Line */}
              <line
                x1={padL}
                y1={startCapitalY}
                x2={svgW - padR}
                y2={startCapitalY}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={startCapitalY + 3}
                textAnchor="end"
                fill="rgba(255, 255, 255, 0.4)"
                fontSize="9"
                fontFamily="monospace"
              >
                ${(startingCapital / 1000).toFixed(0)}k
              </text>

              {/* Y-Axis Watermarks */}
              <text
                x={padL - 8}
                y={padT + 4}
                textAnchor="end"
                fill="rgba(255, 255, 255, 0.5)"
                fontSize="9"
                fontFamily="monospace"
              >
                ${(maxEqVal / 1000).toFixed(0)}k
              </text>
              <text
                x={padL - 8}
                y={padT + pH}
                textAnchor="end"
                fill="rgba(255, 255, 255, 0.5)"
                fontSize="9"
                fontFamily="monospace"
              >
                ${(minEqVal / 1000).toFixed(0)}k
              </text>

              {/* 40 Backdrop Filament Simulation Trajectories */}
              {simulationResults.trajectories.map((path, pIdx) => {
                const pathStr = path
                  .map((val, step) => `${step === 0 ? 'M' : 'L'} ${getX(step).toFixed(1)} ${getY(val).toFixed(1)}`)
                  .join(' ');
                return (
                  <path
                    key={`trj-${pIdx}`}
                    d={pathStr}
                    fill="none"
                    stroke="rgba(212, 175, 55, 0.05)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* 90% Confidence Envelope (5th to 95th Percentile) */}
              <path d={ribbon90Path} fill="url(#mcRibbon90)" />

              {/* 50% Confidence Core (25th to 75th Percentile) */}
              <path d={ribbon50Path} fill="url(#mcRibbon50)" />

              {/* Worst Case Drawdown Simulation Path */}
              {worstLinePath && (
                <path
                  d={worstLinePath}
                  fill="none"
                  stroke="rgba(244, 63, 94, 0.8)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Expected Median Path (50th Percentile) */}
              {medianLinePath && (
                <path
                  d={medianLinePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Step Grid Marks */}
              {[0.25, 0.5, 0.75, 1.0].map((fraction, fIdx) => {
                const stepVal = Math.round(numTrades * fraction);
                const xVal = getX(stepVal);
                return (
                  <g key={`step-${fIdx}`}>
                    <line
                      x1={xVal}
                      y1={padT}
                      x2={xVal}
                      y2={svgH - padB}
                      stroke="rgba(255, 255, 255, 0.04)"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                    <text
                      x={xVal}
                      y={svgH - 12}
                      textAnchor="middle"
                      fill="rgba(255, 255, 255, 0.4)"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      #{stepVal}
                    </text>
                  </g>
                );
              })}

              {/* Hover Inspection Crosshair & Nodes */}
              {inspectedStepData && (
                <g>
                  <line
                    x1={getX(inspectedStepData.step)}
                    y1={padT}
                    x2={getX(inspectedStepData.step)}
                    y2={svgH - padB}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  {/* Median Node */}
                  <circle
                    cx={getX(inspectedStepData.step)}
                    cy={getY(inspectedStepData.p50)}
                    r={5}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* P95 Node */}
                  <circle
                    cx={getX(inspectedStepData.step)}
                    cy={getY(inspectedStepData.p95)}
                    r={3.5}
                    fill="var(--color-accent-primary)"
                    stroke="#000"
                    strokeWidth="1"
                  />
                  {/* P5 Node */}
                  <circle
                    cx={getX(inspectedStepData.step)}
                    cy={getY(inspectedStepData.p5)}
                    r={3.5}
                    fill="#f59e0b"
                    stroke="#000"
                    strokeWidth="1"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Dynamic Inspector Legend & Step HUD */}
          {inspectedStepData && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '8px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 900, color: '#ffffff' }}>
                  TRADE #{inspectedStepData.step} / {numTrades}:
                </span>
                <span style={{ color: 'var(--color-bullish)', fontWeight: 800 }}>
                  Median Expected: ${Math.round(inspectedStepData.p50).toLocaleString()} USD
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                <span>
                  Upper Bullish (95th %ile): <strong style={{ color: 'var(--color-accent-primary)' }}>${Math.round(inspectedStepData.p95).toLocaleString()}</strong>
                </span>
                <span>
                  Conservative (5th %ile): <strong style={{ color: '#f59e0b' }}>${Math.round(inspectedStepData.p5).toLocaleString()}</strong>
                </span>
                <span>
                  Worst Simulated Run: <strong style={{ color: 'var(--color-bearish)' }}>-{simulationResults.worstDrawdownPct}% DD</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DRAWDOWN & VAR DISTRIBUTION */}
      {activeTab === 'DISTRIBUTION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#040406',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>
                  PEAK DRAWDOWN OCCURRENCE HISTOGRAM (1,000 RUNS)
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>
                  How deep will your drawdown get over {numTrades} consecutive trades?
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  95% VaR: <strong className="mono bearish-text">-{simulationResults.valueAtRisk95}%</strong>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '140px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {simulationResults.ddBins.map((bin, bIdx) => {
                const maxBinCount = Math.max(...simulationResults.ddBins.map((b) => b.count)) || 1;
                const barHeight = Math.max(8, (bin.count / maxBinCount) * 110);
                const pctOfSims = ((bin.count / simulationResults.numSims) * 100).toFixed(1);

                return (
                  <div
                    key={`ddbin-${bIdx}`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', fontWeight: 800 }}>
                      {pctOfSims}%
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '48px',
                        height: `${barHeight}px`,
                        backgroundColor: bin.color,
                        borderRadius: '3px 3px 0 0',
                        opacity: 0.85,
                        transition: 'height 0.2s ease',
                      }}
                    />
                    <span style={{ fontSize: '9px', color: '#fff', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {bin.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              <span>
                💡 <strong>Quant Insight:</strong> In {100 - parseFloat(simulationResults.ruinProbabilityPct.toString())}% of lifecycles, maximum peak-to-trough drawdown never touches the -{ruinDrawdownThreshold}% catastrophic boundary.
              </span>
              <span className="mono" style={{ color: 'var(--color-accent-primary)' }}>
                Median Drawdown: -{simulationResults.medianDrawdownPct}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOSING STREAK PROBABILITY CLUSTERS */}
      {activeTab === 'STREAKS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#040406',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>
                CONSECUTIVE LOSS CLUSTERING PROBABILITY ({numTrades} TRADE HORIZON)
              </span>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '11px', margin: '2px 0 0' }}>
                Even with a high win rate of {winRate}%, random variance guarantees that losing streaks WILL cluster. This matrix computes the exact mathematical certainty of losing streaks over {numTrades} trades.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {[
                { count: 3, prob: simulationResults.streakProbabilities.three, impact: (1 - Math.pow(1 - riskPerTrade / 100, 3)) * 100 },
                { count: 4, prob: simulationResults.streakProbabilities.four, impact: (1 - Math.pow(1 - riskPerTrade / 100, 4)) * 100 },
                { count: 5, prob: simulationResults.streakProbabilities.five, impact: (1 - Math.pow(1 - riskPerTrade / 100, 5)) * 100 },
                { count: 6, prob: simulationResults.streakProbabilities.six, impact: (1 - Math.pow(1 - riskPerTrade / 100, 6)) * 100 },
                { count: 8, prob: simulationResults.streakProbabilities.eight, impact: (1 - Math.pow(1 - riskPerTrade / 100, 8)) * 100 },
                { count: 10, prob: simulationResults.streakProbabilities.ten, impact: (1 - Math.pow(1 - riskPerTrade / 100, 10)) * 100 },
              ].map((streak) => (
                <div
                  key={`streak-${streak.count}`}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: streak.prob > 50 ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${streak.prob > 50 ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, display: 'block' }}>
                    {streak.count} LOSSES IN A ROW
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: '18px',
                        fontWeight: 900,
                        color: streak.prob > 50 ? 'var(--color-bearish)' : '#ffffff',
                      }}
                    >
                      {streak.prob}%
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>chance</span>
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '9px', color: 'var(--color-text-secondary)' }}>
                    Drawdown Impact:{' '}
                    <strong className="mono" style={{ color: 'var(--color-bearish)' }}>
                      -{streak.impact.toFixed(1)}%
                    </strong>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'rgba(212, 175, 55, 0.06)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                fontSize: '11px',
                color: 'var(--color-accent-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Info size={16} />
              <span>
                <strong>Psychological Preparedness:</strong> Over {numTrades} trades, you have a{' '}
                <strong>{simulationResults.streakProbabilities.four}% probability</strong> of suffering 4 consecutive losses. Sized at {riskPerTrade}% risk, this equals only a{' '}
                <strong>-{((1 - Math.pow(1 - riskPerTrade / 100, 4)) * 100).toFixed(1)}% drawdown</strong>, preserving psychological composure.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KELLY RISK SIZING SENSITIVITY CURVE */}
      {activeTab === 'KELLY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#040406',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>
                KELLY CRITERION & SENSITIVITY TO RISK-PER-TRADE
              </span>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '11px', margin: '2px 0 0' }}>
                The Kelly Criterion identifies the mathematical limit of capital growth. Exceeding Half-Kelly exponentially increases the probability of catastrophic drawdown.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '6px' }}>
              {simulationResults.sensitivityGrid.map((item) => {
                const isCurrent = Math.abs(item.risk - riskPerTrade) < 0.2;
                const isDanger = item.ruinRate > 5.0;

                return (
                  <div
                    key={`risk-${item.risk}`}
                    onClick={() => setRiskPerTrade(item.risk)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: isCurrent
                        ? 'rgba(212, 175, 55, 0.15)'
                        : isDanger
                        ? 'rgba(244, 63, 94, 0.06)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: isCurrent
                        ? '1px solid var(--color-accent-primary)'
                        : isDanger
                        ? '1px solid rgba(244, 63, 94, 0.25)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '10px', fontWeight: 900, color: isCurrent ? 'var(--color-accent-primary)' : '#fff' }}>
                      {item.risk}% Risk
                    </span>
                    <div style={{ marginTop: '4px' }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: '11px',
                          fontWeight: 900,
                          color: item.ruinRate > 1 ? 'var(--color-bearish)' : 'var(--color-bullish)',
                        }}
                      >
                        {item.ruinRate}% Ruin
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-bullish)' }}>
                  ✅ HALF-KELLY SWEET SPOT: {simulationResults.halfKellyPct}% RISK
                </span>
                <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  Captures 75% of maximum theoretical compound growth while reducing portfolio volatility and drawdown variance by over 50%.
                </p>
              </div>

              <div style={{ padding: '10px 14px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-bearish)' }}>
                  ⚠️ OVER-LEVERAGING CLIFF (&gt;4.0% RISK)
                </span>
                <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  Risking more than 4% per trade sharply accelerates the probability of catastrophic ruin due to geometric decay on losing streak clusters.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
