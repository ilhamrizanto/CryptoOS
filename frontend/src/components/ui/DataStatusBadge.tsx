import React from 'react';

interface DataStatusBadgeProps {
  status: 'live' | 'stale' | 'error';
  label?: string;
  timestamp?: number;
}

export const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({ status, label, timestamp }) => {
  const defaultLabels = {
    live: 'LIVE',
    stale: 'CACHED',
    error: 'OFFLINE',
  };

  const displayText = label || defaultLabels[status];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        background: 'rgba(17, 24, 39, 0.7)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-mono)',
      }}
      title={timestamp ? `Last updated: ${new Date(timestamp).toLocaleTimeString()}` : undefined}
    >
      <span className={`status-dot ${status} ${status === 'live' ? 'pulse-animation' : ''}`} />
      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{displayText}</span>
    </div>
  );
};
