import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Coins,
  Trash2,
  Sparkles,
  X,
  CreditCard,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettingsStore } from '../store/settings.store';
import { DualCurrencyValue } from '../components/ui/DualCurrencyValue';

interface CashflowTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'STAKING_YIELD' | 'AIRDROP' | 'FEE';
  amountUsd: number;
  amountIdr: number;
  sourceOrDestination: string | null;
  exchange: string | null;
  transactionDate: number;
  notes: string | null;
}

interface CashflowSummary {
  totalDepositsUsd: number;
  totalDepositsIdr: number;
  totalWithdrawalsUsd: number;
  totalWithdrawalsIdr: number;
  totalStakingYieldUsd: number;
  totalStakingYieldIdr: number;
  netCapitalInflowUsd: number;
  netCapitalInflowIdr: number;
  usdToIdrRate: number;
  transactionCount: number;
}

export const CashflowPage: React.FC = () => {
  const { usdToIdrRate } = useSettingsStore();

  const [transactions, setTransactions] = useState<CashflowTransaction[]>([]);
  const [summary, setSummary] = useState<CashflowSummary | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  // New Transaction Modal State
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'STAKING_YIELD' | 'AIRDROP' | 'FEE'>('DEPOSIT');
  const [formAmountUsd, setFormAmountUsd] = useState<number>(1000);
  const [formSource, setFormSource] = useState('Bank Transfer (BCA)');
  const [formExchange, setFormExchange] = useState('BINANCE');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadCashflowData = useCallback(async () => {
    try {
      const [transRes, sumRes] = await Promise.all([
        api.get<CashflowTransaction[]>(selectedFilter === 'ALL' ? '/cashflow' : `/cashflow?type=${selectedFilter}`),
        api.get<CashflowSummary>(`/cashflow/summary?rate=${usdToIdrRate}`),
      ]);
      setTransactions(transRes || []);
      setSummary(sumRes || null);
    } catch (err) {
      console.error('Failed to load cashflow data:', err);
    }
  }, [selectedFilter, usdToIdrRate]);

  useEffect(() => {
    loadCashflowData();
  }, [loadCashflowData]);

  const handleCreateTransaction = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/cashflow', {
        type: formType,
        amountUsd: formAmountUsd,
        amountIdr: Math.round(formAmountUsd * (summary?.usdToIdrRate || usdToIdrRate)),
        sourceOrDestination: formSource,
        exchange: formExchange,
        transactionDate: new Date(formDate).getTime(),
        notes: formNotes,
      });

      showToast('Cashflow transaction recorded successfully!');
      setShowModal(false);
      await loadCashflowData();
    } catch (err) {
      console.error('Failed to create transaction:', err);
      showToast('Failed to record cashflow transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cashflow entry?')) return;
    try {
      await api.delete(`/cashflow/${id}`);
      showToast('Transaction deleted successfully');
      await loadCashflowData();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      {/* Toast Notification */}
      {notification && (
        <div className="terminal-toast toast-enter">
          <Sparkles size={15} color="var(--color-accent-primary)" />
          <span>{notification}</span>
        </div>
      )}

      {/* New Transaction Modal (Cardless Elevated Dialog) */}
      {showModal && (
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
            className="modal-dialog-animate"
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-accent)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '20px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.04em' }}>
                  FIAT & CAPITAL MUTATION
                </span>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: '2px 0 0' }}>
                  Log Capital Transaction
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                TRANSACTION TYPE
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="form-input"
                style={{ height: '34px', fontSize: '12px' }}
              >
                <option value="DEPOSIT">DEPOSIT (Setoran Modal Baru)</option>
                <option value="WITHDRAWAL">WITHDRAWAL (Penarikan Modal / Profit)</option>
                <option value="STAKING_YIELD">STAKING YIELD (Hasil Bunga Pasif)</option>
                <option value="AIRDROP">AIRDROP / REWARD</option>
                <option value="FEE">BIAYA GAS / ADMIN</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  NOMINAL (USD)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formAmountUsd}
                  onChange={(e) => setFormAmountUsd(Number(e.target.value))}
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  ESTIMASI IDR (KURS LIVE)
                </label>
                <div
                  className="value-number"
                  style={{
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 10px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '11px',
                    color: 'var(--color-accent-primary)',
                    fontWeight: 800,
                  }}
                >
                  Rp {(formAmountUsd * (summary?.usdToIdrRate || usdToIdrRate)).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  SUMBER / TUJUAN
                </label>
                <input
                  type="text"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="form-input"
                  style={{ height: '34px', fontSize: '12px' }}
                  placeholder="e.g. BCA, Mandiri, Lido"
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                  DESTINASI WALLET / EXCHANGE
                </label>
                <select
                  value={formExchange}
                  onChange={(e) => setFormExchange(e.target.value)}
                  className="form-input"
                  style={{ height: '34px', fontSize: '12px' }}
                >
                  <option value="BINANCE">Binance Spot</option>
                  <option value="BYBIT">Bybit Spot / Unified</option>
                  <option value="OKX">OKX Trading</option>
                  <option value="WALLET">Cold Storage (Ledger)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                TRANSACTION DATE
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="form-input mono"
                style={{ height: '34px', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                MEMO / NOTES
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Optional, e.g. Monthly allocation, ETH profit taking"
                className="form-input"
                style={{ height: '34px', fontSize: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                style={{ height: '34px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateTransaction}
                disabled={isSubmitting}
                style={{ height: '34px', fontSize: '12px', fontWeight: 800 }}
              >
                {isSubmitting ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header (Aligned with Pure Cardless Terminal Standard) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.06em' }}>
              CASHFLOW & CAPITAL LIQUIDITY
            </span>
            <span style={{ color: 'var(--color-border)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              FIAT INFLOW / OUTFLOW AUDIT
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: '2px 0 0' }}>
            Cashflow Engine & Capital Allocation
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
            Capital liquidity ledger: Track deposits, withdrawals, staking yields, and fiat allocation across accounts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}>
            <Plus size={14} />
            <span>Log Transaction</span>
          </button>
        </div>
      </div>

      {/* Top Aggregated Summary Ribbon (Pure Cardless Sheet) */}
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
        {/* Cell 1: Total Deposit */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              TOTAL DEPOSITS (CAPITAL INFLOW)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownLeft size={13} color="var(--color-bullish)" />
              <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                INFLOW
              </span>
            </div>
          </div>
          <div style={{ marginTop: '2px' }}>
            <DualCurrencyValue usd={summary?.totalDepositsUsd || 0} idr={summary?.totalDepositsIdr || 0} size="lg" sentiment="bullish" />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Cumulative fresh capital injected into exchanges
          </span>
        </div>

        {/* Cell 2: Total Withdrawal */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              TOTAL WITHDRAWALS (CAPITAL OUTFLOW)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={13} color="var(--color-bearish)" />
              <span className="bearish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                OUTFLOW
              </span>
            </div>
          </div>
          <div style={{ marginTop: '2px' }}>
            <DualCurrencyValue usd={summary?.totalWithdrawalsUsd || 0} idr={summary?.totalWithdrawalsIdr || 0} size="lg" sentiment="bearish" />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Realized profits extracted or liquidity withdrawn
          </span>
        </div>

        {/* Cell 3: Net Principal Invested */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              NET PRINCIPAL INVESTED
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={13} color="var(--color-accent-primary)" />
              <span className="gold-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                PRINCIPAL
              </span>
            </div>
          </div>
          <div style={{ marginTop: '2px' }}>
            <DualCurrencyValue
              usd={summary?.netCapitalInflowUsd || 0}
              idr={summary?.netCapitalInflowIdr || 0}
              size="lg"
              sentiment="bullish"
            />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Net capital deployed (Deposits minus Withdrawals)
          </span>
        </div>

        {/* Cell 4: Staking Yields & Airdrop */}
        <div className="cardless-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              STAKING YIELD & REWARDS
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Coins size={13} color="#f59e0b" />
              <span className="cyan-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                PASSIVE
              </span>
            </div>
          </div>
          <div style={{ marginTop: '2px' }}>
            <DualCurrencyValue
              usd={summary?.totalStakingYieldUsd || 0}
              idr={summary?.totalStakingYieldIdr || 0}
              size="lg"
              sentiment="bullish"
            />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Total {summary?.transactionCount || 0} cashflow transactions recorded
          </span>
        </div>
      </div>

      {/* Main Ledger Sheet with Integrated Filter Bar (Pure Cardless Sheet) */}
      <div
        className="cardless-sheet"
        style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
        }}
      >
        {/* Sub-Header & Filter Tab Ribbon */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.01)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Capital Transaction Ledger
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              [{transactions.length} entries]
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
            {[
              { key: 'ALL', label: 'ALL' },
              { key: 'DEPOSIT', label: 'DEPOSIT' },
              { key: 'WITHDRAWAL', label: 'WITHDRAWAL' },
              { key: 'STAKING_YIELD', label: 'STAKING YIELD' },
              { key: 'AIRDROP', label: 'AIRDROP' },
              { key: 'FEE', label: 'FEE' },
            ].map((tab) => {
              const active = selectedFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedFilter(tab.key)}
                  style={{
                    height: '26px',
                    padding: '0 10px',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: active ? 'var(--color-accent-primary)' : 'transparent',
                    backgroundColor: active ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                    color: active ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast)',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cardless Ledger Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="cardless-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>DATE</th>
                <th style={{ width: '120px' }}>TYPE</th>
                <th>SOURCE / DESTINATION</th>
                <th style={{ width: '140px' }}>DESTINATION EXCHANGE</th>
                <th style={{ textAlign: 'right', width: '220px' }}>AMOUNT</th>
                <th>MEMO / NOTES</th>
                <th style={{ textAlign: 'center', width: '70px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <CreditCard size={28} strokeWidth={1.5} color="var(--color-text-muted)" />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>No cashflow transactions found for this category</span>
                      <span style={{ fontSize: '11px' }}>Click the "Log Transaction" button above to record a new deposit or withdrawal.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id}>
                    {/* Tanggal */}
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '11px' }} className="mono">
                      {new Date(t.transactionDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Tipe Badge */}
                    <td>
                      <span
                        className={
                          t.type === 'DEPOSIT'
                            ? 'bullish-badge'
                            : t.type === 'WITHDRAWAL'
                            ? 'bearish-badge'
                            : t.type === 'STAKING_YIELD'
                            ? 'gold-badge'
                            : t.type === 'AIRDROP'
                            ? 'cyan-badge'
                            : 'neutral-badge'
                        }
                        style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px' }}
                      >
                        {t.type}
                      </span>
                    </td>

                    {/* Sumber / Tujuan */}
                    <td>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '12px' }}>
                        {t.sourceOrDestination || 'Internal Treasury'}
                      </span>
                    </td>

                    {/* Exchange */}
                    <td>
                      <span
                        className="mono"
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-accent-primary)',
                          fontWeight: 700,
                          backgroundColor: 'rgba(212, 175, 55, 0.08)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                        }}
                      >
                        {t.exchange || 'MANUAL'}
                      </span>
                    </td>

                    {/* Nilai USD & IDR */}
                    <td style={{ textAlign: 'right' }}>
                      <DualCurrencyValue
                        usd={t.amountUsd}
                        idr={t.amountIdr}
                        layout="row"
                        sentiment={
                          t.type === 'WITHDRAWAL' || t.type === 'FEE'
                            ? 'bearish'
                            : 'bullish'
                        }
                      />
                    </td>

                    {/* Memo */}
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                      {t.notes ? (
                        <span>{t.notes}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-bearish)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                        title="Delete Entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
