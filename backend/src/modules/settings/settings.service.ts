import axios from 'axios';
import { sqliteClient } from '../../db/index.js';
import { ValidationError } from '../../utils/errors.js';

export interface TelegramTestPayload {
  botToken: string;
  chatId: string;
  maxRisk?: number;
  circuitBreaker?: number;
}

export interface DiscordTestPayload {
  webhookUrl: string;
  maxRisk?: number;
  circuitBreaker?: number;
}

export interface FullBackupPayload {
  exportTimestamp: number;
  version: string;
  userId: string;
  records: {
    tradeIdeas: any[];
    journalEntries: any[];
    portfolioHoldings: any[];
    cashflowLedger: any[];
  };
}

export class SettingsService {
  /**
   * Test Telegram Bot webhook dispatching
   */
  public async testTelegram(payload: TelegramTestPayload) {
    const { botToken, chatId, maxRisk = 1.0, circuitBreaker = 5.0 } = payload;

    if (!botToken || !chatId) {
      throw new ValidationError('Telegram Bot Token and Chat ID are both required.');
    }

    const cleanedToken = botToken.trim();
    const cleanedChatId = chatId.trim();

    const startTime = Date.now();
    const text = [
      '🟢 *CryptoOS Sentinel • Telegram Webhook Active*',
      '──────────────────────────────',
      '• *Terminal*: CryptoOS Quantitative Trading Terminal',
      '• *Status*: ONLINE (<100ms)',
      `• *Max Risk / Trade*: ${maxRisk}%`,
      `• *Drawdown Circuit Breaker*: ${circuitBreaker}%`,
      `• *Timestamp*: ${new Date().toISOString()}`,
      '',
      '✅ *Dispatcher connected successfully. You will receive trade executions, drawdown warnings, and rebalancing alerts here.*',
    ].join('\n');

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${cleanedToken}/sendMessage`,
        {
          chat_id: cleanedChatId,
          text,
          parse_mode: 'Markdown',
        },
        { timeout: 8000 }
      );

      const latencyMs = Date.now() - startTime;
      return {
        isConnected: true,
        latencyMs,
        messageId: response.data?.result?.message_id,
        chatTitle: response.data?.result?.chat?.title || response.data?.result?.chat?.first_name || 'Telegram Chat',
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.description || err.message || 'Telegram API connection failed';
      throw new ValidationError(`Telegram Dispatch Failed: ${errMsg}`);
    }
  }

  /**
   * Test Discord Webhook embed dispatching
   */
  public async testDiscord(payload: DiscordTestPayload) {
    const { webhookUrl, maxRisk = 1.0, circuitBreaker = 5.0 } = payload;

    if (!webhookUrl) {
      throw new ValidationError('Discord Webhook URL is required.');
    }

    const cleanedUrl = webhookUrl.trim();
    if (!cleanedUrl.startsWith('https://discord.com/api/webhooks/') && !cleanedUrl.startsWith('https://discordapp.com/api/webhooks/')) {
      throw new ValidationError('Invalid Discord Webhook URL. It must begin with https://discord.com/api/webhooks/');
    }

    const startTime = Date.now();
    const embedPayload = {
      username: 'CryptoOS Sentinel',
      avatar_url: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
      embeds: [
        {
          title: '🟢 CryptoOS Sentinel • Webhook Linked & Online',
          description: 'Realtime notification bridge verified. You will receive live trade execution logs, severe drawdown warnings, and rebalancing triggers in this channel.',
          color: 13938487, // Gold (#D4AF37)
          fields: [
            { name: 'Terminal Mode', value: 'Institutional Cardless', inline: true },
            { name: 'Risk Protocol', value: `${maxRisk}% Max Risk`, inline: true },
            { name: 'Drawdown Stop', value: `${circuitBreaker}% DD Circuit`, inline: true },
            { name: 'Dispatch Channel', value: 'Discord Webhook Relay', inline: true },
            { name: 'Network Latency', value: 'Measuring...', inline: true },
            { name: 'Security Protocol', value: 'Zero-Withdrawal Read-Only', inline: true },
          ],
          footer: {
            text: 'CryptoOS Quantitative Execution Engine • 2026',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      await axios.post(cleanedUrl, embedPayload, { timeout: 8000 });
      const latencyMs = Date.now() - startTime;
      return {
        isConnected: true,
        latencyMs,
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Discord Webhook dispatch failed';
      throw new ValidationError(`Discord Webhook Failed: ${errMsg}`);
    }
  }

  /**
   * Export complete user database into a JSON bundle
   */
  public async exportFullDatabase(userId: string): Promise<FullBackupPayload> {
    const [ideasRes, journalRes, holdingsRes, cashflowRes] = await Promise.all([
      sqliteClient.execute({
        sql: 'SELECT * FROM trade_ideas WHERE user_id = ? ORDER BY created_at DESC',
        args: [userId],
      }),
      sqliteClient.execute({
        sql: 'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY opened_at DESC',
        args: [userId],
      }),
      sqliteClient.execute({
        sql: 'SELECT * FROM portfolio_holdings WHERE user_id = ? ORDER BY symbol ASC',
        args: [userId],
      }),
      sqliteClient.execute({
        sql: 'SELECT * FROM cashflow_ledger WHERE user_id = ? ORDER BY transaction_date DESC',
        args: [userId],
      }),
    ]);

    return {
      exportTimestamp: Date.now(),
      version: '1.0.0',
      userId,
      records: {
        tradeIdeas: ideasRes.rows,
        journalEntries: journalRes.rows,
        portfolioHoldings: holdingsRes.rows,
        cashflowLedger: cashflowRes.rows,
      },
    };
  }

  /**
   * Import complete user database from a JSON bundle (Merge or Overwrite)
   * Executed atomically using LibSQL batch write transactions to ensure zero data corruption/loss
   */
  public async importFullDatabase(userId: string, backup: FullBackupPayload, mode: 'merge' | 'overwrite' = 'merge') {
    if (!backup || !backup.records) {
      throw new ValidationError('Invalid backup file format. Missing "records" root object.');
    }

    const { tradeIdeas = [], journalEntries = [], portfolioHoldings = [], cashflowLedger = [] } = backup.records;

    const statements: Array<{ sql: string; args: any[] }> = [];

    // 1. If overwrite, prepend transactional wipe for the current authenticated user only
    if (mode === 'overwrite') {
      statements.push(
        { sql: 'DELETE FROM trade_ideas WHERE user_id = ?', args: [userId] },
        { sql: 'DELETE FROM journal_entries WHERE user_id = ?', args: [userId] },
        { sql: 'DELETE FROM portfolio_holdings WHERE user_id = ?', args: [userId] },
        { sql: 'DELETE FROM cashflow_ledger WHERE user_id = ?', args: [userId] }
      );
    }

    // 2. Queue all Trade Ideas
    for (const idea of tradeIdeas) {
      statements.push({
        sql: `INSERT OR REPLACE INTO trade_ideas 
          (id, user_id, created_at, updated_at, symbol, direction, timeframe, status, macro_data, fundamental_data, price_action_data, evidence_data, entry_price, stop_loss_price, tp1_price, tp2_price, tp3_price, risk_percent, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          idea.id,
          userId,
          idea.created_at || Date.now(),
          idea.updated_at || Date.now(),
          idea.symbol,
          idea.direction,
          idea.timeframe,
          idea.status,
          typeof idea.macro_data === 'object' ? JSON.stringify(idea.macro_data) : idea.macro_data || null,
          typeof idea.fundamental_data === 'object' ? JSON.stringify(idea.fundamental_data) : idea.fundamental_data || null,
          typeof idea.price_action_data === 'object' ? JSON.stringify(idea.price_action_data) : idea.price_action_data || null,
          typeof idea.evidence_data === 'object' ? JSON.stringify(idea.evidence_data) : idea.evidence_data || null,
          idea.entry_price || null,
          idea.stop_loss_price || null,
          idea.tp1_price || null,
          idea.tp2_price || null,
          idea.tp3_price || null,
          idea.risk_percent || null,
          idea.notes || null,
        ],
      });
    }

    // 3. Queue all Journal Entries
    for (const t of journalEntries) {
      statements.push({
        sql: `INSERT OR REPLACE INTO journal_entries
          (id, user_id, idea_id, symbol, direction, entry_price, exit_price, position_size, stop_loss_price, take_profit_price, status, pnl_usd, pnl_idr, pnl_percent, r_multiple, psychological_state, lessons_learned, opened_at, closed_at, screenshots_meta)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          t.id,
          userId,
          t.idea_id || null,
          t.symbol,
          t.direction,
          t.entry_price,
          t.exit_price || null,
          t.position_size,
          t.stop_loss_price,
          t.take_profit_price || null,
          t.status,
          t.pnl_usd || null,
          t.pnl_idr || null,
          t.pnl_percent || null,
          t.r_multiple || null,
          t.psychological_state || null,
          t.lessons_learned || null,
          t.opened_at,
          t.closed_at || null,
          typeof t.screenshots_meta === 'object' ? JSON.stringify(t.screenshots_meta) : t.screenshots_meta || null,
        ],
      });
    }

    // 4. Queue all Portfolio Holdings
    for (const h of portfolioHoldings) {
      statements.push({
        sql: `INSERT OR REPLACE INTO portfolio_holdings
          (id, user_id, symbol, amount, average_buy_price, target_percent, exchange, is_manual, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          h.id,
          userId,
          h.symbol,
          h.amount,
          h.average_buy_price || null,
          h.target_percent || null,
          h.exchange || 'MANUAL',
          h.is_manual ?? 1,
          h.updated_at || Date.now(),
        ],
      });
    }

    // 5. Queue all Cashflow Ledger Entries
    for (const c of cashflowLedger) {
      statements.push({
        sql: `INSERT OR REPLACE INTO cashflow_ledger
          (id, user_id, type, amount_usd, amount_idr, source_or_destination, exchange, transaction_date, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          c.id,
          userId,
          c.type,
          c.amount_usd,
          c.amount_idr,
          c.source_or_destination || null,
          c.exchange || null,
          c.transaction_date,
          c.notes || null,
        ],
      });
    }

    // 6. Execute atomic batch write transaction
    try {
      if (statements.length > 0) {
        await sqliteClient.batch(statements, 'write');
      }
    } catch (err: any) {
      throw new ValidationError(`Database restore failed and was atomically rolled back: ${err.message}`);
    }

    return {
      success: true,
      mode,
      counts: {
        tradeIdeas: tradeIdeas.length,
        journalEntries: journalEntries.length,
        portfolioHoldings: portfolioHoldings.length,
        cashflowLedger: cashflowLedger.length,
        total: tradeIdeas.length + journalEntries.length + portfolioHoldings.length + cashflowLedger.length,
      },
    };
  }
}

export const settingsService = new SettingsService();
