import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Users,
  ShieldCheck,
  Download,
  Upload,
  AlertTriangle,
  FileSpreadsheet,
  Save,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
  Send,
  MessageSquare,
  Key,
  Globe,
  Sliders,
  HardDrive,
  Database,
  X,
  HelpCircle,
  FileJson,
  Activity,
  Zap,
  ChevronRight,
  LucideIcon,
  Plus,
  Pencil,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';
import { useAuthStore } from '../store/auth.store';
import { api } from '../services/api';
import { ExchangeIcon } from '../components/common/ExchangeIcon';
import { UserWhitelistManager } from '../components/features/UserWhitelistManager';
import { CustomSelect } from '../components/common/CustomSelect';
import {
  downloadJson,
  exportJournalTradesToCsv,
  exportCashflowToCsv,
  exportHoldingsToCsv,
} from '../utils/exportHelpers';

// Apple-style iOS/macOS Smooth Switch Toggle Component
const AppleToggle: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: '40px',
        height: '22px',
        borderRadius: '11px',
        backgroundColor: checked ? 'var(--color-accent-primary)' : 'rgba(255, 255, 255, 0.14)',
        border: 'none',
        padding: '2px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        transition: 'background-color 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        flexShrink: 0,
        outline: 'none',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: checked ? '#000000' : '#ffffff',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.35)',
          transform: checked ? 'translateX(18px)' : 'translateX(0px)',
          transition: 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease',
        }}
      />
    </button>
  );
};

// Sleek Vertical Sidebar Navigation Item Component (Fully visible labels without truncation)
const SidebarTabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  badge?: string;
  badgeClass?: string;
}> = ({ active, onClick, icon: Icon, label, badge, badgeClass }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 12px',
        borderRadius: '6px',
        border: active ? '1px solid rgba(212, 175, 55, 0.35)' : '1px solid transparent',
        backgroundColor: active ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
        color: active ? '#ffffff' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        textAlign: 'left',
        position: 'relative',
        gap: '10px',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
          e.currentTarget.style.color = '#ffffff';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <Icon
          size={14}
          color={active ? 'var(--color-accent-primary)' : 'currentColor'}
          style={{ flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: active ? 800 : 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={label}
        >
          {label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {badge && (
          <span
            className={badgeClass || 'neutral-badge'}
            style={{ fontSize: '8.5px', padding: '1px 5px', fontWeight: 800, whiteSpace: 'nowrap' }}
          >
            {badge}
          </span>
        )}
        <ChevronRight
          size={12}
          style={{
            color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
            opacity: active ? 1 : 0.4,
            transform: active ? 'translateX(1px)' : 'none',
            transition: 'transform 0.15s ease, opacity 0.15s ease',
            flexShrink: 0,
          }}
        />
      </div>
    </button>
  );
};

export interface ExchangeAccount {
  id: string;
  exchange: string;
  label: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  createdAt: number;
  latencyMs?: number;
  authStatus?: 'VERIFIED' | 'FAILED' | 'SKIPPED';
  errorMessage?: string;
  lastPingAt?: number;
}

export const SUPPORTED_EXCHANGES = [
  {
    id: 'BINANCE',
    name: 'Binance',
    fullName: 'Binance Spot & Earn',
    category: 'GLOBAL' as const,
    regionLabel: 'Global Tier-1',
    badgeClass: 'bullish-badge',
    hasPassphrase: false,
    keyPlaceholder: 'Binance API Key',
    secretPlaceholder: 'Binance API Secret',
  },
  {
    id: 'BYBIT',
    name: 'Bybit',
    fullName: 'Bybit Unified Trading Account (UTA)',
    category: 'GLOBAL' as const,
    regionLabel: 'Global Tier-1',
    badgeClass: 'bullish-badge',
    hasPassphrase: false,
    keyPlaceholder: 'Bybit API Key',
    secretPlaceholder: 'Bybit API Secret',
  },
  {
    id: 'OKX',
    name: 'OKX',
    fullName: 'OKX Trading & Web3',
    category: 'GLOBAL' as const,
    regionLabel: 'Global Tier-1',
    badgeClass: 'bullish-badge',
    hasPassphrase: true,
    keyPlaceholder: 'OKX API Key',
    secretPlaceholder: 'OKX API Secret',
    passPlaceholder: 'OKX Passphrase',
  },
  {
    id: 'MEXC',
    name: 'MEXC',
    fullName: 'MEXC Global Spot',
    category: 'GLOBAL' as const,
    regionLabel: 'High Liquidity',
    badgeClass: 'cyan-badge',
    hasPassphrase: false,
    keyPlaceholder: 'MEXC API Key',
    secretPlaceholder: 'MEXC API Secret',
  },
  {
    id: 'KUCOIN',
    name: 'KuCoin',
    fullName: 'KuCoin Spot & Margin',
    category: 'GLOBAL' as const,
    regionLabel: 'Global Exchange',
    badgeClass: 'cyan-badge',
    hasPassphrase: true,
    keyPlaceholder: 'KuCoin API Key',
    secretPlaceholder: 'KuCoin API Secret',
    passPlaceholder: 'KuCoin Passphrase',
  },
  {
    id: 'GATEIO',
    name: 'Gate.io',
    fullName: 'Gate.io Spot Trading',
    category: 'GLOBAL' as const,
    regionLabel: 'Global Exchange',
    badgeClass: 'cyan-badge',
    hasPassphrase: false,
    keyPlaceholder: 'Gate.io API Key',
    secretPlaceholder: 'Gate.io API Secret',
  },
  {
    id: 'BITGET',
    name: 'Bitget',
    fullName: 'Bitget Spot & Futures V2',
    category: 'GLOBAL' as const,
    regionLabel: 'Global Tier-1',
    badgeClass: 'cyan-badge',
    hasPassphrase: true,
    keyPlaceholder: 'Bitget API Key',
    secretPlaceholder: 'Bitget API Secret',
    passPlaceholder: 'Bitget Passphrase',
  },
  {
    id: 'INDODAX',
    name: 'Indodax',
    fullName: 'Indodax IDR Spot Market',
    category: 'LOCAL' as const,
    regionLabel: 'Bappebti Regulated • Indonesia',
    badgeClass: 'amber-badge',
    hasPassphrase: false,
    keyPlaceholder: 'Indodax API Key',
    secretPlaceholder: 'Indodax API Secret',
  },
  {
    id: 'TOKOCRYPTO',
    name: 'Tokocrypto',
    fullName: 'Tokocrypto (Binance Cloud)',
    category: 'LOCAL' as const,
    regionLabel: 'Bappebti Regulated • Indonesia',
    badgeClass: 'amber-badge',
    hasPassphrase: false,
    keyPlaceholder: 'Tokocrypto API Key',
    secretPlaceholder: 'Tokocrypto API Secret',
  },
  {
    id: 'TRIV',
    name: 'Triv',
    fullName: 'Triv Pro & Instant IDR',
    category: 'LOCAL' as const,
    regionLabel: 'Bappebti Regulated • Indonesia',
    badgeClass: 'amber-badge',
    hasPassphrase: false,
    keyPlaceholder: 'Triv API Key',
    secretPlaceholder: 'Triv API Secret',
  },
];

const syncLegacyStorage = (accounts: ExchangeAccount[]) => {
  const map: Record<string, { key: string; sec: string; pass?: string }> = {
    BINANCE: { key: 'cryptoos_binance_key', sec: 'cryptoos_binance_secret' },
    BYBIT: { key: 'cryptoos_bybit_key', sec: 'cryptoos_bybit_secret' },
    OKX: { key: 'cryptoos_okx_key', sec: 'cryptoos_okx_secret', pass: 'cryptoos_okx_pass' },
    MEXC: { key: 'cryptoos_mexc_key', sec: 'cryptoos_mexc_secret' },
    INDODAX: { key: 'cryptoos_indodax_key', sec: 'cryptoos_indodax_secret' },
    TOKOCRYPTO: { key: 'cryptoos_tokocrypto_key', sec: 'cryptoos_tokocrypto_secret' },
    TRIV: { key: 'cryptoos_triv_key', sec: 'cryptoos_triv_secret' },
    KUCOIN: { key: 'cryptoos_kucoin_key', sec: 'cryptoos_kucoin_secret', pass: 'cryptoos_kucoin_pass' },
    GATEIO: { key: 'cryptoos_gateio_key', sec: 'cryptoos_gateio_secret' },
    BITGET: { key: 'cryptoos_bitget_key', sec: 'cryptoos_bitget_secret', pass: 'cryptoos_bitget_pass' },
  };

  Object.values(map).forEach((m) => {
    localStorage.removeItem(m.key);
    localStorage.removeItem(m.sec);
    if (m.pass) localStorage.removeItem(m.pass);
  });

  accounts.forEach((acc) => {
    const m = map[acc.exchange];
    if (m && !localStorage.getItem(m.key)) {
      localStorage.setItem(m.key, acc.apiKey);
      localStorage.setItem(m.sec, acc.apiSecret);
      if (m.pass && acc.passphrase) localStorage.setItem(m.pass, acc.passphrase);
    }
  });
};

const loadInitialExchangeAccounts = (): ExchangeAccount[] => {
  try {
    const raw = localStorage.getItem('cryptoos_exchange_accounts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse exchange accounts from localStorage:', err);
  }

  // Automatic legacy migration:
  const legacy: ExchangeAccount[] = [];
  const legacyChecks = [
    { ex: 'BINANCE', key: 'cryptoos_binance_key', sec: 'cryptoos_binance_secret', label: 'Binance Main Account' },
    { ex: 'BYBIT', key: 'cryptoos_bybit_key', sec: 'cryptoos_bybit_secret', label: 'Bybit Main Account' },
    { ex: 'OKX', key: 'cryptoos_okx_key', sec: 'cryptoos_okx_secret', pass: 'cryptoos_okx_pass', label: 'OKX Main Account' },
    { ex: 'MEXC', key: 'cryptoos_mexc_key', sec: 'cryptoos_mexc_secret', label: 'MEXC Main Account' },
    { ex: 'INDODAX', key: 'cryptoos_indodax_key', sec: 'cryptoos_indodax_secret', label: 'Indodax Main Account' },
    { ex: 'TOKOCRYPTO', key: 'cryptoos_tokocrypto_key', sec: 'cryptoos_tokocrypto_secret', label: 'Tokocrypto Main Account' },
    { ex: 'TRIV', key: 'cryptoos_triv_key', sec: 'cryptoos_triv_secret', label: 'Triv Main Account' },
    { ex: 'KUCOIN', key: 'cryptoos_kucoin_key', sec: 'cryptoos_kucoin_secret', pass: 'cryptoos_kucoin_pass', label: 'KuCoin Main Account' },
    { ex: 'GATEIO', key: 'cryptoos_gateio_key', sec: 'cryptoos_gateio_secret', label: 'Gate.io Main Account' },
    { ex: 'BITGET', key: 'cryptoos_bitget_key', sec: 'cryptoos_bitget_secret', pass: 'cryptoos_bitget_pass', label: 'Bitget Main Account' },
  ];

  for (const c of legacyChecks) {
    const k = localStorage.getItem(c.key);
    const s = localStorage.getItem(c.sec);
    const p = c.pass ? localStorage.getItem(c.pass) : undefined;
    if (k && k.trim()) {
      legacy.push({
        id: `acc_${Date.now()}_${c.ex.toLowerCase()}`,
        exchange: c.ex,
        label: c.label,
        apiKey: k.trim(),
        apiSecret: s?.trim() || '',
        passphrase: p?.trim() || undefined,
        createdAt: Date.now(),
      });
    }
  }

  if (legacy.length > 0) {
    localStorage.setItem('cryptoos_exchange_accounts', JSON.stringify(legacy));
  }
  return legacy;
};

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { usdToIdrRate, setUsdToIdrRate, lastRateUpdate, syncIntervalMs, setSyncIntervalMs } = useSettingsStore();
  const [rateInput, setRateInput] = useState<number>(usdToIdrRate);

  // Active Tab Navigation
  const [activeTab, setActiveTab] = useState<'vault' | 'risk' | 'alerts' | 'exchange' | 'feeds' | 'tax' | 'whitelist'>('vault');

  // Multi-Account Exchange State
  const [exchangeAccounts, setExchangeAccounts] = useState<ExchangeAccount[]>(loadInitialExchangeAccounts);
  const [exchangeAccountFilter, setExchangeAccountFilter] = useState<string>('ALL'); // 'ALL' | 'GLOBAL' | 'LOCAL' | specific exchange id

  // Modal State for Add / Edit Exchange Account
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [modalExchange, setModalExchange] = useState<string>('BINANCE');
  const [modalLabel, setModalLabel] = useState<string>('');
  const [modalApiKey, setModalApiKey] = useState<string>('');
  const [modalApiSecret, setModalApiSecret] = useState<string>('');
  const [modalPassphrase, setModalPassphrase] = useState<string>('');
  const [modalShowSecret, setModalShowSecret] = useState<boolean>(false);
  const [modalIsTesting, setModalIsTesting] = useState<boolean>(false);
  const [modalTestResult, setModalTestResult] = useState<{
    isConnected: boolean;
    latencyMs: number;
    authStatus: 'VERIFIED' | 'FAILED' | 'SKIPPED';
    errorMessage?: string;
  } | null>(null);

  // Masking toggles for individual connected account cards
  const [revealedAccountKeys, setRevealedAccountKeys] = useState<Record<string, boolean>>({});
  const toggleKeyMask = (id: string) => {
    setRevealedAccountKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Delete account confirmation
  const [accountToDelete, setAccountToDelete] = useState<ExchangeAccount | null>(null);

  // Testing individual account ping in list
  const [testingAccountId, setTestingAccountId] = useState<string | null>(null);

  // Risk Parameters
  const [maxRiskPercent, setMaxRiskPercent] = useState(() => Number(localStorage.getItem('cryptoos_max_risk') || '1.0'));
  const [circuitBreakerDd, setCircuitBreakerDd] = useState(() => Number(localStorage.getItem('cryptoos_circuit_dd') || '5.0'));
  const [maxAllocationPercent, setMaxAllocationPercent] = useState(() => Number(localStorage.getItem('cryptoos_max_alloc') || '25.0'));
  const [primaryCurrency, setPrimaryCurrency] = useState<'USD' | 'IDR'>(() => (localStorage.getItem('cryptoos_primary_curr') as any) || 'USD');

  // Webhooks State
  const [isTelegramEnabled, setIsTelegramEnabled] = useState(() => localStorage.getItem('cryptoos_telegram_enabled') === 'true');
  const [telegramBotToken, setTelegramBotToken] = useState(() => localStorage.getItem('cryptoos_telegram_bot_token') || '');
  const [telegramChatId, setTelegramChatId] = useState(() => localStorage.getItem('cryptoos_telegram_chat_id') || '');
  const [showTelegramToken, setShowTelegramToken] = useState(false);

  const [isDiscordEnabled, setIsDiscordEnabled] = useState(() => localStorage.getItem('cryptoos_discord_enabled') === 'true');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(() => localStorage.getItem('cryptoos_discord_webhook_url') || '');
  const [showDiscordUrl, setShowDiscordUrl] = useState(false);

  // Alert Event Triggers
  const [alertTradeExecution, setAlertTradeExecution] = useState(() => localStorage.getItem('cryptoos_alert_trade') !== 'false');
  const [alertCircuitBreaker, setAlertCircuitBreaker] = useState(() => localStorage.getItem('cryptoos_alert_circuit') !== 'false');
  const [alertRebalanceDrift, setAlertRebalanceDrift] = useState(() => localStorage.getItem('cryptoos_alert_rebalance') !== 'false');
  const [alertLargeCashflow, setAlertLargeCashflow] = useState(() => localStorage.getItem('cryptoos_alert_cashflow') === 'true');

  // Operations Loading States
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [isExportingVault, setIsExportingVault] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState<string | null>(null);

  // Live Database Record Counts for Active User
  const [vaultStats, setVaultStats] = useState({
    tradesCount: 0,
    cashflowCount: 0,
    ideasCount: 0,
    holdingsCount: 0,
    isLoading: true,
  });

  // Backup & Pre-Flight Restoration State
  const [lastBackupTime, setLastBackupTime] = useState<number | null>(() => {
    const val = localStorage.getItem('cryptoos_last_backup_time');
    return val ? Number(val) : null;
  });
  const [autoSnapshotEnabled, setAutoSnapshotEnabled] = useState(() => localStorage.getItem('cryptoos_auto_snapshot') !== 'false');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-Flight Inspection Data for Restore
  interface PreflightInfo {
    filename: string;
    fileSizeKb: string;
    exportDate: string;
    backupUserId: string;
    version: string;
    tradeIdeasCount: number;
    journalEntriesCount: number;
    holdingsCount: number;
    cashflowCount: number;
    hasPreferences: boolean;
    rawPayload: any;
  }
  const [preflightData, setPreflightData] = useState<PreflightInfo | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);

  // Modals & Notifications
  const [showTelegramHelp, setShowTelegramHelp] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    setRateInput(usdToIdrRate);
  }, [usdToIdrRate]);

  // Load live vault counts from database
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [tradesRes, cashflowRes, ideasRes, portRes] = await Promise.all([
          api.get<any[]>('/journal/trades').catch(() => []),
          api.get<any[]>('/cashflow').catch(() => []),
          api.get<any[]>('/ideas').catch(() => []),
          api.get<any>('/portfolio/summary').catch(() => null),
        ]);
        setVaultStats({
          tradesCount: tradesRes?.length || 0,
          cashflowCount: cashflowRes?.length || 0,
          ideasCount: ideasRes?.length || 0,
          holdingsCount: portRes?.holdings?.length || 0,
          isLoading: false,
        });
      } catch (err) {
        console.error('Failed to load live database counts:', err);
        setVaultStats((prev) => ({ ...prev, isLoading: false }));
      }
    };
    loadCounts();
  }, []);

  // Save All Preferences to localStorage & Store
  const handleSaveAll = () => {
    localStorage.setItem('cryptoos_exchange_accounts', JSON.stringify(exchangeAccounts));
    syncLegacyStorage(exchangeAccounts);

    localStorage.setItem('cryptoos_max_risk', String(maxRiskPercent));
    localStorage.setItem('cryptoos_circuit_dd', String(circuitBreakerDd));
    localStorage.setItem('cryptoos_max_alloc', String(maxAllocationPercent));
    localStorage.setItem('cryptoos_primary_curr', primaryCurrency);

    localStorage.setItem('cryptoos_telegram_enabled', String(isTelegramEnabled));
    localStorage.setItem('cryptoos_telegram_bot_token', telegramBotToken);
    localStorage.setItem('cryptoos_telegram_chat_id', telegramChatId);

    localStorage.setItem('cryptoos_discord_enabled', String(isDiscordEnabled));
    localStorage.setItem('cryptoos_discord_webhook_url', discordWebhookUrl);

    localStorage.setItem('cryptoos_alert_trade', String(alertTradeExecution));
    localStorage.setItem('cryptoos_alert_circuit', String(alertCircuitBreaker));
    localStorage.setItem('cryptoos_alert_rebalance', String(alertRebalanceDrift));
    localStorage.setItem('cryptoos_alert_cashflow', String(alertLargeCashflow));

    setUsdToIdrRate(rateInput);
    showToast('Terminal settings & preferences saved successfully.');
  };

  // Factory Reset
  const handleFactoryReset = () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') return;

    localStorage.removeItem('cryptoos_exchange_accounts');
    syncLegacyStorage([]);
    setExchangeAccounts([]);

    localStorage.removeItem('cryptoos_telegram_enabled');
    localStorage.removeItem('cryptoos_telegram_bot_token');
    localStorage.removeItem('cryptoos_telegram_chat_id');

    localStorage.removeItem('cryptoos_discord_enabled');
    localStorage.removeItem('cryptoos_discord_webhook_url');

    localStorage.removeItem('cryptoos_max_risk');
    localStorage.removeItem('cryptoos_circuit_dd');
    localStorage.removeItem('cryptoos_max_alloc');
    localStorage.removeItem('cryptoos_primary_curr');

    setIsTelegramEnabled(false);
    setTelegramBotToken('');
    setTelegramChatId('');
    setIsDiscordEnabled(false);
    setDiscordWebhookUrl('');
    setMaxRiskPercent(1.0);
    setCircuitBreakerDd(5.0);
    setMaxAllocationPercent(25.0);
    setPrimaryCurrency('USD');

    setShowResetModal(false);
    setResetConfirmText('');
    showToast('Terminal workstation reset to factory defaults.');
  };

  // Multi-Account Operations
  const handleOpenAddAccount = (preselectedExchange?: string) => {
    const ex = preselectedExchange || 'BINANCE';
    const exMeta = SUPPORTED_EXCHANGES.find((s) => s.id === ex);
    const existingCount = exchangeAccounts.filter((a) => a.exchange === ex).length;
    setEditingAccountId(null);
    setModalExchange(ex);
    setModalLabel(`${exMeta?.name || ex} Account ${existingCount + 1}`);
    setModalApiKey('');
    setModalApiSecret('');
    setModalPassphrase('');
    setModalShowSecret(false);
    setModalTestResult(null);
    setShowAccountModal(true);
  };

  const handleOpenEditAccount = (acc: ExchangeAccount) => {
    setEditingAccountId(acc.id);
    setModalExchange(acc.exchange);
    setModalLabel(acc.label);
    setModalApiKey(acc.apiKey);
    setModalApiSecret(acc.apiSecret);
    setModalPassphrase(acc.passphrase || '');
    setModalShowSecret(false);
    setModalTestResult(null);
    setShowAccountModal(true);
  };

  const handleTestModalPing = async () => {
    if (!modalApiKey.trim()) {
      showToast('Please enter an API Key to test connection', 'error');
      return;
    }
    setModalIsTesting(true);
    setModalTestResult(null);
    try {
      const testResult = await api.post<{
        exchange: string;
        isConnected: boolean;
        latencyMs: number;
        authStatus: 'VERIFIED' | 'FAILED' | 'SKIPPED';
        errorMessage: string | null;
      }>('/portfolio/exchange/test', {
        exchange: modalExchange,
        apiKey: modalApiKey.trim(),
        apiSecret: modalApiSecret.trim() || undefined,
        passphrase: modalPassphrase.trim() || undefined,
      });

      const resultData = (testResult as any)?.data || testResult;

      if (resultData?.isConnected) {
        setModalTestResult({
          isConnected: true,
          latencyMs: resultData.latencyMs,
          authStatus: resultData.authStatus,
        });
        showToast(`${modalExchange} connection verified: ${resultData.latencyMs}ms`);
      } else {
        const errMsg = resultData?.errorMessage || 'Gateway connection timed out';
        setModalTestResult({
          isConnected: false,
          latencyMs: resultData?.latencyMs || 0,
          authStatus: 'FAILED',
          errorMessage: errMsg,
        });
        showToast(`Connection failed: ${errMsg}`, 'error');
      }
    } catch (err: any) {
      setModalTestResult({
        isConnected: false,
        latencyMs: 0,
        authStatus: 'FAILED',
        errorMessage: err.message || 'Network error',
      });
      showToast(`Connection error: ${err.message}`, 'error');
    } finally {
      setModalIsTesting(false);
    }
  };

  const handleSaveModalAccount = () => {
    if (!modalApiKey.trim()) {
      showToast('API Key is required to save credentials', 'error');
      return;
    }

    const exMeta = SUPPORTED_EXCHANGES.find((s) => s.id === modalExchange);
    const label = modalLabel.trim() || `${exMeta?.name || modalExchange} Account`;

    let updated: ExchangeAccount[];
    if (editingAccountId) {
      updated = exchangeAccounts.map((a) => {
        if (a.id === editingAccountId) {
          return {
            ...a,
            exchange: modalExchange,
            label,
            apiKey: modalApiKey.trim(),
            apiSecret: modalApiSecret.trim(),
            passphrase: modalPassphrase.trim() || undefined,
            latencyMs: modalTestResult?.latencyMs ?? a.latencyMs,
            authStatus: modalTestResult?.authStatus ?? a.authStatus,
            errorMessage: modalTestResult?.errorMessage ?? a.errorMessage,
            lastPingAt: modalTestResult ? Date.now() : a.lastPingAt,
          };
        }
        return a;
      });
    } else {
      const newAcc: ExchangeAccount = {
        id: `acc_${Date.now()}_${modalExchange.toLowerCase()}_${Math.random().toString(36).substring(2, 6)}`,
        exchange: modalExchange,
        label,
        apiKey: modalApiKey.trim(),
        apiSecret: modalApiSecret.trim(),
        passphrase: modalPassphrase.trim() || undefined,
        createdAt: Date.now(),
        latencyMs: modalTestResult?.latencyMs,
        authStatus: modalTestResult?.authStatus,
        errorMessage: modalTestResult?.errorMessage,
        lastPingAt: modalTestResult ? Date.now() : undefined,
      };
      updated = [...exchangeAccounts, newAcc];
    }

    setExchangeAccounts(updated);
    localStorage.setItem('cryptoos_exchange_accounts', JSON.stringify(updated));
    syncLegacyStorage(updated);
    setShowAccountModal(false);
    showToast(editingAccountId ? 'Exchange account credentials updated.' : 'New exchange account connected.');
  };

  const handleDeleteConfirmed = () => {
    if (!accountToDelete) return;
    const updated = exchangeAccounts.filter((a) => a.id !== accountToDelete.id);
    setExchangeAccounts(updated);
    localStorage.setItem('cryptoos_exchange_accounts', JSON.stringify(updated));
    syncLegacyStorage(updated);
    setAccountToDelete(null);
    showToast('Exchange account disconnected.');
  };

  const handleTestAccountPing = async (acc: ExchangeAccount) => {
    setTestingAccountId(acc.id);
    try {
      const testResult = await api.post<{
        exchange: string;
        isConnected: boolean;
        latencyMs: number;
        authStatus: 'VERIFIED' | 'FAILED' | 'SKIPPED';
        errorMessage: string | null;
      }>('/portfolio/exchange/test', {
        exchange: acc.exchange,
        apiKey: acc.apiKey,
        apiSecret: acc.apiSecret || undefined,
        passphrase: acc.passphrase || undefined,
      });

      const resultData = (testResult as any)?.data || testResult;

      const updated = exchangeAccounts.map((a) => {
        if (a.id === acc.id) {
          return {
            ...a,
            latencyMs: resultData?.latencyMs || 0,
            authStatus: resultData?.authStatus || (resultData?.isConnected ? 'VERIFIED' : 'FAILED'),
            errorMessage: resultData?.errorMessage || undefined,
            lastPingAt: Date.now(),
          };
        }
        return a;
      });

      setExchangeAccounts(updated);
      localStorage.setItem('cryptoos_exchange_accounts', JSON.stringify(updated));

      if (resultData?.isConnected) {
        showToast(`${acc.label} (${acc.exchange}) latency: ${resultData.latencyMs}ms • Verified`);
      } else {
        showToast(`Ping failed for ${acc.label}: ${resultData?.errorMessage || 'Timeout'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Ping error for ${acc.label}: ${err.message}`, 'error');
    } finally {
      setTestingAccountId(null);
    }
  };

  // Test Telegram Bot Webhook
  const handleTestTelegram = async () => {
    if (!telegramBotToken || !telegramChatId) {
      showToast('Enter both Telegram Bot Token and Chat ID first.', 'error');
      return;
    }

    setIsTestingTelegram(true);
    try {
      const res = await api.post<{ success: boolean; message?: string }>('/settings/webhook/telegram', {
        botToken: telegramBotToken,
        chatId: telegramChatId,
        testMessage: `🔔 [CryptoOS Test Ping] Terminal notification bridge active for operator ${user?.username || 'user'}.`,
      });

      if (res.success) {
        showToast('Telegram test notification sent successfully!');
      } else {
        showToast(`Telegram test failed: ${res.message || 'Check Bot Token & Chat ID'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Telegram ping error: ${err.message}`, 'error');
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Test Discord Webhook
  const handleTestDiscord = async () => {
    if (!discordWebhookUrl) {
      showToast('Enter Discord Webhook URL first.', 'error');
      return;
    }

    setIsTestingDiscord(true);
    try {
      const res = await api.post<{ success: boolean; message?: string }>('/settings/webhook/discord', {
        webhookUrl: discordWebhookUrl,
        testMessage: `🔔 [CryptoOS Sentinel] Webhook test ping dispatched for operator ${user?.username || 'user'}.`,
      });

      if (res.success) {
        showToast('Discord embed test notification sent successfully!');
      } else {
        showToast(`Discord test failed: ${res.message || 'Check Webhook URL'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Discord ping error: ${err.message}`, 'error');
    } finally {
      setIsTestingDiscord(false);
    }
  };

  // Download Complete Portable Vault Snapshot (.json)
  const handleDownloadVaultSnapshot = async () => {
    setIsExportingVault(true);
    try {
      const serverBackup = await api.get<any>('/settings/backup/export');

      // Bundle client-side preferences & isolated identity
      const clientPreferences = {
        maxRiskPercent,
        circuitBreakerDd,
        maxAllocationPercent,
        primaryCurrency,
        syncIntervalMs,
        usdToIdrRate,
        telegram: {
          enabled: isTelegramEnabled,
          botToken: telegramBotToken || undefined,
          chatId: telegramChatId || undefined,
        },
        discord: {
          enabled: isDiscordEnabled,
          webhookUrl: discordWebhookUrl || undefined,
        },
        alerts: {
          trade: alertTradeExecution,
          circuit: alertCircuitBreaker,
          rebalance: alertRebalanceDrift,
          cashflow: alertLargeCashflow,
        },
        exchangeAccounts,
      };

      const fullVaultSnapshot = {
        appName: 'CryptoOS Quantitative Terminal',
        schema: 'CryptoOS_Portable_Vault_v2',
        ...serverBackup,
        preferences: clientPreferences,
        metadata: {
          exportedAt: new Date().toISOString(),
          operatorUsername: user?.username || 'ilhamgb11',
          operatorEmail: user?.email || 'ilhamgb11@gmail.com',
          totalRecords:
            (serverBackup.records.tradeIdeas?.length || 0) +
            (serverBackup.records.journalEntries?.length || 0) +
            (serverBackup.records.portfolioHoldings?.length || 0) +
            (serverBackup.records.cashflowLedger?.length || 0),
        },
      };

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `CryptoOS_Vault_${user?.username || 'user'}_${dateStr}.json`;
      downloadJson(filename, fullVaultSnapshot);

      const now = Date.now();
      localStorage.setItem('cryptoos_last_backup_time', String(now));
      setLastBackupTime(now);

      showToast(`Master Vault Archive (${fullVaultSnapshot.metadata.totalRecords} records) downloaded successfully.`);
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setIsExportingVault(false);
    }
  };

  // Inspect Selected Backup File for Pre-Flight Restoration
  const handleSelectBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.records) {
        showToast('Invalid backup file. CryptoOS Vault database records not found.', 'error');
        return;
      }

      setPreflightData({
        filename: file.name,
        fileSizeKb: (file.size / 1024).toFixed(1),
        exportDate: parsed.exportTimestamp ? new Date(parsed.exportTimestamp).toLocaleString('en-US') : 'Unknown',
        backupUserId: parsed.userId || parsed.metadata?.operatorUsername || 'Original User',
        version: parsed.version || '2.0.0',
        tradeIdeasCount: parsed.records.tradeIdeas?.length || 0,
        journalEntriesCount: parsed.records.journalEntries?.length || 0,
        holdingsCount: parsed.records.portfolioHoldings?.length || 0,
        cashflowCount: parsed.records.cashflowLedger?.length || 0,
        hasPreferences: Boolean(parsed.preferences),
        rawPayload: parsed,
      });
    } catch (err: any) {
      showToast(`Failed to parse backup file: ${err.message}`, 'error');
    }
  };

  // Execute Atomic Database Restoration
  const handleExecuteRestoration = async () => {
    if (!preflightData) return;

    setIsRestoring(true);
    try {
      const res = await api.post<{
        success: boolean;
        counts: { total: number; journalEntries: number; portfolioHoldings: number; cashflowLedger: number; tradeIdeas: number };
      }>('/settings/backup/import', {
        backup: preflightData.rawPayload,
        mode: restoreMode,
      });

      // Restore client-side preferences if bundled in archive
      const prefs = preflightData.rawPayload.preferences;
      if (prefs) {
        if (prefs.maxRiskPercent) {
          setMaxRiskPercent(prefs.maxRiskPercent);
          localStorage.setItem('cryptoos_max_risk', String(prefs.maxRiskPercent));
        }
        if (prefs.circuitBreakerDd) {
          setCircuitBreakerDd(prefs.circuitBreakerDd);
          localStorage.setItem('cryptoos_circuit_dd', String(prefs.circuitBreakerDd));
        }
        if (prefs.maxAllocationPercent) {
          setMaxAllocationPercent(prefs.maxAllocationPercent);
          localStorage.setItem('cryptoos_max_alloc', String(prefs.maxAllocationPercent));
        }
        if (prefs.primaryCurrency) {
          setPrimaryCurrency(prefs.primaryCurrency);
          localStorage.setItem('cryptoos_primary_curr', prefs.primaryCurrency);
        }
        if (prefs.syncIntervalMs) {
          setSyncIntervalMs(prefs.syncIntervalMs);
          localStorage.setItem('cryptoos_sync_interval', String(prefs.syncIntervalMs));
        }
        if (prefs.usdToIdrRate) {
          setUsdToIdrRate(prefs.usdToIdrRate);
          setRateInput(prefs.usdToIdrRate);
        }
        if (prefs.telegram?.botToken) setTelegramBotToken(prefs.telegram.botToken);
        if (prefs.telegram?.chatId) setTelegramChatId(prefs.telegram.chatId);
        if (prefs.discord?.webhookUrl) setDiscordWebhookUrl(prefs.discord.webhookUrl);
        if (prefs.exchangeAccounts && Array.isArray(prefs.exchangeAccounts)) {
          setExchangeAccounts(prefs.exchangeAccounts);
          localStorage.setItem('cryptoos_exchange_accounts', JSON.stringify(prefs.exchangeAccounts));
          syncLegacyStorage(prefs.exchangeAccounts);
        }
      }

      showToast(`Recovery complete: ${res.counts.total} records restored to your account.`);
      setPreflightData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh stats
      setVaultStats({
        tradesCount: res.counts.journalEntries,
        cashflowCount: res.counts.cashflowLedger,
        ideasCount: res.counts.tradeIdeas,
        holdingsCount: res.counts.portfolioHoldings,
        isLoading: false,
      });
    } catch (err: any) {
      showToast(`Restoration failed: ${err.message}`, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  // CSV Exporters
  const handleExportTradesCsv = async () => {
    setIsExportingCsv('trades');
    try {
      const trades = await api.get<any[]>('/journal/trades');
      exportJournalTradesToCsv(trades || []);
      showToast('Trading journal ledger exported to CSV.');
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setIsExportingCsv(null);
    }
  };

  const handleExportCashflowCsv = async () => {
    setIsExportingCsv('cashflow');
    try {
      const transactions = await api.get<any[]>('/cashflow');
      exportCashflowToCsv(transactions || []);
      showToast('Cashflow treasury ledger exported to CSV.');
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setIsExportingCsv(null);
    }
  };

  const handleExportHoldingsCsv = async () => {
    setIsExportingCsv('holdings');
    try {
      const summary = await api.get<any>('/portfolio/summary');
      exportHoldingsToCsv(summary?.holdings || []);
      showToast('Spot portfolio holdings exported to CSV.');
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setIsExportingCsv(null);
    }
  };

  const configuredExchangesCount = exchangeAccounts.length;
  const isVaultProtected = Boolean(lastBackupTime && Date.now() - lastBackupTime < 86400000 * 7);

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
        <div className="terminal-toast toast-enter" style={{ borderColor: notification.type === 'error' ? 'var(--color-bearish)' : 'var(--color-accent-primary)' }}>
          <Sparkles size={15} color={notification.type === 'error' ? 'var(--color-bearish)' : 'var(--color-accent-primary)'} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Telegram Help Modal */}
      {showTelegramHelp && (
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
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="modal-dialog-animate"
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#0a0a0c',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.95)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#229ED9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={15} color="#fff" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Telegram Bot Setup Guide
                </h3>
              </div>
              <button
                onClick={() => setShowTelegramHelp(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong>1. Create a Telegram Bot:</strong> Open Telegram, search for <span className="mono" style={{ color: 'var(--color-accent-primary)' }}>@BotFather</span>, send <span className="mono">/newbot</span>, and copy the generated <strong>HTTP API Token</strong>.
              </div>
              <div>
                <strong>2. Start the Bot:</strong> Open your newly created bot in Telegram and click <strong>Start</strong>.
              </div>
              <div>
                <strong>3. Retrieve Chat ID:</strong> Message <span className="mono" style={{ color: 'var(--color-accent-primary)' }}>@userinfobot</span> to find your numerical <strong>Id</strong>.
              </div>
              <div>
                <strong>4. Enter & Test:</strong> Paste the Bot Token and Chat ID into the settings fields, then click <strong>Send Test Ping</strong>.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowTelegramHelp(false)}
                style={{ height: '34px', fontSize: '12px' }}
              >
                Got it, Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Factory Reset Warning Modal */}
      {showResetModal && (
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
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="modal-dialog-animate"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#0a0a0c',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.95)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="var(--color-bearish)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-bearish)', margin: 0 }}>
                Factory Reset Terminal Workstation
              </h3>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              This action clears all locally stored exchange credentials, custom webhooks, and browser configurations. Ensure you have downloaded a Master Vault Archive (.json) before proceeding.
            </p>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-bearish)', fontWeight: 700 }}>
                Type "RESET" in capital letters to confirm:
              </span>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
                className="form-input mono"
                style={{ height: '34px', fontSize: '12px', marginTop: '6px', borderColor: 'rgba(239, 68, 68, 0.5)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmText('');
                }}
                style={{ height: '34px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleFactoryReset}
                disabled={resetConfirmText.trim().toUpperCase() !== 'RESET'}
                style={{
                  height: '34px',
                  fontSize: '12px',
                  fontWeight: 800,
                  backgroundColor: 'var(--color-bearish)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0 16px',
                  cursor: resetConfirmText.trim().toUpperCase() === 'RESET' ? 'pointer' : 'not-allowed',
                  opacity: resetConfirmText.trim().toUpperCase() === 'RESET' ? 1 : 0.5,
                }}
              >
                Factory Reset Workstation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar (Standard CryptoOS Web Terminal Format) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)', padding: '0 4px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-accent-primary)', fontWeight: 800, letterSpacing: '0.06em' }}>
              SYSTEM ENVIRONMENT & USER PREFERENCES
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>&bull;</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              AUTONOMOUS DISASTER RECOVERY KERNEL
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: '3px 0 0' }}>
            Settings & System Workstation
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
            Autonomous per-user vault backups, capital risk guardrails, Telegram/Discord alert bridges, and read-only exchange credentials.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowResetModal(true)}
            className="btn btn-secondary"
            style={{ height: '34px', fontSize: '12px', padding: '0 12px', color: 'var(--color-bearish)', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
            title="Reset workstation cache"
          >
            <Trash2 size={13} />
            <span>Factory Reset</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="btn btn-primary"
            style={{ height: '34px', fontSize: '12px', padding: '0 18px', fontWeight: 800 }}
          >
            <Save size={14} />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Top Aggregated Status KPI Ribbon (Seamless Edge-to-Edge Strip) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          borderLeft: 'none',
          borderRight: 'none',
          backgroundColor: '#000000',
          margin: '0 -4px',
        }}
      >
        {/* Cell 1: Disaster Recovery Vault */}
        <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
              ACCOUNT DATA VAULT
            </span>
            <span className={isVaultProtected ? 'bullish-badge' : 'amber-badge'} style={{ fontSize: '9px', padding: '1px 5px' }}>
              {isVaultProtected ? 'PROTECTED' : 'BACKUP NEEDED'}
            </span>
          </div>
          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="mono" style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>
              {vaultStats.tradesCount + vaultStats.cashflowCount + vaultStats.ideasCount} Records
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {lastBackupTime ? `Last Backup: ${new Date(lastBackupTime).toLocaleDateString()}` : 'No archive downloaded yet'}
          </span>
        </div>

        {/* Cell 2: Exchange Read-Only Keys */}
        <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
              READ-ONLY EXCHANGE APIS
            </span>
            <span className={configuredExchangesCount > 0 ? 'cyan-badge' : 'neutral-badge'} style={{ fontSize: '9px', padding: '1px 5px' }}>
              {configuredExchangesCount > 0 ? `${configuredExchangesCount} CONNECTED` : 'OPTIONAL (0)'}
            </span>
          </div>
          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={13} color="var(--color-bullish)" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
              Zero-Withdrawal Strict
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Automated spot balance verification
          </span>
        </div>

        {/* Cell 3: Telegram & Discord Webhooks */}
        <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
              WEBHOOK DISPATCHERS
            </span>
            <span className={isTelegramEnabled || isDiscordEnabled ? 'bullish-badge' : 'neutral-badge'} style={{ fontSize: '9px', padding: '1px 5px' }}>
              {isTelegramEnabled && isDiscordEnabled ? '2 ARMED' : isTelegramEnabled || isDiscordEnabled ? '1 ARMED' : 'STANDBY'}
            </span>
          </div>
          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: isTelegramEnabled ? '#fff' : 'var(--color-text-muted)' }}>Telegram</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>&bull;</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: isDiscordEnabled ? '#fff' : 'var(--color-text-muted)' }}>Discord</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Realtime execution notifications
          </span>
        </div>

        {/* Cell 4: Market Sync Engine */}
        <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
              MARKET SYNC CYCLE
            </span>
            <span className="amber-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              {Math.round(syncIntervalMs / 60000)}M CYCLE
            </span>
          </div>
          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="mono" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-accent-primary)' }}>
              {usdToIdrRate.toLocaleString()} IDR
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            USD / IDR Baseline (Updated: {new Date(lastRateUpdate).toLocaleTimeString()})
          </span>
        </div>

        {/* Cell 5: Risk Limits */}
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>
              RISK PROTOCOL
            </span>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
              ENFORCED
            </span>
          </div>
          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="mono" style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>
              {maxRiskPercent}%
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Max Risk</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>&bull;</span>
            <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-bearish)' }}>
              {circuitBreakerDd}% DD
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Circuit Breaker Drawdown Stop
          </span>
        </div>
      </div>

      {/* Main Settings 2-Column Workstation Container */}
      <div className="settings-layout-container" style={{ padding: '0 4px', marginTop: 'var(--space-2)' }}>
        {/* Left Column: Elegant Vertical Navigation Sidebar */}
        <aside
          style={{
            position: 'sticky',
            top: '80px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: '#07080a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg, 10px)',
            padding: '16px 12px',
          }}
        >
          {/* Operator Profile Card */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#121216',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 900,
                color: 'var(--color-accent-primary)',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username || 'Operator'}
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                (user?.username?.[0] || 'O').toUpperCase()
              )}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.username || 'Operator'}
                </span>
                <span
                  className={
                    user?.role === 'OWNER'
                      ? 'amber-badge'
                      : user?.role === 'ADMIN'
                      ? 'cyan-badge'
                      : 'neutral-badge'
                  }
                  style={{ fontSize: '9px', padding: '1px 5px', fontWeight: 800, flexShrink: 0 }}
                >
                  {user?.role || 'USER'}
                </span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '1px',
                }}
              >
                {user?.email || 'operator@cryptoos.internal'}
              </div>
            </div>
          </div>

          {/* Navigation Groups */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Group 1: DATA & SECURITY */}
            <div>
              <div
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-muted)',
                  padding: '0 8px 6px',
                  textTransform: 'uppercase',
                }}
              >
                Data & Security
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <SidebarTabButton
                  active={activeTab === 'vault'}
                  onClick={() => setActiveTab('vault')}
                  icon={Shield}
                  label="Data Vault & Recovery"
                  badge={isVaultProtected ? 'PROTECTED' : 'BACKUP NEEDED'}
                  badgeClass={isVaultProtected ? 'bullish-badge' : 'amber-badge'}
                />
                <SidebarTabButton
                  active={activeTab === 'exchange'}
                  onClick={() => setActiveTab('exchange')}
                  icon={Key}
                  label="Exchange Credentials"
                  badge={configuredExchangesCount > 0 ? `${configuredExchangesCount} ACTIVE` : undefined}
                  badgeClass="bullish-badge"
                />
                {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
                  <SidebarTabButton
                    active={activeTab === 'whitelist'}
                    onClick={() => setActiveTab('whitelist')}
                    icon={Users}
                    label="User Whitelist (Admin)"
                    badge={user?.role === 'OWNER' ? 'OWNER' : 'ADMIN'}
                    badgeClass="amber-badge"
                  />
                )}
              </div>
            </div>

            {/* Group 2: STRATEGY & ALERTS */}
            <div>
              <div
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-muted)',
                  padding: '0 8px 6px',
                  textTransform: 'uppercase',
                }}
              >
                Strategy & Alerts
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <SidebarTabButton
                  active={activeTab === 'risk'}
                  onClick={() => setActiveTab('risk')}
                  icon={Sliders}
                  label="Risk Protocol & Sizing"
                />
                <SidebarTabButton
                  active={activeTab === 'alerts'}
                  onClick={() => setActiveTab('alerts')}
                  icon={MessageSquare}
                  label="Telegram & Discord Alerts"
                  badge={isTelegramEnabled && isDiscordEnabled ? '2 ARMED' : isTelegramEnabled || isDiscordEnabled ? '1 ARMED' : undefined}
                  badgeClass="cyan-badge"
                />
              </div>
            </div>

            {/* Group 3: ENGINE & REPORTING */}
            <div>
              <div
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-muted)',
                  padding: '0 8px 6px',
                  textTransform: 'uppercase',
                }}
              >
                Engine & Reporting
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <SidebarTabButton
                  active={activeTab === 'feeds'}
                  onClick={() => setActiveTab('feeds')}
                  icon={Globe}
                  label="Forex & Auto-Sync Engine"
                />
                <SidebarTabButton
                  active={activeTab === 'tax'}
                  onClick={() => setActiveTab('tax')}
                  icon={FileSpreadsheet}
                  label="Tax-Ready CSV Exports"
                />
              </div>
            </div>
          </nav>

          {/* Bottom Telemetry & Quick Action */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-bullish)', boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)' }} />
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  KERNEL ONLINE
                </span>
              </div>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                v2.4 Enterprise
              </span>
            </div>

            <button
              onClick={() => setShowResetModal(true)}
              style={{
                width: '100%',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                backgroundColor: 'rgba(244, 63, 94, 0.05)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                borderRadius: 'var(--radius-sm, 6px)',
                color: 'var(--color-bearish)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.2)';
              }}
            >
              <Trash2 size={12} />
              <span>Reset Workstation</span>
            </button>
          </div>
        </aside>

        {/* Right Column: Active Tab Panels */}
        <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

      {/* TAB 1: AUTONOMOUS DATA VAULT & DISASTER RECOVERY */}
      {activeTab === 'vault' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: '0 4px' }}>
          {/* Vault Overview Card (Apple Inset Surface) */}
          <div
            style={{
              backgroundColor: '#0c0c0e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="var(--color-accent-primary)" />
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '0.02em' }}>
                  Autonomous Disaster Recovery & Cryptographic Data Vault
                </h3>
              </div>
              <span className="bullish-badge" style={{ fontSize: '9px', padding: '2px 8px' }}>
                PER-USER ISOLATED
              </span>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                All trading journal records, psychological post-mortems, cashflow ledger mutations, pipeline confluence ideas, and spot portfolio holdings are isolated per authenticated operator. Generating a <strong>Master Vault Archive (.json)</strong> ensures that even if the host machine powers down, containers terminate, or local SQLite storage is wiped, your entire workstation state can be restored with a single click.
              </p>

              {/* 4-Stat Live Records Ledger */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>CLOSED TRADES & P&L</span>
                  <div className="mono" style={{ fontSize: '16px', fontWeight: 900, color: 'var(--color-accent-primary)', marginTop: '3px' }}>
                    {vaultStats.tradesCount} Records
                  </div>
                  <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
                    Journal execution history
                  </span>
                </div>

                <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>CASHFLOW MUTATIONS</span>
                  <div className="mono" style={{ fontSize: '16px', fontWeight: 900, color: 'var(--color-bullish)', marginTop: '3px' }}>
                    {vaultStats.cashflowCount} Transactions
                  </div>
                  <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
                    Deposits, yields & withdrawals
                  </span>
                </div>

                <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>PIPELINE CONFLUENCE</span>
                  <div className="mono" style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8', marginTop: '3px' }}>
                    {vaultStats.ideasCount} Setups
                  </div>
                  <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
                    4-Pillars swing setups
                  </span>
                </div>

                <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>PORTFOLIO ASSETS</span>
                  <div className="mono" style={{ fontSize: '16px', fontWeight: 900, color: '#f59e0b', marginTop: '3px' }}>
                    {vaultStats.holdingsCount} Holdings
                  </div>
                  <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
                    Spot asset balances
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Restore Controls (Grouped Inset Surface) */}
          <div
            style={{
              backgroundColor: '#0c0c0e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={15} color="var(--color-accent-primary)" />
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Vault Backup & Restoration Controls
                </h3>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                ARCHIVE FORMAT: CRYPTOOS_VAULT_V2.0
              </span>
            </div>

            {/* Row 1: Export Snapshot */}
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(212, 175, 55, 0.12)',
                    color: 'var(--color-accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Download size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                    Download Master Vault Archive (.json)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Bundles all database trades, treasury ledger, trade ideas, spot holdings, and local preferences into a single verifiable file.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadVaultSnapshot}
                disabled={isExportingVault}
                className="btn btn-primary"
                style={{
                  height: '36px',
                  fontSize: '12px',
                  padding: '0 16px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                }}
              >
                <Download size={14} />
                <span>{isExportingVault ? 'Generating...' : 'Download Vault Archive'}</span>
              </button>
            </div>

            {/* Row 2: Import & Restore Snapshot */}
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Upload size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                    Restore Workstation from Master Vault Archive
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Rebuild all journal trades, treasury history, and portfolio allocations onto your account after a server wipe.
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleSelectBackupFile}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                style={{
                  height: '36px',
                  fontSize: '12px',
                  padding: '0 16px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                <Upload size={14} />
                <span>Import Vault Archive (.json)</span>
              </button>
            </div>

            {/* Row 3: Automatic Local Storage Snapshot */}
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--color-bullish)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <HardDrive size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                    Automatic Local Storage Snapshot Cache
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Automatically updates a local browser backup snapshot when a trade is logged or closed.
                  </div>
                </div>
              </div>

              <AppleToggle
                checked={autoSnapshotEnabled}
                onChange={(val) => {
                  setAutoSnapshotEnabled(val);
                  localStorage.setItem('cryptoos_auto_snapshot', String(val));
                  showToast(`Automatic browser snapshot cache: ${val ? 'Enabled' : 'Disabled'}`);
                }}
              />
            </div>
          </div>

          {/* Pre-Flight Inspection Dialog Card */}
          {preflightData && (
            <div
              style={{
                backgroundColor: '#0c0c0e',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileJson size={18} color="var(--color-accent-primary)" />
                  <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                    Pre-Flight Archive Verification: {preflightData.filename} ({preflightData.fileSizeKb} KB)
                  </h3>
                </div>
                <button
                  onClick={() => setPreflightData(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>JOURNAL TRADES</span>
                  <div className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-accent-primary)', marginTop: '2px' }}>
                    {preflightData.journalEntriesCount} Entries
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>CASHFLOW MUTATIONS</span>
                  <div className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-bullish)', marginTop: '2px' }}>
                    {preflightData.cashflowCount} Records
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>PIPELINE SETUPS</span>
                  <div className="mono" style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                    {preflightData.tradeIdeasCount} Ideas
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>PORTFOLIO ASSETS</span>
                  <div className="mono" style={{ fontSize: '15px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
                    {preflightData.holdingsCount} Holdings
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Recovery Strategy:</span>
                  <div style={{ width: '260px' }}>
                    <CustomSelect<'merge' | 'overwrite'>
                      value={restoreMode}
                      onChange={(val) => setRestoreMode(val)}
                      options={[
                        { value: 'merge', label: 'Merge (Preserve & Append Records)' },
                        { value: 'overwrite', label: 'Clean Rebuild (Wipe & Replace)' },
                      ]}
                      size="sm"
                    />
                  </div>
                </div>

                <button
                  onClick={handleExecuteRestoration}
                  disabled={isRestoring}
                  className="btn btn-primary"
                  style={{
                    height: '34px',
                    fontSize: '12px',
                    padding: '0 18px',
                    fontWeight: 800,
                  }}
                >
                  {isRestoring ? 'Restoring Database...' : 'Restore Workstation from Archive'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RISK PROTOCOL & SIZING */}
      {activeTab === 'risk' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', padding: '0 4px' }}>
          {/* Column 1: Capital Risk Guardrails */}
          <div
            style={{
              backgroundColor: '#0c0c0e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={15} color="#FF9F0A" />
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Capital Risk & Position Guardrails
                </h3>
              </div>
              <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
                ENFORCED GLOBALLY
              </span>
            </div>

            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Risk Control 1 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ maxWidth: '280px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                    Default Risk per Trade (% Portfolio)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Standard Kelly fraction baseline automatically populated into the Position Sizer Calculator.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5.0"
                    value={maxRiskPercent}
                    onChange={(e) => setMaxRiskPercent(Number(e.target.value))}
                    className="form-input mono"
                    style={{ height: '34px', fontSize: '12px', width: '90px', textAlign: 'center', fontWeight: 800 }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>%</span>
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />

              {/* Risk Control 2 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ maxWidth: '280px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                    Circuit Breaker Drawdown Stop (%)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Emergency stop signal triggered if intraday account drawdown exceeds this threshold.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    step="0.5"
                    min="1.0"
                    max="20.0"
                    value={circuitBreakerDd}
                    onChange={(e) => setCircuitBreakerDd(Number(e.target.value))}
                    className="form-input mono"
                    style={{ height: '34px', fontSize: '12px', width: '90px', textAlign: 'center', fontWeight: 800 }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>%</span>
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />

              {/* Risk Control 3 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ maxWidth: '280px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                    Max Single Asset Allocation Cap (%)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Concentration ceiling preventing oversized allocation into any single coin or sector.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    step="1.0"
                    min="5.0"
                    max="50.0"
                    value={maxAllocationPercent}
                    onChange={(e) => setMaxAllocationPercent(Number(e.target.value))}
                    className="form-input mono"
                    style={{ height: '34px', fontSize: '12px', width: '90px', textAlign: 'center', fontWeight: 800 }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>%</span>
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />

              {/* Risk Control 4: Primary Currency Format */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                    Primary Base Currency
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Dominant baseline currency rendered across all terminal dashboard and ledger cards.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
                  <button
                    type="button"
                    onClick={() => setPrimaryCurrency('USD')}
                    style={{
                      height: '30px',
                      padding: '0 14px',
                      fontSize: '11px',
                      fontWeight: 800,
                      borderRadius: 'var(--radius-xs)',
                      border: 'none',
                      backgroundColor: primaryCurrency === 'USD' ? 'var(--color-accent-primary)' : 'transparent',
                      color: primaryCurrency === 'USD' ? '#000000' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    USD ($) Primary
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrimaryCurrency('IDR')}
                    style={{
                      height: '30px',
                      padding: '0 14px',
                      fontSize: '11px',
                      fontWeight: 800,
                      borderRadius: 'var(--radius-xs)',
                      border: 'none',
                      backgroundColor: primaryCurrency === 'IDR' ? 'var(--color-accent-primary)' : 'transparent',
                      color: primaryCurrency === 'IDR' ? '#000000' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    IDR (Rp) Primary
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Quantitative Risk Framework Card */}
          <div
            style={{
              backgroundColor: '#0c0c0e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <Zap size={15} color="var(--color-accent-primary)" />
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Quantitative Risk Framework & Sizing Math
              </h3>
            </div>

            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <div style={{ padding: '12px 14px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-accent-primary)', display: 'block', marginBottom: '4px' }}>
                  THE HALF-KELLY FORMULATION
                </span>
                <span className="mono" style={{ fontSize: '13px', color: '#ffffff', fontWeight: 800, display: 'block', margin: '4px 0' }}>
                  Position Size = (Account Capital × Risk %) ÷ (Entry Price - Stop Loss)
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                  By anchoring every trade directly to the mathematical distance to your invalidation stop loss, portfolio drawdown remains strictly capped at {maxRiskPercent}%.
                </span>
              </div>

              <div>
                <strong style={{ color: '#fff' }}>Circuit Breaker Guardrail:</strong> When cumulative unrealized and realized daily loss crosses {circuitBreakerDd}%, the terminal flags a high-priority halt alert to prevent emotional revenge trading.
              </div>

              <div>
                <strong style={{ color: '#fff' }}>Concentration Limit:</strong> Enforcing a {maxAllocationPercent}% cap ensures that black swan events on single tokens cannot threaten portfolio solvency.
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Baseline Evaluation Status:</span>
                <span className="bullish-badge" style={{ fontSize: '9px' }}>ACTIVE & ENFORCED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TELEGRAM & DISCORD ALERTS */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: '0 4px' }}>
          {/* Dispatcher Bridges Container */}
          <div
            style={{
              backgroundColor: '#0c0c0e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={15} color="#5E5CE6" />
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Realtime Notification Webhook Bridges
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTelegramHelp(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent-primary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <HelpCircle size={13} />
                <span>Telegram Bot Setup Guide</span>
              </button>
            </div>

            {/* Telegram Integration Row */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#229ED922',
                      color: '#229ED9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Send size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                      Telegram Bot Dispatcher Bridge
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Dispatch trade execution signals, stop triggers, and drawdown alarms directly into your Telegram chat.
                    </div>
                  </div>
                </div>

                <AppleToggle checked={isTelegramEnabled} onChange={setIsTelegramEnabled} />
              </div>

              {/* Collapsible Telegram Configuration */}
              {isTelegramEnabled && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'grid', gridTemplateColumns: '1fr 180px auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                      TELEGRAM BOT TOKEN
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showTelegramToken ? 'text' : 'password'}
                        value={telegramBotToken}
                        onChange={(e) => setTelegramBotToken(e.target.value)}
                        placeholder="e.g. 7182910382:AAH9f28_x9..."
                        className="form-input mono"
                        style={{ height: '34px', fontSize: '11px', paddingRight: '32px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowTelegramToken(!showTelegramToken)}
                        style={{ position: 'absolute', right: '8px', top: '8px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                      >
                        {showTelegramToken ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                      TARGET CHAT ID
                    </label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="e.g. 109283741"
                      className="form-input mono"
                      style={{ height: '34px', fontSize: '11px' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram || !telegramBotToken || !telegramChatId}
                    className="btn btn-secondary"
                    style={{
                      height: '34px',
                      fontSize: '11px',
                      padding: '0 14px',
                      fontWeight: 800,
                      color: '#229ED9',
                      borderColor: '#229ED9',
                      cursor: !telegramBotToken || !telegramChatId ? 'not-allowed' : 'pointer',
                      opacity: !telegramBotToken || !telegramChatId ? 0.4 : 1,
                    }}
                  >
                    {isTestingTelegram ? 'Pinging...' : 'Send Test Ping'}
                  </button>
                </div>
              )}
            </div>

            {/* Discord Integration Row */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#5865F222',
                      color: '#5865F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                      Discord Webhook Sentinel Bridge
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Broadcast rich formatted embed trade updates into your dedicated trading Discord channel.
                    </div>
                  </div>
                </div>

                <AppleToggle checked={isDiscordEnabled} onChange={setIsDiscordEnabled} />
              </div>

              {/* Collapsible Discord Configuration */}
              {isDiscordEnabled && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                      DISCORD WEBHOOK URL
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showDiscordUrl ? 'text' : 'password'}
                        value={discordWebhookUrl}
                        onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                        placeholder="https://discord.com/api/webhooks/12984.../aX9..."
                        className="form-input mono"
                        style={{ height: '34px', fontSize: '11px', paddingRight: '32px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDiscordUrl(!showDiscordUrl)}
                        style={{ position: 'absolute', right: '8px', top: '8px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                      >
                        {showDiscordUrl ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestDiscord}
                    disabled={isTestingDiscord || !discordWebhookUrl}
                    className="btn btn-secondary"
                    style={{
                      height: '34px',
                      fontSize: '11px',
                      padding: '0 14px',
                      fontWeight: 800,
                      color: '#5865F2',
                      borderColor: '#5865F2',
                      cursor: !discordWebhookUrl ? 'not-allowed' : 'pointer',
                      opacity: !discordWebhookUrl ? 0.4 : 1,
                    }}
                  >
                    {isTestingDiscord ? 'Pinging...' : 'Send Test Embed'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Event Triggers Card */}
          <div
            style={{
              backgroundColor: '#0c0c0e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Active Notification Event Triggers
              </h3>
            </div>

            {[
              { label: 'Trade Execution Alerts (Position Opened, TP Hit, SL Hit)', state: alertTradeExecution, setter: setAlertTradeExecution },
              { label: `Circuit Breaker Drawdown Breach (${circuitBreakerDd}% Account DD)`, state: alertCircuitBreaker, setter: setAlertCircuitBreaker },
              { label: 'Portfolio Allocation Drift Alert (> 2.0% Tolerance Trigger)', state: alertRebalanceDrift, setter: setAlertRebalanceDrift },
              { label: 'Whale Cashflow Mutation Alert (Deposits / Withdrawals > $1,000 USD)', state: alertLargeCashflow, setter: setAlertLargeCashflow },
            ].map((item, idx) => (
              <React.Fragment key={item.label}>
                <div
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '12.5px', color: '#ffffff', fontWeight: 600 }}>{item.label}</span>
                  <AppleToggle checked={item.state} onChange={item.setter} />
                </div>
                {idx < 3 && <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EXCHANGE API CREDENTIALS (MULTI-ACCOUNT CEX ARCHITECTURE) */}
      {activeTab === 'exchange' && (() => {
        // Collect distinct exchange IDs present in configured accounts for quick filtering
        const distinctConnectedExchanges = Array.from(new Set(exchangeAccounts.map((a) => a.exchange)));

        const displayedAccounts = exchangeAccounts.filter((acc) => {
          if (exchangeAccountFilter === 'ALL') return true;
          if (exchangeAccountFilter === 'GLOBAL') {
            const exMeta = SUPPORTED_EXCHANGES.find((s) => s.id === acc.exchange);
            return exMeta?.category === 'GLOBAL';
          }
          if (exchangeAccountFilter === 'LOCAL') {
            const exMeta = SUPPORTED_EXCHANGES.find((s) => s.id === acc.exchange);
            return exMeta?.category === 'LOCAL';
          }
          return acc.exchange === exchangeAccountFilter;
        });

        const selectedMeta = SUPPORTED_EXCHANGES.find((s) => s.id === modalExchange) || SUPPORTED_EXCHANGES[0];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '0 4px' }}>
            {/* Top Command Banner */}
            <div
              style={{
                backgroundColor: '#0c0c0e',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(212, 175, 55, 0.12)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Key size={16} color="var(--color-accent-primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                      Exchange Read-Only API Credentials
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '3px 0 0', lineHeight: 1.4 }}>
                      Multi-account CEX architecture. Manage multiple API keys per exchange with strict client-side zero-withdrawal enforcement.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="bullish-badge" style={{ fontSize: '9px', padding: '2px 8px', fontWeight: 800 }}>
                  ZERO-WITHDRAWAL ENFORCED
                </span>
                <button
                  type="button"
                  id="btn-add-cex-account"
                  onClick={() => handleOpenAddAccount()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-accent-primary)',
                    color: '#000000',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(212, 175, 55, 0.25)';
                  }}
                >
                  <Plus size={14} strokeWidth={3} />
                  <span>Connect CEX Account</span>
                </button>
              </div>
            </div>

            {/* Filter and Telemetry Strip */}
            {exchangeAccounts.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '2px 2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setExchangeAccountFilter('ALL')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: exchangeAccountFilter === 'ALL' ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: exchangeAccountFilter === 'ALL' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: exchangeAccountFilter === 'ALL' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    All Accounts ({exchangeAccounts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setExchangeAccountFilter('GLOBAL')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: exchangeAccountFilter === 'GLOBAL' ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: exchangeAccountFilter === 'GLOBAL' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: exchangeAccountFilter === 'GLOBAL' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Global
                  </button>
                  <button
                    type="button"
                    onClick={() => setExchangeAccountFilter('LOCAL')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: exchangeAccountFilter === 'LOCAL' ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: exchangeAccountFilter === 'LOCAL' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: exchangeAccountFilter === 'LOCAL' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Indonesian (Bappebti)
                  </button>

                  {distinctConnectedExchanges.map((exId) => {
                    const count = exchangeAccounts.filter((a) => a.exchange === exId).length;
                    const exMeta = SUPPORTED_EXCHANGES.find((s) => s.id === exId);
                    const isActive = exchangeAccountFilter === exId;
                    return (
                      <button
                        key={exId}
                        type="button"
                        onClick={() => setExchangeAccountFilter(exId)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '5px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          border: isActive ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255, 255, 255, 0.06)',
                          backgroundColor: isActive ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <ExchangeIcon exchange={exId} size={12} />
                        <span>{exMeta?.name || exId} ({count})</span>
                      </button>
                    );
                  })}
                </div>

                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Showing <strong style={{ color: '#fff' }}>{displayedAccounts.length}</strong> of {exchangeAccounts.length} accounts
                </span>
              </div>
            )}

            {/* Empty State: When No Accounts Connected Yet */}
            {exchangeAccounts.length === 0 && (
              <div
                style={{
                  backgroundColor: '#0c0c0e',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '40px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Key size={26} color="var(--color-accent-primary)" />
                </div>

                <div style={{ maxWidth: '520px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
                    No Exchange Accounts Connected Yet
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Connect read-only API credentials to automate spot balance reconciliation, calculate accurate portfolio NAV, and monitor real-time latency across 10 supported global and Indonesian exchanges.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddAccount()}
                  style={{
                    marginTop: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-accent-primary)',
                    color: '#000000',
                    fontWeight: 900,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Connect Your First Exchange Account</span>
                </button>

                {/* Supported Exchanges Icons Carousel Strip */}
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', width: '100%', maxWidth: '640px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    10 Supported Tier-1 & Regulated Platforms
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    {SUPPORTED_EXCHANGES.map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => handleOpenAddAccount(ex.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                          e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                        }}
                      >
                        <ExchangeIcon exchange={ex.id} size={14} />
                        <span style={{ fontWeight: 700 }}>{ex.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Connected Accounts List Cards */}
            {exchangeAccounts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {displayedAccounts.map((acc) => {
                  const exMeta = SUPPORTED_EXCHANGES.find((s) => s.id === acc.exchange);
                  const isTesting = testingAccountId === acc.id;
                  const isRevealed = Boolean(revealedAccountKeys[acc.id]);

                  // Masked API Key: show first 6 and last 4 chars
                  const maskedKey =
                    acc.apiKey.length > 10
                      ? `${acc.apiKey.substring(0, 6)}••••••••••••${acc.apiKey.slice(-4)}`
                      : '••••••••••••';

                  return (
                    <div
                      key={acc.id}
                      style={{
                        backgroundColor: '#0c0c0e',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 'var(--radius-md, 8px)',
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                    >
                      {/* Top Row: Brand, Custom Label, Telemetry & Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <ExchangeIcon exchange={acc.exchange} size={22} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff' }}>
                                {acc.label}
                              </span>
                              <span className={exMeta?.badgeClass || 'neutral-badge'} style={{ fontSize: '9px', padding: '1px 6px', fontWeight: 800 }}>
                                {exMeta?.name || acc.exchange}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                &bull; {exMeta?.regionLabel}
                              </span>
                            </div>
                          </div>

                          {/* Live Ping Status Pill */}
                          <div style={{ marginLeft: '4px' }}>
                            {acc.latencyMs !== undefined ? (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: acc.authStatus === 'VERIFIED' ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                                  color: acc.authStatus === 'VERIFIED' ? 'var(--color-bullish)' : 'var(--color-bearish)',
                                  border: `1px solid ${acc.authStatus === 'VERIFIED' ? 'rgba(52, 199, 89, 0.25)' : 'rgba(255, 59, 48, 0.25)'}`,
                                }}
                              >
                                <span
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: acc.authStatus === 'VERIFIED' ? 'var(--color-bullish)' : 'var(--color-bearish)',
                                  }}
                                />
                                {acc.authStatus === 'VERIFIED' ? `${acc.latencyMs}ms • Verified` : acc.errorMessage || 'Failed'}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                  color: 'var(--color-text-muted)',
                                  border: '1px solid rgba(255, 255, 255, 0.06)',
                                }}
                              >
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.3)' }} />
                                Untested
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleTestAccountPing(acc)}
                            disabled={isTesting}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '5px',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              backgroundColor: 'rgba(212, 175, 55, 0.08)',
                              color: 'var(--color-accent-primary)',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: isTesting ? 'wait' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Zap size={12} />
                            <span>{isTesting ? 'Testing Ping...' : 'Test Ping'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditAccount(acc)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '5px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              color: 'var(--color-text-secondary)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Edit Credentials"
                          >
                            <Pencil size={12} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAccountToDelete(acc)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '5px',
                              border: '1px solid rgba(255, 59, 48, 0.2)',
                              backgroundColor: 'rgba(255, 59, 48, 0.06)',
                              color: 'var(--color-bearish)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Disconnect Account"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Masked Credentials Display */}
                      <div
                        style={{
                          backgroundColor: '#000000',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>API KEY:</span>
                            <span className="mono" style={{ fontSize: '11px', color: '#fff', letterSpacing: '0.04em' }}>
                              {isRevealed ? acc.apiKey : maskedKey}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(acc.apiKey);
                                showToast('API Key copied to clipboard');
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '2px' }}
                              title="Copy API Key"
                            >
                              <Copy size={11} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>SECRET:</span>
                            <span className="mono" style={{ fontSize: '11px', color: '#fff' }}>
                              {isRevealed ? acc.apiSecret : '••••••••••••••••'}
                            </span>
                          </div>

                          {acc.passphrase && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>PASSPHRASE:</span>
                              <span className="mono" style={{ fontSize: '11px', color: '#fff' }}>
                                {isRevealed ? acc.passphrase : '••••••••'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button
                            type="button"
                            onClick={() => toggleKeyMask(acc.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '11px',
                              color: 'var(--color-text-secondary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                          </button>

                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            Connected {new Date(acc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Zero-Knowledge Privacy Guarantee Notice */}
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <ShieldCheck size={16} color="var(--color-accent-primary)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                All API credentials remain strictly confined within your client-side browser sandbox (`localStorage`). Withdrawal permissions are strictly unsupported by design, guaranteeing complete capital defense.
              </span>
            </div>

            {/* MODAL DIALOG: CONNECT / EDIT EXCHANGE ACCOUNT */}
            {showAccountModal && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.82)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: '16px',
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowAccountModal(false);
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '620px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    backgroundColor: '#0c0d10',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                    borderRadius: 'var(--radius-lg, 12px)',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Modal Header */}
                  <div
                    style={{
                      padding: '18px 22px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(212, 175, 55, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ExchangeIcon exchange={modalExchange} size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>
                          {editingAccountId ? 'Edit Exchange Account' : 'Connect Exchange Account'}
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Read-only API authentication with optional multi-account support.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAccountModal(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Step 1: Select CEX Grid */}
                    <div>
                      <label style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                        1. SELECT CRYPTOCURRENCY EXCHANGE (10 PLATFORMS)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '6px' }}>
                        {SUPPORTED_EXCHANGES.map((ex) => {
                          const isSelected = modalExchange === ex.id;
                          return (
                            <button
                              key={ex.id}
                              type="button"
                              onClick={() => {
                                setModalExchange(ex.id);
                                if (!editingAccountId) {
                                  const count = exchangeAccounts.filter((a) => a.exchange === ex.id).length;
                                  setModalLabel(`${ex.name} Account ${count + 1}`);
                                }
                                setModalTestResult(null);
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                padding: '8px 6px',
                                borderRadius: '6px',
                                border: isSelected ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                                backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.14)' : '#000000',
                                color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <ExchangeIcon exchange={ex.id} size={18} />
                              <span style={{ fontSize: '10.5px', fontWeight: isSelected ? 800 : 600 }}>{ex.name}</span>
                              <span style={{ fontSize: '8px', color: isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-muted)' }}>
                                {ex.category === 'LOCAL' ? 'ID Bappebti' : 'Global'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Custom Account Identifier / Label */}
                    <div>
                      <label style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                        2. ACCOUNT NICKNAME / IDENTIFIER
                      </label>
                      <input
                        type="text"
                        value={modalLabel}
                        onChange={(e) => setModalLabel(e.target.value)}
                        placeholder={`e.g. ${selectedMeta.name} Main Spot or Sub-account #2`}
                        className="form-input"
                        style={{ height: '36px', fontSize: '12px', backgroundColor: '#000000' }}
                      />
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                        Use clear identifiers if you connect multiple accounts under the same exchange.
                      </span>
                    </div>

                    {/* Step 3: API Key & Secret Credentials */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 800, letterSpacing: '0.04em', display: 'block', margin: 0 }}>
                        3. READ-ONLY API CREDENTIALS
                      </label>

                      <div>
                        <input
                          type="text"
                          value={modalApiKey}
                          onChange={(e) => setModalApiKey(e.target.value)}
                          placeholder={selectedMeta.keyPlaceholder}
                          className="form-input mono"
                          style={{ height: '36px', fontSize: '11px', backgroundColor: '#000000' }}
                        />
                      </div>

                      <div style={{ position: 'relative' }}>
                        <input
                          type={modalShowSecret ? 'text' : 'password'}
                          value={modalApiSecret}
                          onChange={(e) => setModalApiSecret(e.target.value)}
                          placeholder={selectedMeta.secretPlaceholder}
                          className="form-input mono"
                          style={{ height: '36px', fontSize: '11px', backgroundColor: '#000000', paddingRight: '36px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setModalShowSecret(!modalShowSecret)}
                          style={{ position: 'absolute', right: '10px', top: '9px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                        >
                          {modalShowSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      {selectedMeta.hasPassphrase && (
                        <div>
                          <input
                            type={modalShowSecret ? 'text' : 'password'}
                            value={modalPassphrase}
                            onChange={(e) => setModalPassphrase(e.target.value)}
                            placeholder={selectedMeta.passPlaceholder || 'API Passphrase'}
                            className="form-input mono"
                            style={{ height: '36px', fontSize: '11px', backgroundColor: '#000000' }}
                          />
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                            Required by {selectedMeta.name} for V2/V5 authenticated endpoints.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Step 4: Live Pre-Flight Connection Test */}
                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#000000',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fff' }}>
                          Gateway Latency & Auth Verification
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Test the API key against {selectedMeta.name} gateway before saving.
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {modalTestResult && (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              color: modalTestResult.isConnected ? 'var(--color-bullish)' : 'var(--color-bearish)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {modalTestResult.isConnected ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                            {modalTestResult.isConnected ? `${modalTestResult.latencyMs}ms Verified` : modalTestResult.errorMessage || 'Failed'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={handleTestModalPing}
                          disabled={modalIsTesting || !modalApiKey.trim()}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: modalIsTesting || !modalApiKey.trim() ? 'not-allowed' : 'pointer',
                            backgroundColor: 'rgba(212, 175, 55, 0.12)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            color: 'var(--color-accent-primary)',
                            opacity: !modalApiKey.trim() ? 0.4 : 1,
                          }}
                        >
                          {modalIsTesting ? 'Pinging Gateway...' : 'Test Connection'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div
                    style={{
                      padding: '14px 22px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowAccountModal(false)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-secondary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="btn-save-cex-account"
                      onClick={handleSaveModalAccount}
                      disabled={!modalApiKey.trim()}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-accent-primary)',
                        color: '#000000',
                        fontSize: '12px',
                        fontWeight: 900,
                        border: 'none',
                        cursor: !modalApiKey.trim() ? 'not-allowed' : 'pointer',
                        opacity: !modalApiKey.trim() ? 0.4 : 1,
                      }}
                    >
                      {editingAccountId ? 'Save Changes' : 'Connect Account'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DELETE ACCOUNT CONFIRMATION MODAL */}
            {accountToDelete && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '440px',
                    backgroundColor: '#0e0f12',
                    border: '1px solid rgba(255, 59, 48, 0.35)',
                    borderRadius: '12px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255, 59, 48, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={18} color="var(--color-bearish)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Disconnect Exchange Account?
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {accountToDelete.label} ({accountToDelete.exchange})
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    This will remove the read-only credentials from your browser sandbox. Any recorded trades or portfolio transactions in your database will remain intact.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setAccountToDelete(null)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-secondary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConfirmed}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-bearish)',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Disconnect Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 5: FOREX & AUTO-SYNC ENGINE */}
      {activeTab === 'feeds' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', padding: '0 4px' }}>
          {/* Column 1: Polling Intervals & Currency Conversion */}
          <div
            style={{
              backgroundColor: '#0c0c0e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={15} color="var(--color-bullish)" />
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Autonomous Data Feeds & Currency Baseline
                </h3>
              </div>
              <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
                LIVE GLOBAL FEEDS
              </span>
            </div>

            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sync Interval Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                    Background Data Refresh Interval
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Polling frequency for spot market prices and ECB forex conversions.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
                  {[
                    { ms: 60_000, label: '1m', title: '1 Minute' },
                    { ms: 300_000, label: '5m', title: '5 Minutes' },
                    { ms: 900_000, label: '15m', title: '15 Minutes' },
                    { ms: 1_800_000, label: '30m', title: '30 Minutes' },
                    { ms: 3_600_000, label: '60m', title: '1 Hour' },
                  ].map((item) => {
                    const isSelected = syncIntervalMs === item.ms;
                    return (
                      <button
                        key={item.ms}
                        type="button"
                        onClick={() => {
                          setSyncIntervalMs(item.ms);
                          showToast(`Data refresh interval updated to ${item.title}`);
                        }}
                        style={{
                          height: '30px',
                          padding: '0 12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          borderRadius: 'var(--radius-xs)',
                          border: 'none',
                          backgroundColor: isSelected ? 'var(--color-accent-primary)' : 'transparent',
                          color: isSelected ? '#000000' : 'var(--color-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />

              {/* USD/IDR Baseline Manual Override */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                    USD / IDR Baseline Conversion Rate
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Live rate from European Central Bank feeds. Can be manually overridden.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    value={rateInput}
                    onChange={(e) => setRateInput(Number(e.target.value))}
                    className="form-input mono"
                    style={{ height: '34px', fontSize: '12px', width: '130px', fontWeight: 800 }}
                  />
                  <span className="mono" style={{ fontSize: '12px', color: 'var(--color-accent-primary)', fontWeight: 800 }}>
                    IDR
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUsdToIdrRate(Number(rateInput));
                      showToast(`USD/IDR rate baseline set to ${Number(rateInput).toLocaleString()} IDR`);
                    }}
                    className="btn btn-secondary"
                    style={{ height: '34px', fontSize: '11px', padding: '0 12px', fontWeight: 700 }}
                  >
                    Apply Rate
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Data Providers Pipeline Status */}
          <div
            style={{
              backgroundColor: '#0c0c0e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <Activity size={15} color="var(--color-bullish)" />
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Data Pipeline & Ingestion Sources
              </h3>
            </div>

            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'CoinGecko Spot Price API', desc: 'Realtime token valuation, volume & 24h delta', status: 'OPERATIONAL' },
                { name: 'European Central Bank (ECB)', desc: 'Official institutional USD/IDR forex baseline', status: 'OPERATIONAL' },
                { name: 'Autonomous SQLite Storage Kernel', desc: 'Local ACID-compliant transactional persistence', status: 'HEALTHY' },
              ].map((provider) => (
                <div
                  key={provider.name}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{provider.name}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{provider.desc}</div>
                  </div>
                  <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
                    {provider.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TAX-READY CSV EXPORTS */}
      {activeTab === 'tax' && (
        <div
          style={{
            backgroundColor: '#0c0c0e',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            margin: '0 4px',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={15} color="#66D4CF" />
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                1-Click Tax Filing & Accounting CSV Exporters
              </h3>
            </div>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
              EXCEL & KOINLY COMPATIBLE
            </span>
          </div>

          {/* CSV Row 1: Trades */}
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                Trading Journal Ledger (Trades & Net Realized P&L)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Complete closed and open transaction records including entry/exit prices, position sizes, R-multiples, and post-mortems.
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportTradesCsv}
              disabled={isExportingCsv === 'trades'}
              className="btn btn-secondary"
              style={{
                height: '34px',
                padding: '0 16px',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              }}
            >
              <Download size={13} />
              <span>{isExportingCsv === 'trades' ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>

          {/* CSV Row 2: Cashflow */}
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                Treasury Cashflow Ledger (Deposits & Withdrawals)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                All fiat capital injections, profit extractions, passive staking yield harvests, and transaction gas fee records.
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportCashflowCsv}
              disabled={isExportingCsv === 'cashflow'}
              className="btn btn-secondary"
              style={{
                height: '34px',
                padding: '0 16px',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              }}
            >
              <Download size={13} />
              <span>{isExportingCsv === 'cashflow' ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>

          {/* CSV Row 3: Holdings */}
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                Current Spot Portfolio Holdings & Allocations
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Active coin breakdown, average cost bases, target allocations %, and cold storage / exchange locations.
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportHoldingsCsv}
              disabled={isExportingCsv === 'holdings'}
              className="btn btn-secondary"
              style={{
                height: '34px',
                padding: '0 16px',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              }}
            >
              <Download size={13} />
              <span>{isExportingCsv === 'holdings' ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        </div>
      )}

        {/* TAB 7: USER ACCESS & WHITELIST MANAGER (ADMIN/OWNER ONLY) */}
        {activeTab === 'whitelist' && (
          <UserWhitelistManager />
        )}
        </main>
      </div>
    </div>
  );
};
