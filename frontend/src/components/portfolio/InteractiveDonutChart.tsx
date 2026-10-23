import React, { useState } from 'react';
import { formatUsd, formatCompactUsd, formatCompactIdr } from '../../utils/formatters';
import { TokenIcon } from '../common/TokenIcon';
import { Shield, Building2 } from 'lucide-react';

export interface DonutSegment {
  id: string;
  label: string;
  subLabel?: string;
  valueUsd: number;
  valueIdr?: number;
  percent: number;
  color: string;
  count?: number;
}

interface InteractiveDonutChartProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeType?: 'cyan' | 'gold' | 'bullish' | 'neutral';
  items: DonutSegment[];
  emptyMessage?: string;
  icon?: React.ReactNode;
  isPane?: boolean;
  showTokenIcons?: boolean;
}

export const InteractiveDonutChart: React.FC<InteractiveDonutChartProps> = ({
  title,
  subtitle,
  badgeText,
  badgeType = 'cyan',
  items,
  emptyMessage = 'No asset allocation data recorded',
  icon,
  isPane = false,
  showTokenIcons = false,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // SVG Geometry - Apple Pro Specs (Clean, Precise & Non-Round Butt Separator)
  const size = 126;
  const cx = 63;
  const cy = 63;
  const radius = 48;
  const circumference = 2 * Math.PI * radius; // ~301.59
  const baseStrokeWidth = 9.5;
  const hoverStrokeWidth = 13.5;

  // Normalized Percentages & Total Aggregation
  const totalPercent = items.reduce((acc, it) => acc + (it.percent || 0), 0);
  const totalValueUsd = items.reduce((acc, it) => acc + (it.valueUsd || 0), 0);
  const totalValueIdr = items.reduce((acc, it) => acc + (it.valueIdr || 0), 0);
  const factor = totalPercent > 0 ? 100 / totalPercent : 1;

  // Precision Gap (Flat butt-cut separator between slices)
  const sliceGap = items.length > 1 ? 2.5 : 0;

  // Compute slice stroke offsets
  let accumulatedPercent = 0;
  const computedSlices = items.map((item) => {
    const normalizedPercent = item.percent * factor;
    const arcLength = (normalizedPercent / 100) * circumference;
    const strokeDash = Math.max(0.1, arcLength - sliceGap);
    const strokeOffset = -((accumulatedPercent / 100) * circumference) - (sliceGap / 2);
    accumulatedPercent += normalizedPercent;

    return {
      ...item,
      normalizedPercent,
      strokeDash,
      strokeOffset,
    };
  });

  const activeItem = computedSlices.find((s) => s.id === hoveredId) || null;

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '8px' }}>
      {/* Header with Apple Restraint & Typographic Contrast */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
          <div>
            <span
              style={{
                fontSize: '9.5px',
                color: 'var(--color-text-muted)',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </span>
            {subtitle && (
              <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {badgeText && (
          <span
            className={`${badgeType}-badge`}
            style={{
              fontSize: '8.5px',
              padding: '2px 7px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              borderRadius: '4px',
            }}
          >
            {badgeText}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{emptyMessage}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
          {/* SVG Precision Donut Gauge */}
          <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background Base Track */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth={baseStrokeWidth}
              />

              {/* Slices with Precision Butt Caps (No Bubbly Round Edges) */}
              {computedSlices.map((slice) => {
                const isHovered = hoveredId === slice.id;
                return (
                  <circle
                    key={slice.id}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHovered ? hoverStrokeWidth : baseStrokeWidth}
                    strokeDasharray={`${slice.strokeDash} ${circumference}`}
                    strokeDashoffset={slice.strokeOffset}
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${cx} ${cy})`}
                    style={{
                      cursor: 'pointer',
                      transition: 'stroke-width 220ms cubic-bezier(0.16, 1, 0.3, 1), filter 220ms cubic-bezier(0.16, 1, 0.3, 1)',
                      filter: isHovered ? `drop-shadow(0 0 10px ${slice.color}95)` : 'none',
                    }}
                    onMouseEnter={() => setHoveredId(slice.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                );
              })}
            </svg>

            {/* Central Precision Readout (Dual-Currency USD & IDR) */}
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
                padding: '4px',
              }}
            >
              {activeItem ? (
                <>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: 'var(--color-text-muted)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}
                  >
                    {activeItem.label.length > 9 ? activeItem.label.substring(0, 8) + '…' : activeItem.label}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '15px',
                      fontWeight: 900,
                      color: activeItem.color,
                      lineHeight: 1.2,
                      marginTop: '2px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {activeItem.percent.toFixed(1)}%
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '10px',
                      color: '#ffffff',
                      fontWeight: 700,
                      lineHeight: 1,
                      marginTop: '2px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatCompactUsd(activeItem.valueUsd)}
                  </span>
                  {activeItem.valueIdr && (
                    <span
                      className="mono"
                      style={{
                        fontSize: '8.5px',
                        color: 'var(--color-text-muted)',
                        lineHeight: 1,
                        marginTop: '2px',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatCompactIdr(activeItem.valueIdr)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: '8px',
                      color: 'var(--color-text-muted)',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    TOTAL
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '14px',
                      fontWeight: 900,
                      color: '#ffffff',
                      lineHeight: 1.2,
                      marginTop: '2px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatCompactUsd(totalValueUsd)}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '8.5px',
                      color: 'var(--color-text-muted)',
                      fontWeight: 700,
                      lineHeight: 1,
                      marginTop: '2px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatCompactIdr(totalValueIdr)}
                  </span>
                  <span
                    style={{
                      fontSize: '8px',
                      color: 'var(--color-accent-primary)',
                      fontWeight: 800,
                      marginTop: '3px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {items.length} {showTokenIcons ? 'ASSETS' : 'WALLETS'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Legend with Dual-Currency (USD + IDR) */}
          <div
            style={{
              flex: 1,
              minWidth: '165px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '145px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {computedSlices.map((slice) => {
              const isHovered = hoveredId === slice.id;
              const isWallet = slice.id === 'WALLET' || slice.label.toLowerCase().includes('cold');

              return (
                <div
                  key={slice.id}
                  onMouseEnter={() => setHoveredId(slice.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 7px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                    borderLeft: isHovered ? `3px solid ${slice.color}` : '3px solid transparent',
                    transform: isHovered ? 'translateX(2px)' : 'none',
                  }}
                >
                  {/* Left: Token Icon / Location Icon + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                    {showTokenIcons ? (
                      <TokenIcon symbol={slice.label} size={16} />
                    ) : isWallet ? (
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(48, 209, 88, 0.16)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Shield size={10} color="#30D158" />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          backgroundColor: `${slice.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={10} color={slice.color} />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: isHovered ? 800 : 700,
                          color: isHovered ? '#ffffff' : 'var(--color-text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.2,
                        }}
                      >
                        {slice.label}
                      </span>
                      {slice.subLabel && (
                        <span
                          className="mono"
                          style={{
                            fontSize: '8.5px',
                            color: 'var(--color-text-muted)',
                            lineHeight: 1,
                            marginTop: '1px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {slice.subLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Dual Currency Readout (USD + IDR) + Percentage Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: '10.5px',
                          color: isHovered ? '#ffffff' : 'var(--color-text-secondary)',
                          fontWeight: 700,
                          lineHeight: 1.2,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatUsd(slice.valueUsd)}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: '8.5px',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1,
                          marginTop: '1px',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatCompactIdr(slice.valueIdr)}
                      </span>
                    </div>

                    <span
                      className="mono"
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: slice.color,
                        padding: '2px 5px',
                        borderRadius: '4px',
                        backgroundColor: `${slice.color}16`,
                        border: `1px solid ${slice.color}35`,
                        minWidth: '40px',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {slice.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (isPane) {
    return content;
  }

  return (
    <div
      className="cardless-sheet"
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderTop: '1px solid rgba(255, 255, 255, 0.14)',
        background: 'rgba(18, 20, 26, 0.65)',
        backdropFilter: 'blur(20px) saturate(180%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 18px',
        minHeight: '200px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
      }}
    >
      {content}
    </div>
  );
};
