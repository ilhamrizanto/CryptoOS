import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 1. Users table (Multi-user authentication)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email'),
  role: text('role').default('USER'),
  createdAt: integer('created_at').notNull(),
});

// 2. Trade Ideas (Pipeline & Idea Incubator - Multi-User Isolated)
export const tradeIdeas = sqliteTable('trade_ideas', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').notNull().default('user-ilhamgb11'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  symbol: text('symbol').notNull(),
  direction: text('direction').notNull(), // 'LONG' | 'SHORT'
  timeframe: text('timeframe').notNull(),
  status: text('status').notNull(), // 'WATCHLIST' | 'READY' | 'ACTIVE' | 'CLOSED' | 'INVALIDATED'
  macroData: text('macro_data'), // JSON string
  fundamentalData: text('fundamental_data'), // JSON string
  priceActionData: text('price_action_data'), // JSON string
  evidenceData: text('evidence_data'), // JSON string (contains screenshot keys)
  entryPrice: real('entry_price'),
  stopLossPrice: real('stop_loss_price'),
  tp1Price: real('tp1_price'),
  tp2Price: real('tp2_price'),
  tp3Price: real('tp3_price'),
  riskPercent: real('risk_percent'),
  confidenceScore: real('confidence_score').default(8),
  playstyle: text('playstyle').default('SWING'),
  strategy: text('strategy').default('PRICE_ACTION'),
  confluences: text('confluences'),
  notes: text('notes'),
});

// 3. Trading Journal (Multi-User Isolated)
export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').notNull().default('user-ilhamgb11'),
  ideaId: text('idea_id'),
  symbol: text('symbol').notNull(),
  direction: text('direction').notNull(),
  entryPrice: real('entry_price').notNull(),
  exitPrice: real('exit_price'),
  positionSize: real('position_size').notNull(),
  stopLossPrice: real('stop_loss_price').notNull(),
  takeProfitPrice: real('take_profit_price'),
  status: text('status').notNull(), // 'OPEN' | 'CLOSED' | 'CANCELLED'
  confidenceScore: real('confidence_score').default(8),
  playstyle: text('playstyle').default('SWING'),
  strategy: text('strategy').default('PRICE_ACTION'),
  pnlUsd: real('pnl_usd'),
  pnlIdr: real('pnl_idr'),
  pnlPercent: real('pnl_percent'),
  rMultiple: real('r_multiple'),
  psychologicalState: text('psychological_state'), // Feelings & emotions at entry
  lessonsLearned: text('lessons_learned'), // Post-trade review
  openedAt: integer('opened_at').notNull(),
  closedAt: integer('closed_at'),
  screenshotsMeta: text('screenshots_meta'), // JSON metadata of screenshots
});

// 4. Portfolio Holdings (Multi-User Isolated)
export const portfolioHoldings = sqliteTable('portfolio_holdings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default('user-ilhamgb11'),
  symbol: text('symbol').notNull(),
  amount: real('amount').notNull(),
  averageBuyPrice: real('average_buy_price'),
  targetPercent: real('target_percent'),
  exchange: text('exchange').notNull(), // 'BINANCE' | 'BYBIT' | 'OKX' | 'MANUAL' | 'WALLET'
  isManual: integer('is_manual').notNull().default(1),
  updatedAt: integer('updated_at').notNull(),
});

// 5. Cashflow Ledger (Multi-User Isolated)
export const cashflowLedger = sqliteTable('cashflow_ledger', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default('user-ilhamgb11'),
  type: text('type').notNull(), // 'DEPOSIT' | 'WITHDRAWAL' | 'STAKING_YIELD' | 'AIRDROP' | 'FEE'
  amountUsd: real('amount_usd').notNull(),
  amountIdr: real('amount_idr').notNull(),
  sourceOrDestination: text('source_or_destination'),
  exchange: text('exchange'),
  transactionDate: integer('transaction_date').notNull(),
  notes: text('notes'),
});

// 6. System Settings
export const systemSettings = sqliteTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// 7. User Whitelist (Multi-User Access Control)
export const userWhitelist = sqliteTable('user_whitelist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  role: text('role').default('USER'), // 'OWNER' | 'ADMIN' | 'USER'
  notes: text('notes'),
  status: text('status').default('ACTIVE'), // 'ACTIVE' | 'REVOKED'
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
