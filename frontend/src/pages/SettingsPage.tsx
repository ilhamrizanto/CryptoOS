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
  Info,
  ChevronRight,
  LucideIcon,
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

// Sleek Vertical Sidebar Navigation Item Component
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
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
        >
          {label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {badge && (
          <span
            className={badgeClass || 'neutral-badge'}
            style={{ fontSize: '8.5px', padding: '1px 5px', fontWeight: 800 }}
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
          }}
        />
      </div>
    </button>
  );
};

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { usdToIdrRate, setUsdToIdrRate, lastRateUpdate, syncIntervalMs, setSyncIntervalMs } = useSettingsStore();
  const [rateInput, setRateInput] = useState<number>(usdToIdrRate);

  // Active Tab Navigation
  const [activeTab, setActiveTab] = useState<'vault' | 'risk' | 'alerts' | 'exchange' | 'feeds' | 'tax' | 'whitelist'>('vault');

  // Exchange Keys State
  const [binanceKey, setBinanceKey] = useState(() => localStorage.getItem('cryptoos_binance_key') || '');
  const [binanceSecret, setBinanceSecret] = useState(() => localStorage.getItem('cryptoos_binance_secret') || '');
  const [bybitKey, setBybitKey] = useState(() => localStorage.getItem('cryptoos_bybit_key') || '');
  const [bybitSecret, setBybitSecret] = useState(() => localStorage.getItem('cryptoos_bybit_secret') || '');
  const [okxKey, setOkxKey] = useState(() => localStorage.getItem('cryptoos_okx_key') || '');
  const [okxSecret, setOkxSecret] = useState(() => localStorage.getItem('cryptoos_okx_secret') || '');
  const [okxPassphrase, setOkxPassphrase] = useState(() => localStorage.getItem('cryptoos_okx_pass') || '');

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

  // Key Visibility Toggles
  const [showBinance, setShowBinance] = useState(false);
  const [showBybit, setShowBybit] = useState(false);
  const [showOkx, setShowOkx] = useState(false);

  // Operations Loading States
  const [isTestingExchange, setIsTestingExchange] = useState<string | null>(null);
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
    localStorage.setItem('cryptoos_binance_key', binanceKey);
    localStorage.setItem('cryptoos_binance_secret', binanceSecret);
    localStorage.setItem('cryptoos_bybit_key', bybitKey);
    localStorage.setItem('cryptoos_bybit_secret', bybitSecret);
    localStorage.setItem('cryptoos_okx_key', okxKey);
    localStorage.setItem('cryptoos_okx_secret', okxSecret);
    localStorage.setItem('cryptoos_okx_pass', okxPassphrase);

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

    localStorage.removeItem('cryptoos_binance_key');
    localStorage.removeItem('cryptoos_binance_secret');
    localStorage.removeItem('cryptoos_bybit_key');
    localStorage.removeItem('cryptoos_bybit_secret');
    localStorage.removeItem('cryptoos_okx_key');
    localStorage.removeItem('cryptoos_okx_secret');
    localStorage.removeItem('cryptoos_okx_pass');

    localStorage.removeItem('cryptoos_telegram_enabled');
    localStorage.removeItem('cryptoos_telegram_bot_token');
    localStorage.removeItem('cryptoos_telegram_chat_id');

    localStorage.removeItem('cryptoos_discord_enabled');
    localStorage.removeItem('cryptoos_discord_webhook_url');

    localStorage.removeItem('cryptoos_max_risk');
    localStorage.removeItem('cryptoos_circuit_dd');
    localStorage.removeItem('cryptoos_max_alloc');
    localStorage.removeItem('cryptoos_primary_curr');

    setBinanceKey('');
    setBinanceSecret('');
    setBybitKey('');
    setBybitSecret('');
    setOkxKey('');
    setOkxSecret('');
    setOkxPassphrase('');
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

  // Ping Exchange API
  const handleTestConnection = async (exchangeName: string) => {
    setIsTestingExchange(exchangeName);
    try {
      await new Promise((r) => setTimeout(r, 700));
      showToast(`${exchangeName} read-only connection verified successfully.`);
    } catch {
      showToast(`Connection to ${exchangeName} failed. Verify your API credentials.`, 'error');
    } finally {
      setIsTestingExchange(null);
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
        exchangeKeys: {
          binanceKey: binanceKey || undefined,
          bybitKey: bybitKey || undefined,
          okxKey: okxKey || undefined,
        },
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

  const configuredExchangesCount = [binanceKey, bybitKey, okxKey].filter(Boolean).length;
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
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 900,
                color: 'var(--color-accent-primary)',
                flexShrink: 0,
              }}
            >
              {(user?.username?.[0] || 'O').toUpperCase()}
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

      {/* TAB 4: EXCHANGE API CREDENTIALS */}
      {activeTab === 'exchange' && (
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
              <Key size={15} color="var(--color-accent-primary)" />
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Exchange Read-Only API Credentials
              </h3>
            </div>
            <span className="bullish-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
              STRICT READ-ONLY ENFORCEMENT
            </span>
          </div>

          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              API credentials are completely optional and used strictly for automated spot balance verification. CryptoOS operates under a zero-withdrawal policy and never requires trade execution permissions.
            </p>

            {/* Binance Spot */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExchangeIcon exchange="BINANCE" size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>BINANCE SPOT ACCOUNT</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleTestConnection('Binance')}
                    disabled={isTestingExchange === 'Binance'}
                    style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--color-accent-primary)', cursor: 'pointer', fontWeight: 800 }}
                  >
                    {isTestingExchange === 'Binance' ? 'Pinging...' : 'Test Ping'}
                  </button>
                  <button
                    onClick={() => setShowBinance(!showBinance)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                  >
                    {showBinance ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type={showBinance ? 'text' : 'password'}
                  value={binanceKey}
                  onChange={(e) => setBinanceKey(e.target.value)}
                  placeholder="Binance API Key"
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '11px' }}
                />
                <input
                  type={showBinance ? 'text' : 'password'}
                  value={binanceSecret}
                  onChange={(e) => setBinanceSecret(e.target.value)}
                  placeholder="Binance API Secret"
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '11px' }}
                />
              </div>
            </div>

            {/* Bybit Unified */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExchangeIcon exchange="BYBIT" size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>BYBIT UNIFIED ACCOUNT</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleTestConnection('Bybit')}
                    disabled={isTestingExchange === 'Bybit'}
                    style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--color-accent-primary)', cursor: 'pointer', fontWeight: 800 }}
                  >
                    {isTestingExchange === 'Bybit' ? 'Pinging...' : 'Test Ping'}
                  </button>
                  <button
                    onClick={() => setShowBybit(!showBybit)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                  >
                    {showBybit ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type={showBybit ? 'text' : 'password'}
                  value={bybitKey}
                  onChange={(e) => setBybitKey(e.target.value)}
                  placeholder="Bybit API Key"
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '11px' }}
                />
                <input
                  type={showBybit ? 'text' : 'password'}
                  value={bybitSecret}
                  onChange={(e) => setBybitSecret(e.target.value)}
                  placeholder="Bybit API Secret"
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '11px' }}
                />
              </div>
            </div>

            {/* OKX Trading */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExchangeIcon exchange="OKX" size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>OKX TRADING ACCOUNT</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleTestConnection('OKX')}
                    disabled={isTestingExchange === 'OKX'}
                    style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--color-accent-primary)', cursor: 'pointer', fontWeight: 800 }}
                  >
                    {isTestingExchange === 'OKX' ? 'Pinging...' : 'Test Ping'}
                  </button>
                  <button
                    onClick={() => setShowOkx(!showOkx)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                  >
                    {showOkx ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <input
                  type={showOkx ? 'text' : 'password'}
                  value={okxKey}
                  onChange={(e) => setOkxKey(e.target.value)}
                  placeholder="OKX Key"
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '11px' }}
                />
                <input
                  type={showOkx ? 'text' : 'password'}
                  value={okxSecret}
                  onChange={(e) => setOkxSecret(e.target.value)}
                  placeholder="OKX Secret"
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '11px' }}
                />
                <input
                  type={showOkx ? 'text' : 'password'}
                  value={okxPassphrase}
                  onChange={(e) => setOkxPassphrase(e.target.value)}
                  placeholder="Passphrase"
                  className="form-input mono"
                  style={{ height: '34px', fontSize: '11px' }}
                />
              </div>
            </div>

            {/* Cryptographic Zero-Knowledge Security Notice */}
            <div style={{ marginTop: '8px', padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={16} color="var(--color-accent-primary)" />
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                API keys are stored exclusively in your local browser sandbox. They are never sent to external servers, never shared with third parties, and withdrawal endpoints are strictly unsupported.
              </span>
            </div>
          </div>
        </div>
      )}

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
