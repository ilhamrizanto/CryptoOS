// Export and import utilities for CryptoOS financial records

/**
 * Trigger download of CSV formatted file with UTF-8 BOM for Microsoft Excel compatibility
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const escapeCell = (cell: string | number | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCell).join(',')).join('\r\n');
  const csvContent = '\uFEFF' + headerLine + '\r\n' + rowLines;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger download of formatted JSON object
 */
export function downloadJson(filename: string, data: unknown): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format and download journal trades as tax-ready CSV
 */
export function exportJournalTradesToCsv(trades: any[]): void {
  const headers = [
    'Trade ID',
    'Date Opened',
    'Date Closed',
    'Symbol',
    'Direction',
    'Status',
    'Entry Price ($)',
    'Exit Price ($)',
    'Position Size ($)',
    'Stop Loss ($)',
    'Take Profit ($)',
    'Net P&L ($)',
    'Net P&L (IDR)',
    'P&L (%)',
    'R-Multiple',
    'Psychological State',
    'Lessons Learned / Post-Mortem',
  ];

  const rows = trades.map((t) => [
    t.id || '',
    t.openedAt ? new Date(t.openedAt).toISOString().split('T')[0] : '',
    t.closedAt ? new Date(t.closedAt).toISOString().split('T')[0] : '',
    t.symbol || '',
    t.direction || '',
    t.status || '',
    t.entryPrice ?? '',
    t.exitPrice ?? '',
    t.positionSize ?? '',
    t.stopLossPrice ?? '',
    t.takeProfitPrice ?? '',
    t.pnlUsd ?? '',
    t.pnlIdr ?? '',
    t.pnlPercent ? `${Number(t.pnlPercent).toFixed(2)}%` : '',
    t.rMultiple ? `${Number(t.rMultiple).toFixed(2)}R` : '',
    t.psychologicalState || '',
    t.lessonsLearned || '',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`CryptoOS_Journal_Trades_${dateStr}.csv`, headers, rows);
}

/**
 * Format and download cashflow mutations as CSV
 */
export function exportCashflowToCsv(transactions: any[]): void {
  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Amount (USD)',
    'Amount (IDR)',
    'Source / Destination',
    'Exchange / Storage Vault',
    'Memo / Notes',
  ];

  const rows = transactions.map((c) => [
    c.id || '',
    c.transactionDate ? new Date(c.transactionDate).toISOString().split('T')[0] : '',
    c.type || '',
    c.amountUsd ?? '',
    c.amountIdr ?? '',
    c.sourceOrDestination || '',
    c.exchange || '',
    c.notes || '',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`CryptoOS_Cashflow_Ledger_${dateStr}.csv`, headers, rows);
}

/**
 * Format and download portfolio holdings as CSV
 */
export function exportHoldingsToCsv(holdings: any[]): void {
  const headers = [
    'Holding ID',
    'Symbol',
    'Asset Amount',
    'Average Buy Price ($)',
    'Target Allocation (%)',
    'Exchange / Storage',
    'Entry Type',
  ];

  const rows = holdings.map((h) => [
    h.id || '',
    h.symbol || '',
    h.amount ?? '',
    h.averageBuyPrice ?? '',
    h.targetPercent ? `${h.targetPercent}%` : '',
    h.exchange || 'MANUAL',
    h.isManual ? 'Manual Entry' : 'API Synced',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`CryptoOS_Portfolio_Holdings_${dateStr}.csv`, headers, rows);
}
