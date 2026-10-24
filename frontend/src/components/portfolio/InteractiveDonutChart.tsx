import React, { useState } from 'react';
import { formatUsd, formatCompactUsd, formatCompactIdr } from '../../utils/formatters';
import { TokenIcon } from '../common/TokenIcon';
import { ExchangeIcon } from '../common/ExchangeIcon';

export interface DonutSegment {
  id: string;
  label: string;
  subLabel?: string;
  valueUsd: number;
  valueIdr?: number;
  percent: number;
  color: string;
  count?: number;
  icon?: React.ReactNode;
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
  layout?: 'vertical' | 'horizontal';
  chartSize?: number;
  unitLabel?: string;
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
  layout = 'vertical',
  chartSize,
  unitLabel,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const isVertical = layout === 'vertical';

  // SVG Geometry - Apple Pro Specs (Clean, Precise & Non-Round Butt Separator)
  const size = chartSize || (isVertical ? 196 : 126);
  const cx = size / 2;
  const cy = size / 2;
  const radius = isVertical ? 76 : 48;
  const circumference = 2 * Math.PI * radius; // ~477.52 (vertical) or ~301.59 (horizontal)
  const baseStrokeWidth = isVertical ? 14 : 9.5;
  const hoverStrokeWidth = isVertical ? 20 : 13.5;

  // Normalized Percentages & Total Aggregation
  const totalPercent = items.reduce((acc, it) => acc + (it.percent || 0), 0);
  const totalValueUsd = items.reduce((acc, it) => acc + (it.valueUsd || 0), 0);
  const totalValueIdr = items.reduce((acc, it) => acc + (it.valueIdr || 0), 0);
  const factor = totalPercent > 0 ? 100 / totalPercent : 1;

  // Precision Gap (Flat butt-cut separator between slices)
  const sliceGap = items.length > 1 ? (isVertical ? 3.0 : 2.5) : 0;

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

  // Reusable SVG Donut Gauge with Center Readout
  const renderDonutSvg = () => (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
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
                filter: isHovered ? `drop-shadow(0 0 12px ${slice.color}bb)` : 'none',
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
          padding: '6px',
        }}
      >
        {activeItem ? (
          <>
            <span
              style={{
                fontSize: isVertical ? '10px' : '9px',
                fontWeight: 800,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1,
                maxWidth: `${size - 36}px`,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeItem.label}
            </span>
            <span
              className="mono"
              style={{
                fontSize: isVertical ? '22px' : '15px',
                fontWeight: 900,
                color: activeItem.color,
                lineHeight: 1.15,
                marginTop: '2px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {activeItem.percent.toFixed(1)}%
            </span>
            <span
              className="mono"
              style={{
                fontSize: isVertical ? '12px' : '10px',
                color: '#ffffff',
                fontWeight: 800,
                lineHeight: 1.1,
                marginTop: '2px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatUsd(activeItem.valueUsd)}
            </span>
            {activeItem.valueIdr !== undefined && (
              <span
                className="mono"
                style={{
                  fontSize: isVertical ? '9.5px' : '8.5px',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.1,
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
                fontSize: isVertical ? '9px' : '8px',
                color: 'var(--color-text-muted)',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              TOTAL
            </span>
            <span
              className="mono"
              style={{
                fontSize: isVertical ? '20px' : '14px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.15,
                marginTop: '2px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatCompactUsd(totalValueUsd)}
            </span>
            <span
              className="mono"
              style={{
                fontSize: isVertical ? '10px' : '8.5px',
                color: 'var(--color-text-muted)',
                fontWeight: 700,
                lineHeight: 1.1,
                marginTop: '2px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatCompactIdr(totalValueIdr)}
            </span>
            <span
              style={{
                fontSize: '8.5px',
                color: 'var(--color-accent-primary)',
                fontWeight: 800,
                marginTop: '4px',
                letterSpacing: '0.04em',
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
              }}
            >
              {items.length} {unitLabel || (showTokenIcons ? 'ASSETS' : 'CATEGORIES')}
            </span>
          </>
        )}
      </div>
    </div>
  );

  // Reusable Legend Row
  const renderLegendRow = (slice: typeof computedSlices[0]) => {
    const isHovered = hoveredId === slice.id;

    return (
      <div
        key={slice.id}
        onMouseEnter={() => setHoveredId(slice.id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isVertical ? '7px 10px 7px 14px' : '4px 7px 4px 11px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
          border: isHovered ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isHovered ? 'translateX(2px)' : 'none',
        }}
      >
        {/* Permanent Accent Color Indicator Strip (immune to shorthand border overrides) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: isHovered ? '3.5px' : '3px',
            backgroundColor: slice.color,
            boxShadow: isHovered ? `0 0 10px ${slice.color}` : 'none',
            transition: 'width 160ms ease, box-shadow 160ms ease',
          }}
        />
        {/* Left: Custom Icon / Token Icon / Location Icon + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isVertical ? '9px' : '7px', minWidth: 0, flex: 1 }}>
          {slice.icon ? (
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{slice.icon}</span>
          ) : showTokenIcons ? (
            <TokenIcon symbol={slice.label} size={isVertical ? 18 : 16} />
          ) : (
            <ExchangeIcon exchange={slice.id} size={isVertical ? 18 : 16} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: isVertical ? '11.5px' : '11px',
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
                  fontSize: isVertical ? '9.5px' : '8.5px',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.1,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: isVertical ? '10px' : '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span
              className="mono"
              style={{
                fontSize: isVertical ? '11px' : '10.5px',
                color: isHovered ? '#ffffff' : 'var(--color-text-secondary)',
                fontWeight: 700,
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatUsd(slice.valueUsd)}
            </span>
            {slice.valueIdr !== undefined && (
              <span
                className="mono"
                style={{
                  fontSize: isVertical ? '9px' : '8.5px',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1,
                  marginTop: '1px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatCompactIdr(slice.valueIdr)}
              </span>
            )}
          </div>

          <span
            className="mono"
            style={{
              fontSize: isVertical ? '10px' : '9.5px',
              fontWeight: 800,
              color: slice.color,
              padding: isVertical ? '2px 6px' : '2px 5px',
              borderRadius: '4px',
              backgroundColor: isHovered ? `${slice.color}28` : `${slice.color}18`,
              border: `1px solid ${slice.color}${isHovered ? '60' : '35'}`,
              minWidth: isVertical ? '42px' : '40px',
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              transition: 'all 160ms ease',
            }}
          >
            {slice.percent.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const header = (
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
  );

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: isVertical ? '14px' : '8px' }}>
      {header}

      {items.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{emptyMessage}</span>
        </div>
      ) : isVertical ? (
        /* Vertical Proportional Layout: Big Centered Donut + Full-width Legend Below */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'space-between' }}>
          {/* Centered Chart */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '6px 0',
            }}
          >
            {renderDonutSvg()}
          </div>

          {/* Full-width Stacked Legend Below */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: items.length > 5 ? '190px' : 'none',
              overflowY: items.length > 5 ? 'auto' : 'visible',
              paddingRight: items.length > 5 ? '4px' : '0',
            }}
          >
            {computedSlices.map(renderLegendRow)}
          </div>
        </div>
      ) : (
        /* Horizontal Side-by-Side Layout */
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
          {renderDonutSvg()}

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
            {computedSlices.map(renderLegendRow)}
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
