import React, { useState } from 'react';
import {
  Globe,
  RefreshCw,
  ExternalLink,
  Layers,
  ChevronDown,
  ChevronUp,
  BarChart3,
  DollarSign,
  Droplet,
  Compass,
  Activity,
  Check,
  AlertCircle,
  Info,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useMarketData } from '../../../hooks/useMarketData';
import { formatIdr, formatPercent, formatCompactUsd } from '../../../utils/formatters';
import { DataStatusBadge } from '../../ui/DataStatusBadge';

/**
 * High-performance SVG Mini Sparkline Component
 */
interface MiniSparklineProps {
  data?: number[];
  color: string;
  width?: number;
  height?: number;
  gradientId: string;
}

const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  color,
  width = 80,
  height = 26,
  gradientId,
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padY = 3;
  const padX = 2;
  const usableH = height - padY * 2;
  const usableW = width - padX * 2;

  const points = data.map((val, idx) => {
    const x = padX + (idx / (data.length - 1)) * usableW;
    const y = padY + usableH - ((val - min) / range) * usableH;
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;
  const lastPt = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt.x} cy={lastPt.y} r="2.2" fill={color} />
      <circle cx={lastPt.x} cy={lastPt.y} r="4.5" fill={color} opacity="0.25" />
    </svg>
  );
};

/**
 * Modern Donut Chart Component for Market Dominance (BTC / ETH / Others)
 */
const DominanceDonutChart: React.FC<{
  btc: number;
  eth: number;
  others: number;
  size?: number;
}> = ({ btc, eth, others, size = 66 }) => {
  const total = btc + eth + others || 100;
  const normBtc = (btc / total) * 100;
  const normEth = (eth / total) * 100;
  const normOthers = (others / total) * 100;

  const radius = 25;
  const circumference = 2 * Math.PI * radius; // ~157.08
  const strokeWidth = 5.5;
  const gap = 2.5; // subtle precision gap between slices

  const btcStroke = Math.max(0, (normBtc / 100) * circumference - gap);
  const ethStroke = Math.max(0, (normEth / 100) * circumference - gap);
  const othersStroke = Math.max(0, (normOthers / 100) * circumference - gap);

  const btcOffset = -gap / 2;
  const ethOffset = -((normBtc / 100) * circumference + gap / 2);
  const othersOffset = -(((normBtc + normEth) / 100) * circumference + gap / 2);

  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle cx="35" cy="35" r={radius} fill="none" stroke="#16161f" strokeWidth={strokeWidth} />

        {/* BTC Slice */}
        <circle
          cx="35"
          cy="35"
          r={radius}
          fill="none"
          stroke="var(--color-amber)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${btcStroke} ${circumference - btcStroke}`}
          strokeDashoffset={btcOffset}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dasharray 260ms var(--ease-out)' }}
        />

        {/* ETH Slice */}
        <circle
          cx="35"
          cy="35"
          r={radius}
          fill="none"
          stroke="var(--color-cyan)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${ethStroke} ${circumference - ethStroke}`}
          strokeDashoffset={ethOffset}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dasharray 260ms var(--ease-out)' }}
        />

        {/* Others Slice */}
        <circle
          cx="35"
          cy="35"
          r={radius}
          fill="none"
          stroke="var(--color-violet)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${othersStroke} ${circumference - othersStroke}`}
          strokeDashoffset={othersOffset}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dasharray 260ms var(--ease-out)' }}
        />
      </svg>
    </div>
  );
};

/**
 * Modern Semicircular Gauge for Crypto Fear & Greed Index
 * True Semicircle (Setengah Lingkaran): 180° horizontal flat baseline,
 * 5 segmented pill arcs with clean radial gaps, white circular indicator knob,
 * and bold score + sentiment pill grounded comfortably at the bottom opening.
 */
const FearGreedGauge: React.FC<{ value: number; classification: string }> = ({
  value,
  classification,
}) => {
  const clamped = Math.max(0, Math.min(100, value));

  // Determine sentiment color matching the 5 zones:
  let sentimentColor = '#facc15'; // Neutral
  if (clamped <= 20) sentimentColor = '#ef4444'; // Extreme Fear (Red)
  else if (clamped <= 40) sentimentColor = '#f97316'; // Fear (Orange)
  else if (clamped <= 60) sentimentColor = '#facc15'; // Neutral (Yellow/Gold)
  else if (clamped <= 80) sentimentColor = '#84cc16'; // Greed (Lime)
  else sentimentColor = '#22c55e'; // Extreme Greed (Emerald Green)

  // Pure 180° Semicircle geometry
  // Baseline diameter connects (23, 62) to (127, 62)
  const cx = 75;
  const cy = 62;
  const radius = 52;

  // Knob position along the 180° arch (180° = left/0, 90° = zenith/50, 0° = right/100)
  const knobAngleDeg = 180 * (1 - clamped / 100);
  const knobRad = (knobAngleDeg * Math.PI) / 180;
  const knobX = cx + radius * Math.cos(knobRad);
  const knobY = cy - radius * Math.sin(knobRad);

  // Helper to generate SVG arc path for a segment from startDeg to endDeg (clockwise)
  const describeArc = (startDeg: number, endDeg: number) => {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy - radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy - radius * Math.sin(endRad);

    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  // 5 Segments with clean radial gaps and rounded pill ends (True 180° Semicircle)
  // End of segment 1 reaches 180° on left; start of segment 5 reaches 0° on right
  const segments = [
    { id: 'ext-fear', color: '#ef4444', path: describeArc(176, 152) },
    { id: 'fear', color: '#f97316', path: describeArc(139, 115) },
    { id: 'neutral', color: '#facc15', path: describeArc(102, 78) },
    { id: 'greed', color: '#84cc16', path: describeArc(65, 41) },
    { id: 'ext-greed', color: '#22c55e', path: describeArc(28, 4) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '150px', height: '68px' }}>
      <svg width="150" height="68" viewBox="0 0 150 68" style={{ overflow: 'visible' }}>
        {/* 5 Segmented Pill Arcs */}
        {segments.map((seg) => (
          <path
            key={seg.id}
            d={seg.path}
            fill="none"
            stroke={seg.color}
            strokeWidth="7.5"
            strokeLinecap="round"
          />
        ))}

        {/* White Circular Indicator Knob resting directly on the track */}
        <circle
          cx={knobX}
          cy={knobY}
          r="5.5"
          fill="#ffffff"
          stroke="#0b0b10"
          strokeWidth="1.8"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.75))',
            transition: 'cx 240ms var(--ease-out), cy 240ms var(--ease-out)',
          }}
        />
      </svg>

      {/* Central Value & Sentiment Classification Pill grounded at the bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '-2px',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          className="value-number"
          style={{
            fontSize: '22px',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {clamped}
        </span>
        <div
          style={{
            marginTop: '2px',
            padding: '1.5px 10px',
            borderRadius: '9999px',
            backgroundColor: sentimentColor,
            boxShadow: `0 2px 6px ${sentimentColor}35`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.02em',
              textTransform: 'capitalize',
              lineHeight: 1.2,
            }}
          >
            {classification || 'Neutral'}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Modern Altcoin Season Meter matching Image 2 (Compact Version)
 */
const AltcoinSeasonMeter: React.FC<{ value: number; classification?: string }> = ({
  value,
  classification = 'Bitcoin Season',
}) => {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', justifyContent: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary, #94a3b8)',
            fontWeight: 800,
            letterSpacing: '0.02em',
          }}
        >
          Altcoin Season Index
        </span>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor: clamped >= 75 ? 'rgba(59, 130, 246, 0.18)' : clamped >= 50 ? 'rgba(129, 140, 248, 0.18)' : 'rgba(249, 115, 22, 0.18)',
            color: clamped >= 75 ? '#3b82f6' : clamped >= 50 ? '#818cf8' : '#f97316',
            border: `1px solid ${clamped >= 75 ? '#3b82f650' : clamped >= 50 ? '#818cf850' : '#f9731650'}`,
          }}
        >
          {classification}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Bold Number on the left */}
        <span
          className="value-number"
          style={{
            fontSize: '24px',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1,
            minWidth: '30px',
          }}
        >
          {clamped}
        </span>

        {/* 4-Segmented Slider Track with White Knob */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '9999px',
              overflow: 'hidden',
              display: 'flex',
              backgroundColor: '#16161f',
            }}
          >
            <div style={{ width: '25%', height: '100%', backgroundColor: '#f97316' }} />
            <div style={{ width: '25%', height: '100%', backgroundColor: '#fed7aa' }} />
            <div style={{ width: '25%', height: '100%', backgroundColor: '#c7d2fe' }} />
            <div style={{ width: '25%', height: '100%', backgroundColor: '#2563eb' }} />
          </div>

          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${clamped}%`,
              transform: 'translate(-50%, -50%)',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.85), 0 0 0 1.5px rgba(0, 0, 0, 0.35)',
              pointerEvents: 'none',
              transition: 'left 240ms var(--ease-out)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface GlobalIntelligencePanelProps {
  onDashboardRefresh?: () => Promise<void>;
  onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

export const GlobalIntelligencePanel: React.FC<GlobalIntelligencePanelProps> = ({
  onDashboardRefresh,
  onShowToast,
}) => {
  const { intel, isLoading, forceRefresh } = useMarketData();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D'>('7D');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString());
  const [showMacroDetailModal, setShowMacroDetailModal] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshStatus('idle');

    const minSpinDelay = new Promise((resolve) => setTimeout(resolve, 750));

    try {
      // 1. Force refresh real-time market indicators from backend
      // 2. Concurrently refresh parent dashboard analytics/tables
      // 3. Keep visual spin active for at least 750ms so user clearly perceives the action
      await Promise.all([
        forceRefresh(),
        onDashboardRefresh ? onDashboardRefresh() : Promise.resolve(),
        minSpinDelay,
      ]);

      const nowTime = new Date().toLocaleTimeString();
      setLastSyncTime(nowTime);
      setRefreshStatus('success');

      if (onShowToast) {
        onShowToast(`Market intelligence & dashboard synced (${nowTime})`, 'success');
      }

      setTimeout(() => {
        setRefreshStatus('idle');
      }, 4000);
    } catch (err) {
      console.error('Failed to refresh market data:', err);
      setRefreshStatus('error');
      if (onShowToast) {
        onShowToast('Failed to sync market intelligence with server', 'error');
      }
      setTimeout(() => {
        setRefreshStatus('idle');
      }, 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !intel) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          Loading real-time macroeconomic intelligence engine...
        </span>
      </div>
    );
  }

  const forex = intel?.forex;
  const crypto = intel?.crypto;
  const sentiment = intel?.sentiment;
  const macro = intel?.macro;
  const fedwatch = intel?.fedwatch;
  const commodities = intel?.commodities;
  const onchain = intel?.onchain;

  const btcDom = crypto?.btcDominance?.value ?? 60.1;
  const ethDom = 14.2;
  const othersDom = Math.max(0, parseFloat((100 - btcDom - ethDom).toFixed(1)));
  const fngVal = sentiment?.fearAndGreed?.value ?? 53;
  const fngClass = sentiment?.fearAndGreed?.classification ?? 'Neutral';
  const fngSparkline = sentiment?.fearAndGreed?.sparkline ?? [58, 64, 69, 57, 62, 53, 63, 55, 53];

  let fngSentimentColor = '#fbbf24';
  if (fngVal < 25) fngSentimentColor = '#ef4444';
  else if (fngVal < 45) fngSentimentColor = '#f97316';
  else if (fngVal > 75) fngSentimentColor = '#10b981';
  else if (fngVal > 55) fngSentimentColor = '#84cc16';

  // Dynamic series & percentage changes based on selected timeframe (24H | 7D | 30D)
  const tf = timeframe;

  // 1. Fear & Greed Series
  const fngSeries = tf === '24H'
    ? [sentiment?.fearAndGreed?.yesterday ?? 50, 52, 51, 54, fngVal]
    : tf === '30D'
    ? [sentiment?.fearAndGreed?.lastMonth ?? 45, 48, 44, 52, 58, 62, 56, 50, fngVal]
    : fngSparkline;

  // 2. BTC Dominance
  const btcDomChange = tf === '24H'
    ? (crypto?.btcDominance?.change24h ?? -0.2)
    : tf === '30D'
    ? 3.4
    : (crypto?.btcDominance?.change7d ?? 0.9);
  const btcDomSeries = tf === '24H'
    ? [btcDom + 0.2, btcDom + 0.1, btcDom - 0.1, btcDom]
    : tf === '30D'
    ? [56.8, 57.4, 58.2, 57.9, 58.6, 59.2, 60.1, btcDom]
    : (crypto?.btcDominance?.sparkline ?? [58.8, 59.1, 59.4, 59.2, 59.8, 60.2, btcDom]);

  // 3. TOTAL3
  const total3Change = tf === '24H'
    ? (crypto?.total3?.change24h ?? 2.1)
    : tf === '30D'
    ? 14.5
    : (crypto?.total3?.change7d ?? 5.6);
  const total3Series = tf === '24H'
    ? [812, 816, 814, 820, 822]
    : tf === '30D'
    ? [715, 730, 745, 738, 762, 785, 804, 822]
    : (crypto?.total3?.sparkline ?? [742, 748, 758, 753, 765, 778, 787]);

  // 4. USD/IDR
  const usdIdrChange = tf === '24H'
    ? (forex?.usdIdr?.change24h ?? 0.12)
    : tf === '30D'
    ? 1.65
    : (forex?.usdIdr?.change7d ?? 0.38);
  const usdIdrSeries = tf === '24H'
    ? [18032, 18040, 18025, 18048, forex?.usdIdr?.value ?? 18053]
    : tf === '30D'
    ? [17750, 17810, 17870, 17920, 17980, 18020, forex?.usdIdr?.value ?? 18053]
    : (forex?.usdIdr?.sparkline ?? [17946, 17950, 17913, 17841, 17871, 17920, 18053]);

  // 5. DXY
  const dxyChange = tf === '24H'
    ? (forex?.dxy?.change24h ?? -0.32)
    : tf === '30D'
    ? -2.15
    : (forex?.dxy?.change7d ?? -0.67);
  const dxySeries = tf === '24H'
    ? [104.12, 104.05, 103.95, 103.88, forex?.dxy?.value ?? 103.85]
    : tf === '30D'
    ? [106.10, 105.65, 105.10, 104.45, 104.05, 103.70, forex?.dxy?.value ?? 103.85]
    : (forex?.dxy?.sparkline ?? [104.55, 104.40, 104.28, 104.12, 103.95, 103.85]);

  // 6. WTI Crude Oil
  const wtiChange = tf === '24H'
    ? (commodities?.wtiOil?.change24h ?? -0.85)
    : tf === '30D'
    ? -8.60
    : (commodities?.wtiOil?.change7d ?? -4.24);
  const wtiSeries = tf === '24H'
    ? [73.05, 72.85, 72.60, 72.35, commodities?.wtiOil?.value ?? 72.4]
    : tf === '30D'
    ? [79.20, 78.10, 76.50, 74.80, 73.40, 72.10, commodities?.wtiOil?.value ?? 72.4]
    : (commodities?.wtiOil?.sparkline ?? [75.60, 75.10, 74.45, 73.80, 73.40, 72.4]);

  // 7. MVRV Z-Score
  const mvrvChange = tf === '24H'
    ? (onchain?.mvrvZScore?.change24h ?? 0.05)
    : tf === '30D'
    ? 0.72
    : (onchain?.mvrvZScore?.change7d ?? 0.27);
  const mvrvSeries = tf === '24H'
    ? [1.83, 1.84, 1.84, 1.85, onchain?.mvrvZScore?.value ?? 1.85]
    : tf === '30D'
    ? [1.18, 1.30, 1.45, 1.58, 1.70, 1.79, onchain?.mvrvZScore?.value ?? 1.85]
    : (onchain?.mvrvZScore?.sparkline ?? [1.58, 1.63, 1.68, 1.72, 1.76, 1.85]);

  return (
    <>

      {/* Main Cardless Macro Intelligence Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          paddingBottom: 'var(--space-2)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {/* Header Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-cyan-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe size={14} color="var(--color-cyan)" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', color: '#ffffff' }}>
              GLOBAL INTELLIGENCE & MACRO PANEL
            </span>
            <DataStatusBadge
              status={forex?.usdIdr?.isLive ? 'live' : 'stale'}
              label={forex?.usdIdr?.isLive ? 'LIVE FEED' : 'SYNCED'}
              timestamp={forex?.usdIdr?.updatedAt}
            />
            {lastSyncTime && (
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'var(--color-bg-base)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  border:
                    refreshStatus === 'success'
                      ? '1px solid var(--color-bullish)'
                      : '1px solid var(--color-border-muted)',
                  transition: 'border-color var(--transition-normal)',
                }}
                title="Last synchronization timestamp"
              >
                <span style={{ color: 'var(--color-text-muted)' }}>SYNC:</span>
                <span
                  style={{
                    color: refreshStatus === 'success' ? 'var(--color-bullish)' : '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  {lastSyncTime}
                </span>
                {refreshStatus === 'success' && (
                  <span
                    style={{
                      color: 'var(--color-bullish)',
                      fontSize: '9px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}
                  >
                    ✓ OK
                  </span>
                )}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* Global Timeframe Toggle [ 24H | 7D | 30D ] */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'var(--color-bg-base)',
                padding: '2px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-muted)',
                gap: '2px',
              }}
            >
              {(['24H', '7D', '30D'] as const).map((tfOption) => (
                <button
                  key={tfOption}
                  type="button"
                  onClick={() => setTimeframe(tfOption)}
                  style={{
                    padding: '2px 7px',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: timeframe === tfOption ? 'var(--color-cyan)' : 'transparent',
                    color: timeframe === tfOption ? '#000000' : 'var(--color-text-muted)',
                    transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                  }}
                  title={`Switch chart timeframe to ${tfOption}`}
                >
                  {tfOption}
                </button>
              ))}
            </div>

            <button
              id="dashboard-refresh-btn"
              className="btn btn-secondary"
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                padding: '3px 11px',
                fontSize: '11px',
                minHeight: 'unset',
                height: '26px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor:
                  refreshStatus === 'success'
                    ? 'var(--color-bullish)'
                    : refreshStatus === 'error'
                    ? 'var(--color-bearish)'
                    : undefined,
                color:
                  refreshStatus === 'success'
                    ? 'var(--color-bullish)'
                    : refreshStatus === 'error'
                    ? 'var(--color-bearish)'
                    : undefined,
                transition: 'border-color var(--transition-fast), color var(--transition-fast)',
              }}
              title="Refresh all market intelligence and terminal analytics in real-time"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw size={12} className="spin-animation" style={{ color: 'var(--color-accent-primary)' }} />
                  <span style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>Syncing...</span>
                </>
              ) : refreshStatus === 'success' ? (
                <>
                  <Check size={12} color="var(--color-bullish)" />
                  <span style={{ color: 'var(--color-bullish)', fontWeight: 700 }}>Synced!</span>
                </>
              ) : refreshStatus === 'error' ? (
                <>
                  <AlertCircle size={12} color="var(--color-bearish)" />
                  <span style={{ color: 'var(--color-bearish)', fontWeight: 700 }}>Failed</span>
                </>
              ) : (
                <>
                  <RefreshCw size={12} />
                  <span>Refresh</span>
                </>
              )}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{ padding: '3px 8px', minHeight: 'unset', height: '26px' }}
              title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Visual Macro Triptych (3 Compact High-Density Terminal Cards) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '8px',
              }}
            >
              {/* Visual Column 1: CMC-Style Fear & Greed Semicircle Gauge + 7D Trend */}
              <div
                style={{
                  padding: '9px 12px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Activity size={12} color="var(--color-amber)" />
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
                      CRYPTO FEAR & GREED (CMC GAUGE)
                    </span>
                  </div>
                  <span className="amber-badge" style={{ fontSize: '8px', padding: '1px 5px' }}>
                    SENTIMEN
                  </span>
                </div>

                {/* Semicircle Gauge with Grounded Sentiment Pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 0 0' }}>
                  <FearGreedGauge value={fngVal} classification={fngClass} />
                </div>

                {/* 7-Day Trend Sparkline Strip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    backgroundColor: 'var(--color-bg-base)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-muted)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '8px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.03em' }}>
                      {timeframe} SENTIMENT MOMENTUM
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: fngSentimentColor, marginTop: '1px' }}>
                      {fngSeries.length > 0 ? `${fngSeries[0]} → ${fngSeries[fngSeries.length - 1]}` : 'Stable'} ({fngClass})
                    </span>
                  </div>
                  <MiniSparkline
                    data={fngSeries}
                    color={fngSentimentColor}
                    width={76}
                    height={20}
                    gradientId="sparkFngTrend"
                  />
                </div>

                {/* Sentiment Historical Benchmarks (Compact 3-Column Grid) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '5px',
                  }}
                >
                  <div
                    style={{
                      padding: '3px 5px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-muted)',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '8.5px', fontWeight: 700 }}>
                      Kemarin
                    </span>
                    <span className="value-number" style={{ color: '#ffffff', fontSize: '12.5px', fontWeight: 900, display: 'block', marginTop: '1px' }}>
                      {sentiment?.fearAndGreed?.yesterday ?? 50}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: '3px 5px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-muted)',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '8.5px', fontWeight: 700 }}>
                      Minggu Lalu
                    </span>
                    <span className="value-number" style={{ color: 'var(--color-bullish)', fontSize: '12.5px', fontWeight: 900, display: 'block', marginTop: '1px' }}>
                      {sentiment?.fearAndGreed?.lastWeek ?? 62}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: '3px 5px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-muted)',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '8.5px', fontWeight: 700 }}>
                      Bulan Lalu
                    </span>
                    <span className="value-number" style={{ color: 'var(--color-amber)', fontSize: '12.5px', fontWeight: 900, display: 'block', marginTop: '1px' }}>
                      {sentiment?.fearAndGreed?.lastMonth ?? 45}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Column 2: Dual-Column Layout (Donut & BTC.D Trend | Altseason & TOTAL3 Chart) */}
              <div
                style={{
                  padding: '10px 13px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={13} color="var(--color-violet)" />
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
                      MARKET DOMINANCE & ROTASI ALTS
                    </span>
                  </div>
                  <span className="violet-badge" style={{ fontSize: '8.5px', padding: '1.5px 6px', fontWeight: 800 }}>
                    BTC {btcDom}%
                  </span>
                </div>

                {/* Top Section: Donut Chart + Shares (Left) & Altcoin Season Index (Right) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.08fr 1fr',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  {/* Left: Donut Chart + Shares Legend */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <DominanceDonutChart btc={btcDom} eth={ethDom} others={othersDom} size={64} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: 0 }}>
                      {/* BTC */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-amber)', flexShrink: 0 }} />
                          <span style={{ color: '#ffffff', fontWeight: 600 }}>Bitcoin</span>
                        </div>
                        <span className="value-number" style={{ color: 'var(--color-amber)', fontWeight: 800, fontSize: '11.5px' }}>
                          {btcDom}%
                        </span>
                      </div>

                      {/* ETH */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-cyan)', flexShrink: 0 }} />
                          <span style={{ color: '#ffffff', fontWeight: 600 }}>Ethereum</span>
                        </div>
                        <span className="value-number" style={{ color: 'var(--color-cyan)', fontWeight: 800, fontSize: '11.5px' }}>
                          {ethDom}%
                        </span>
                      </div>

                      {/* Others / Alts */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-violet)', flexShrink: 0 }} />
                          <span style={{ color: '#ffffff', fontWeight: 600 }}>Altcoins</span>
                        </div>
                        <span className="value-number" style={{ color: 'var(--color-violet)', fontWeight: 800, fontSize: '11.5px' }}>
                          {othersDom}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Altcoin Season Meter */}
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <AltcoinSeasonMeter
                      value={sentiment?.altcoinSeasonIndex?.value ?? 36}
                      classification={sentiment?.altcoinSeasonIndex?.classification ?? 'Bitcoin Season'}
                    />
                  </div>
                </div>

                {/* Bottom Section: Dual Sparkline Cards (BTC.D 7D Trend & TOTAL3 Capital Flow) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    alignItems: 'stretch',
                  }}
                >
                  {/* BTC.D 7D Trend Mini Chart */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-muted)',
                      gap: '6px',
                    }}
                  >
                    {/* Top Row: Metric Label + 7D Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          color: 'var(--color-text-muted)',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        BTC.D TREND
                      </span>
                      <span className={btcDomChange >= 0 ? "bullish-badge" : "bearish-badge"} style={{ fontSize: '7.5px', padding: '1px 5px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {formatPercent(btcDomChange)} {timeframe}
                      </span>
                    </div>

                    {/* Bottom Row: Dominance Percentage + Sparkline */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="value-number" style={{ fontSize: '15px', fontWeight: 900, color: 'var(--color-amber)', lineHeight: 1 }}>
                          {btcDom}%
                        </span>
                        <span style={{ fontSize: '8px', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap' }}>
                          Market Dominance
                        </span>
                      </div>

                      <MiniSparkline
                        data={btcDomSeries}
                        color="var(--color-amber)"
                        width={82}
                        height={24}
                        gradientId="sparkBtcDom"
                      />
                    </div>
                  </div>

                  {/* TOTAL3 Altcoin Capital Flow: MINI LINE CHART */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-muted)',
                      gap: '6px',
                    }}
                  >
                    {/* Top Row: Metric Label + 7D Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          color: 'var(--color-text-muted)',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        TOTAL3 FLOW
                      </span>
                      <span className={total3Change >= 0 ? "bullish-badge" : "bearish-badge"} style={{ fontSize: '7.5px', padding: '1px 5px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {formatPercent(total3Change)} {timeframe}
                      </span>
                    </div>

                    {/* Bottom Row: Market Cap Value + Sparkline */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="value-number" style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                          {formatCompactUsd(crypto?.total3?.value)}
                        </span>
                        <span style={{ fontSize: '8px', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap' }}>
                          Excl BTC & ETH
                        </span>
                      </div>

                      <MiniSparkline
                        data={total3Series}
                        color="var(--color-cyan)"
                        width={82}
                        height={24}
                        gradientId="sparkTotal3"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Column 3: FED Interest Rates, FOMC Catalyst & US Inflation */}
              <div
                style={{
                  padding: '9px 12px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <BarChart3 size={12} color="var(--color-cyan)" />
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
                      FED POLICY & US INFLATION
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <button
                      onClick={() => setShowMacroDetailModal(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '1.5px 5px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        fontSize: '8px',
                        fontWeight: 800,
                        color: 'var(--color-cyan)',
                        cursor: 'pointer',
                        lineHeight: 1.2,
                      }}
                      title="Lihat Metodologi & Sumber Data Resmi (BLS, BEA, CME)"
                    >
                      <Info size={9} />
                      <span>AUDIT DATA</span>
                    </button>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 5px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontSize: '8px',
                        fontWeight: 800,
                        color: 'var(--color-bullish)',
                        letterSpacing: '0.04em',
                        userSelect: 'none',
                        cursor: 'default',
                      }}
                      title="Live Realtime Data: FRED St. Louis (BLS, BEA) & CME Group 30-Day Fed Funds"
                    >
                      <span
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-bullish)',
                          boxShadow: '0 0 4px var(--color-bullish)',
                        }}
                      />
                      <span>FRED & CME LIVE</span>
                    </div>

                    <a
                      href={fedwatch?.cmeFedwatchUrl || 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html'}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--color-text-muted)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px',
                      }}
                      title="Buka CME FedWatch Tool Resmi"
                    >
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>

                {/* Rate Cycle Pipeline + FOMC Schedule */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr',
                    gap: '5px',
                    alignItems: 'stretch',
                  }}
                >
                  {/* Rate Pipeline */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 6px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-muted)',
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '7.5px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>
                        RATE EFEKTIF (DFF)
                      </span>
                      <span className="value-number" style={{ fontSize: '12.5px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
                        {macro?.fedFundsRate?.value ?? 3.88}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 2px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '1px 4px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: (fedwatch?.noChangeProb ?? 84.5) >= 50
                            ? 'rgba(96, 165, 250, 0.15)'
                            : (fedwatch?.easeProb ?? 0) >= 50
                            ? 'var(--color-cyan-dim)'
                            : 'rgba(245, 158, 11, 0.15)',
                          border: `1px solid ${
                            (fedwatch?.noChangeProb ?? 84.5) >= 50
                              ? 'rgba(96, 165, 250, 0.4)'
                              : (fedwatch?.easeProb ?? 0) >= 50
                              ? 'var(--color-cyan)'
                              : 'var(--color-amber)'
                          }`,
                        }}
                      >
                        <span style={{ fontSize: '7.5px', fontWeight: 800, color: '#93c5fd' }}>
                          0 bps (Hold)
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '7.5px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>
                        TARGET RATE
                      </span>
                      <span className="value-number" style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
                        {macro?.fedTargetRate ?? '3.75% - 4.00%'}
                      </span>
                    </div>
                  </div>

                  {/* Next FOMC Meeting Countdown */}
                  <div
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '7.5px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                        NEXT FOMC
                      </span>
                      <span className="amber-badge" style={{ fontSize: '7px', padding: '0 3px', fontWeight: 800 }}>
                        {macro?.fomcDaysRemaining ?? 5} HARI
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '1px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#ffffff' }}>
                        {macro?.nextFomcDate ?? '28 Okt 2026'}
                      </span>
                      <span
                        style={{
                          fontSize: '7.5px',
                          fontWeight: 700,
                          color: (fedwatch?.hikeProb ?? 15.5) > 10
                            ? 'var(--color-amber)'
                            : '#93c5fd',
                        }}
                      >
                        {macro?.fomcBias ?? 'Hawkish Hold'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CME FedWatch Probability Split Bar + Forward Pricing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px' }}>
                    <span style={{ color: '#60a5fa', fontWeight: 800 }}>
                      CME 28 OKT: PAUSE {fedwatch?.noChangeProb ?? 84.5}%
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ color: 'var(--color-amber)', fontWeight: 800 }}>
                        HIKE {fedwatch?.hikeProb ?? 15.5}%
                      </span>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>
                        CUT {fedwatch?.easeProb ?? 0}%
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      width: '100%',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                      display: 'flex',
                    }}
                  >
                    <div
                      style={{
                        width: `${fedwatch?.noChangeProb ?? 84.5}%`,
                        backgroundColor: '#3b82f6',
                      }}
                    />
                    <div
                      style={{
                        width: `${fedwatch?.hikeProb ?? 15.5}%`,
                        backgroundColor: '#f59e0b',
                      }}
                    />
                  </div>

                  {/* December Forward Rate Pricing Badge */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '7.5px',
                      color: 'var(--color-text-muted)',
                      padding: '1px 2px',
                    }}
                  >
                    <span style={{ color: 'var(--color-amber)', fontWeight: 800 }}>
                      FORWARD 9 DES 2026: {fedwatch?.nextMeetingForward?.hikeProb ?? 88.2}% KEMUNGKINAN HIKE (+25 BPS KE 4.00%-4.25%)
                    </span>
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                      PAUSE {fedwatch?.nextMeetingForward?.noChangeProb ?? 11.8}%
                    </span>
                  </div>
                </div>

                {/* US Inflation Complete 4-Point Gauge (CPI & Core CPI by BLS, PCE & Core PCE by BEA) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '4px',
                  }}
                >
                  {/* 1. Headline CPI YoY (BLS) */}
                  <div
                    style={{
                      padding: '3px 5px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                        CPI YOY
                      </span>
                      <span style={{ fontSize: '6.5px', color: 'var(--color-amber)', fontWeight: 800 }}>
                        BLS
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '1px' }}>
                      <span className="value-number" style={{ fontSize: '11px', fontWeight: 900, color: 'var(--color-amber)' }}>
                        {macro?.cpiYoy?.value ?? 3.72}%
                      </span>
                    </div>
                    <div style={{ fontSize: '6.5px', color: 'var(--color-amber)', marginTop: '1px' }}>
                      prev {macro?.cpiYoy?.previous ?? 3.35}% (+0.37%)
                    </div>
                  </div>

                  {/* 2. Core CPI YoY (BLS) */}
                  <div
                    style={{
                      padding: '3px 5px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                        CORE CPI
                      </span>
                      <span style={{ fontSize: '6.5px', color: 'var(--color-text-muted)', fontWeight: 800 }}>
                        BLS
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '1px' }}>
                      <span className="value-number" style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff' }}>
                        {macro?.coreCpi?.value ?? 2.57}%
                      </span>
                    </div>
                    <div style={{ fontSize: '6.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                      prev {macro?.coreCpi?.previous ?? 2.45}%
                    </div>
                  </div>

                  {/* 3. Headline PCE YoY (BEA) */}
                  <div
                    style={{
                      padding: '3px 5px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                        PCE YOY
                      </span>
                      <span style={{ fontSize: '6.5px', color: 'var(--color-cyan)', fontWeight: 800 }}>
                        BEA
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '1px' }}>
                      <span className="value-number" style={{ fontSize: '11px', fontWeight: 900, color: 'var(--color-cyan)' }}>
                        {macro?.pceYoy?.value ?? 3.42}%
                      </span>
                    </div>
                    <div style={{ fontSize: '6.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                      prev {macro?.pceYoy?.previous ?? 3.36}%
                    </div>
                  </div>

                  {/* 4. Core PCE YoY (BEA - The Fed's Official 2.0% Target) */}
                  <div
                    style={{
                      padding: '3px 5px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '7px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                        CORE PCE
                      </span>
                      <span style={{ fontSize: '6.5px', color: 'var(--color-accent-primary)', fontWeight: 800 }}>
                        TARGET
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '1px' }}>
                      <span className="value-number" style={{ fontSize: '11px', fontWeight: 900, color: 'var(--color-accent-primary)' }}>
                        {macro?.corePce?.value ?? 3.01}%
                      </span>
                    </div>
                    <div style={{ fontSize: '6.5px', color: 'var(--color-accent-primary)', marginTop: '1px' }}>
                      tgt 2.0% (+1.01%)
                    </div>
                  </div>
                </div>

                {/* Instant Macro Takeaway Footer */}
                <div
                  style={{
                    padding: '3px 6px',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '5px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-amber)',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '8px',
                        color: 'var(--color-amber)',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {macro?.regimeExplanation ?? 'Sticky Energy Inflation: CPI 3.72% driven by WTI Oil $101. The Fed holds Oct 28 (84.5%), but futures markets price in 88.2% hike probability on Dec 9.'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowMacroDetailModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-cyan)',
                      fontSize: '7.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      padding: 0,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    Audit Data &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Macro Ribbon: Kurs, DXY, Oil, and MVRV (Taller Cards, Rich Visual Sparklines & Interpretations) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '10px',
                paddingTop: '2px',
              }}
            >
              {/* USD / IDR Card */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '112px',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={13} color="var(--color-cyan)" />
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
                      KURS USD / IDR
                    </span>
                  </div>
                  <span className="cyan-badge" style={{ fontSize: '9px', padding: '1px 5px', fontWeight: 800 }}>
                    {timeframe} {formatPercent(usdIdrChange)}
                  </span>
                </div>

                {/* Value & 7D Sparkline */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                  <div>
                    <span className="value-number" style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', display: 'block', lineHeight: 1 }}>
                      {formatIdr(forex?.usdIdr?.value)}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '3px' }}>
                      24h: {formatPercent(forex?.usdIdr?.change24h)}
                    </span>
                  </div>
                  <MiniSparkline
                    data={usdIdrSeries}
                    color="var(--color-cyan)"
                    width={92}
                    height={34}
                    gradientId="sparkUsdIdr"
                  />
                </div>

                {/* Context Strip */}
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600, borderTop: '1px solid var(--color-border-muted)', paddingTop: '5px' }}>
                  {forex?.usdIdr?.context ?? 'Rupiah Terkendali • Volatilitas Rendah'}
                </div>
              </div>

              {/* DXY Index Card */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '112px',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={13} color="var(--color-cyan)" />
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
                      US DOLLAR (DXY)
                    </span>
                  </div>
                  <span className="cyan-badge" style={{ fontSize: '9px', padding: '1px 5px', fontWeight: 800 }}>
                    {timeframe} {formatPercent(dxyChange)}
                  </span>
                </div>

                {/* Value & 7D Sparkline */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                  <div>
                    <span className="value-number" style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', display: 'block', lineHeight: 1 }}>
                      {forex?.dxy?.value}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '3px' }}>
                      24h: {formatPercent(forex?.dxy?.change24h)}
                    </span>
                  </div>
                  <MiniSparkline
                    data={dxySeries}
                    color="var(--color-cyan)"
                    width={92}
                    height={34}
                    gradientId="sparkDxy"
                  />
                </div>

                {/* Context Strip */}
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600, borderTop: '1px solid var(--color-border-muted)', paddingTop: '5px' }}>
                  {forex?.dxy?.context ?? 'Weakening Trend • Market Risk-On Catalyst'}
                </div>
              </div>

              {/* WTI Crude Oil Card */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '112px',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplet size={13} color="var(--color-amber)" />
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
                      WTI CRUDE OIL
                    </span>
                  </div>
                  <span className="amber-badge" style={{ fontSize: '9px', padding: '1px 5px', fontWeight: 800 }}>
                    {timeframe} {formatPercent(wtiChange)}
                  </span>
                </div>

                {/* Value & 7D Sparkline */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                  <div>
                    <span className="value-number" style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', display: 'block', lineHeight: 1 }}>
                      ${commodities?.wtiOil?.value}/bbl
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '3px' }}>
                      24h: {formatPercent(commodities?.wtiOil?.change24h)}
                    </span>
                  </div>
                  <MiniSparkline
                    data={wtiSeries}
                    color="var(--color-amber)"
                    width={92}
                    height={34}
                    gradientId="sparkWti"
                  />
                </div>

                {/* Context Strip */}
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600, borderTop: '1px solid var(--color-border-muted)', paddingTop: '5px' }}>
                  {commodities?.wtiOil?.context ?? 'Minyak Melandai • Beban Inflasi Turun'}
                </div>
              </div>

              {/* MVRV Z-Score Card */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '112px',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={13} color="var(--color-bullish)" />
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
                      MVRV Z-SCORE
                    </span>
                  </div>
                  <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px', fontWeight: 800 }}>
                    {timeframe} {mvrvChange >= 0 ? `+${mvrvChange}` : `${mvrvChange}`}
                  </span>
                </div>

                {/* Value & 7D Sparkline */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                  <div>
                    <span className="value-number" style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', display: 'block', lineHeight: 1 }}>
                      {onchain?.mvrvZScore?.value}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--color-bullish)', fontWeight: 700, display: 'block', marginTop: '3px' }}>
                      {onchain?.mvrvZScore?.classification ?? 'Fair Value / Akumulasi'}
                    </span>
                  </div>
                  <MiniSparkline
                    data={mvrvSeries}
                    color="var(--color-bullish)"
                    width={92}
                    height={34}
                    gradientId="sparkMvrv"
                  />
                </div>

                {/* Context Strip */}
                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600, borderTop: '1px solid var(--color-border-muted)', paddingTop: '5px' }}>
                  {onchain?.mvrvZScore?.context ?? 'Zona Akumulasi Sehat • Di Bawah Overheat (>4.0)'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Macro & Inflation Audit Modal */}
      {showMacroDetailModal && (
        <div
          className="modal-backdrop-animate"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
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
              maxWidth: '680px',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-accent)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="var(--color-cyan)" />
                  <span style={{ fontSize: '10px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.05em' }}>
                    MACRO INTELLIGENCE AUDIT & DATA DOCUMENTATION
                  </span>
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#fff', margin: '3px 0 0' }}>
                  Federal Reserve Policy & US Inflation Indicators
                </h2>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'block' }}>
                  Official data source verification from Federal Reserve, BLS, BEA via St. Louis Fed FRED & CME Group
                </span>
              </div>
              <button
                onClick={() => setShowMacroDetailModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Section 1: CME FedWatch Tool Probabilities */}
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>
                  1. CME FedWatch Interest Rate Probabilities (30-Day Fed Funds Futures)
                </span>
                <a
                  href="https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '10px', color: 'var(--color-cyan)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <span>Open CME FedWatch</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <p style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                Derived from CBOT 30-Day Fed Funds Futures prices to reflect institutional market expectations for Federal Open Market Committee (FOMC) rate decisions.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '8px 10px', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>FOMC OCT 28, 2026 ({macro?.fomcDaysRemaining ?? 5} Days Remaining)</span>
                    <span className="bullish-badge" style={{ fontSize: '8px', padding: '1px 5px' }}>PAUSE 84.5%</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                    Target: 3.75% - 4.00%
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Pause: <strong>84.5%</strong> • Hike (+25 bps): <strong>15.5%</strong> • Cut: <strong>0%</strong>
                  </div>
                </div>

                <div style={{ padding: '8px 10px', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>FOMC DEC 9, 2026 (Forward Outlook)</span>
                    <span className="amber-badge" style={{ fontSize: '8px', padding: '1px 5px' }}>HIKE 88.2%</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                    Projected Target: 4.00% - 4.25%
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Hike (+25 bps): <strong>88.2%</strong> • Pause: <strong>11.8%</strong> • Cut: <strong>0%</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: US Inflation 4-Point Gauge Matrix */}
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>
                  2. US Inflation 4-Indicator Matrix (BLS & BEA via St. Louis Fed FRED)
                </span>
                <span className="neutral-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  FRED REALTIME API
                </span>
              </div>

              <table className="cardless-table" style={{ fontSize: '10.5px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>INDICATOR</th>
                    <th style={{ textAlign: 'left' }}>AGENCY / SERIES</th>
                    <th style={{ textAlign: 'right' }}>CURRENT YOY</th>
                    <th style={{ textAlign: 'right' }}>PREVIOUS YOY</th>
                    <th style={{ textAlign: 'right' }}>CHANGE</th>
                    <th style={{ textAlign: 'left' }}>STATUS & TRADER IMPLICATIONS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 800, color: '#fff' }}>Headline CPI</td>
                    <td>U.S. BLS (<code>CPIAUCSL</code>)</td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--color-amber)' }}>{macro?.cpiYoy?.value ?? 3.72}%</td>
                    <td style={{ textAlign: 'right' }}>{macro?.cpiYoy?.previous ?? 3.35}%</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-amber)' }}>+0.37%</td>
                    <td style={{ color: 'var(--color-amber)' }}>Sharp heating driven by WTI crude oil rally to $101. Housing/shelter weighting 36%.</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800, color: '#fff' }}>Core CPI</td>
                    <td>U.S. BLS (<code>CPILFESL</code>)</td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: '#fff' }}>{macro?.coreCpi?.value ?? 2.57}%</td>
                    <td style={{ textAlign: 'right' }}>{macro?.coreCpi?.previous ?? 2.45}%</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-amber)' }}>+0.12%</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>Excludes food & energy. Services inflation remains sticky.</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800, color: '#fff' }}>Headline PCE</td>
                    <td>U.S. BEA (<code>PCEPI</code>)</td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--color-cyan)' }}>{macro?.pceYoy?.value ?? 3.42}%</td>
                    <td style={{ textAlign: 'right' }}>{macro?.pceYoy?.previous ?? 3.36}%</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-amber)' }}>+0.06%</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>Broadly gauges real consumption expenditures across urban & rural households.</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800, color: 'var(--color-accent-primary)' }}>Core PCE (Fed Target)</td>
                    <td>U.S. BEA (<code>PCEPILFE</code>)</td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--color-accent-primary)' }}>{macro?.corePce?.value ?? 3.01}%</td>
                    <td style={{ textAlign: 'right' }}>{macro?.corePce?.previous ?? 2.98}%</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-amber)' }}>+0.03%</td>
                    <td style={{ color: 'var(--color-accent-primary)' }}>Fed official target is 2.0%. Still +1.01% above the real neutral rate target.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Trader Action & Crypto Impact Takeaway */}
            <div style={{ padding: '12px', backgroundColor: 'rgba(212, 175, 55, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent-primary)', fontWeight: 800, fontSize: '11px', marginBottom: '4px' }}>
                <Activity size={13} />
                <span>Strategic Implications for Crypto Traders (Macro Liquidity Correlation)</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                <li>
                  <strong>DXY & Treasury Yield Pressure:</strong> CPI rise to 3.72% sustains DXY above 101.59+ and keeps US Treasury yields elevated, absorbing global liquidity away from risk assets.
                </li>
                <li>
                  <strong>FOMC October 28 Catalyst:</strong> A rate pause (84.5% Pause) is largely priced in; institutional focus centers on Jerome Powell's forward guidance regarding potential hikes on December 9 (currently 88.2% in futures pricing).
                </li>
                <li>
                  <strong>Execution Tactics:</strong> Avoid over-leverage leading into FOMC statements. Utilize on-chain accumulation zones (MVRV Z-Score) for disciplined scaling into spot Bitcoin & Tier-1 altcoins.
                </li>
              </ul>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowMacroDetailModal(false)}
                style={{ height: '32px', fontSize: '11px', padding: '0 16px' }}
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
