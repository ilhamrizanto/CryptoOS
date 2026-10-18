import React, { useState } from 'react';
import {
  Globe,
  RefreshCw,
  ExternalLink,
  Edit3,
  DollarSign,
  Gauge,
  Flame,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react';
import { useMarketData } from '../../../hooks/useMarketData';
import { formatIdr, formatPercent, formatCompactUsd } from '../../../utils/formatters';
import { DataStatusBadge } from '../../ui/DataStatusBadge';

export const GlobalIntelligencePanel: React.FC = () => {
  const { intel, isLoading, refetch, isRefetching, updateFedWatch, isUpdatingFedWatch } = useMarketData();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingFedWatch, setIsEditingFedWatch] = useState(false);

  // FedWatch edit state
  const [easeProb, setEaseProb] = useState<number>(intel?.fedwatch?.easeProb ?? 88.5);
  const [noChangeProb, setNoChangeProb] = useState<number>(intel?.fedwatch?.noChangeProb ?? 11.5);
  const [notes, setNotes] = useState<string>(intel?.fedwatch?.notes ?? '');

  const handleSaveFedWatch = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFedWatch({
      easeProb,
      noChangeProb,
      hikeProb: Math.max(0, 100 - easeProb - noChangeProb),
      notes,
    });
    setIsEditingFedWatch(false);
  };

  if (isLoading && !intel) {
    return (
      <div className="card-panel" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          Loading real-time global intelligence feed...
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

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      {/* Panel Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'rgba(134, 239, 29, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Globe size={14} color="var(--color-accent-primary)" />
          </div>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, letterSpacing: '0.04em', color: '#ffffff' }}>
            GLOBAL INTELLIGENCE & MACRO PANEL
          </h2>
          <DataStatusBadge
            status={forex?.usdIdr.isLive ? 'live' : 'stale'}
            label={forex?.usdIdr.isLive ? 'LIVE FEED (5M)' : 'FALLBACK CACHE'}
            timestamp={forex?.usdIdr.updatedAt}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => refetch()}
            disabled={isRefetching}
            style={{ padding: '4px 10px', fontSize: '11px', minHeight: 'unset', height: '28px' }}
            title="Refetch all global data"
          >
            <RefreshCw size={12} className={isRefetching ? 'pulse-animation' : ''} />
            <span>{isRefetching ? 'Fetching...' : 'Refresh'}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ padding: '4px 8px', minHeight: 'unset', height: '28px' }}
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Key Intelligence Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {/* 1. USD / IDR Realtime Rate */}
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  KURS USD / IDR
                </span>
                <span className="bullish-badge" style={{ fontSize: '10px', padding: '1px 5px' }}>
                  {forex?.usdIdr.isLive ? 'REALTIME' : 'CACHED'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                <span className="value-number" style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff' }}>
                  {formatIdr(forex?.usdIdr.value)}
                </span>
                <span className="value-number bullish-text" style={{ fontSize: '11px', fontWeight: 700 }}>
                  {formatPercent(forex?.usdIdr.change24h)}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                Sinkron otomatis ke seluruh portofolio & sizer
              </span>
            </div>

            {/* 2. Alternative.me Fear & Greed Index */}
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  FEAR & GREED
                </span>
                <Gauge size={14} color="var(--color-accent-primary)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                <span className="value-number" style={{ fontSize: '19px', fontWeight: 800, color: 'var(--color-accent-primary)' }}>
                  {sentiment?.fearAndGreed.value ?? 53}
                </span>
                <span className="bullish-badge" style={{ fontSize: '10px', padding: '1px 5px' }}>
                  {sentiment?.fearAndGreed.classification.toUpperCase()}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                Alternative.me daily market sentiment
              </span>
            </div>

            {/* 3. BTC Dominance & TOTAL3 */}
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  BTC DOMINANCE
                </span>
                <Layers size={14} color="var(--color-accent-primary)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                <span className="value-number" style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff' }}>
                  {crypto?.btcDominance.value ?? 59.5}%
                </span>
                <span className="neutral-badge" style={{ fontSize: '10px', padding: '1px 5px' }}>
                  HIGH DOM
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                TOTAL3 (Ex-BTC/ETH): {formatCompactUsd(crypto?.total3.value)}
              </span>
            </div>

            {/* 4. Fed Funds Rate & Macro */}
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  FED FUNDS RATE
                </span>
                <DollarSign size={14} color="var(--color-accent-primary)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                <span className="value-number" style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff' }}>
                  {macro?.fedFundsRate.value}%
                </span>
                <span className="neutral-badge" style={{ fontSize: '10px', padding: '1px 5px' }}>
                  CPI: {macro?.cpiYoy.value}%
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                Next FOMC: {macro?.nextFomcDate}
              </span>
            </div>
          </div>

          {/* Dedicated CME FedWatch Tool & Macro Expectation Card */}
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'linear-gradient(135deg, #131920 0%, #0c1014 100%)',
              border: '1px solid var(--color-border-accent)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={16} color="var(--color-accent-primary)" />
                <span style={{ fontWeight: 800, fontSize: '13px', color: '#ffffff' }}>
                  CME FedWatch Tool — Target Interest Rate Probabilities
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={fedwatch?.cmeFedwatchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '11px', minHeight: 'unset', height: '26px' }}
                >
                  <span>Buka CME FedWatch</span>
                  <ExternalLink size={12} />
                </a>

                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditingFedWatch(!isEditingFedWatch)}
                  style={{ padding: '3px 10px', fontSize: '11px', minHeight: 'unset', height: '26px' }}
                >
                  <Edit3 size={12} />
                  <span>Update Probabilitas</span>
                </button>
              </div>
            </div>

            {/* Probability Progress Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>
                  EASE / RATE CUT: {fedwatch?.easeProb}%
                </span>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  NO CHANGE: {fedwatch?.noChangeProb}%
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div
                style={{
                  height: '8px',
                  width: '100%',
                  backgroundColor: 'var(--color-bg-base)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${fedwatch?.easeProb ?? 88.5}%`,
                    backgroundColor: 'var(--color-accent-primary)',
                    boxShadow: '0 0 10px rgba(134, 239, 29, 0.6)',
                  }}
                  title={`Ease Probability: ${fedwatch?.easeProb}%`}
                />
                <div
                  style={{
                    width: `${fedwatch?.noChangeProb ?? 11.5}%`,
                    backgroundColor: '#fbbf24',
                  }}
                  title={`No Change: ${fedwatch?.noChangeProb}%`}
                />
              </div>
            </div>

            {/* Notes & Explanation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {fedwatch?.notes || 'Kondisi market sangat reaktif ketika hasil resmi FOMC berbeda dari ekspektasi FedWatch.'}
              </span>
              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: '12px' }}>
                Diupdate: {fedwatch?.manuallyUpdatedAt ? new Date(fedwatch.manuallyUpdatedAt).toLocaleDateString() : 'Hari ini'}
              </span>
            </div>

            {/* Inline Edit Form Modal */}
            {isEditingFedWatch && (
              <form
                onSubmit={handleSaveFedWatch}
                style={{
                  marginTop: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--color-accent-primary)' }}>
                    Input Data Baru dari CME FedWatch Tool
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingFedWatch(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      PROBABILITAS CUT / EASE (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-input mono"
                      value={easeProb}
                      onChange={(e) => setEaseProb(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      PROBABILITAS NO CHANGE (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-input mono"
                      value={noChangeProb}
                      onChange={(e) => setNoChangeProb(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    CATATAN SENTIMEN / ANALISIS MAKRO
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Ekspektasi cut 25bps menguat setelah rilis data NFP..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditingFedWatch(false)}
                    style={{ padding: '4px 12px', fontSize: '12px', minHeight: 'unset' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdatingFedWatch}
                    style={{ padding: '4px 16px', fontSize: '12px', minHeight: 'unset' }}
                  >
                    <Check size={14} />
                    <span>{isUpdatingFedWatch ? 'Menyimpan...' : 'Simpan ke Database'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Secondary Indicators Footer Bar (DXY, WTI Oil, MVRV, Altseason) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              padding: '8px 12px',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>DXY US Dollar Index:</span>
              <span className="value-number" style={{ fontWeight: 700 }}>{forex?.dxy.value}</span>
              <span className="bearish-badge" style={{ fontSize: '9px', padding: '0 4px' }}>
                {forex?.dxy.change24h}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>WTI Crude Oil:</span>
              <span className="value-number" style={{ fontWeight: 700 }}>${commodities?.wtiOil.value}/bbl</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Altcoin Season Index:</span>
              <span className="value-number" style={{ fontWeight: 700 }}>{sentiment?.altcoinSeasonIndex.value}/100</span>
              <span className="neutral-badge" style={{ fontSize: '9px', padding: '0 4px' }}>
                {sentiment?.altcoinSeasonIndex.classification}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>MVRV Z-Score:</span>
              <span className="value-number" style={{ fontWeight: 700 }}>{onchain?.mvrvZScore.value}</span>
              <span className="bullish-badge" style={{ fontSize: '9px', padding: '0 4px' }}>
                {onchain?.mvrvZScore.classification}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
