import { sqliteClient } from './index.js';
import { env } from '../env.js';

export async function initializeDatabase(): Promise<void> {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'USER',
      avatar_url TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trade_ideas (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'user-ilhamgb11',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL,
      timeframe TEXT NOT NULL,
      status TEXT NOT NULL,
      macro_data TEXT,
      fundamental_data TEXT,
      price_action_data TEXT,
      evidence_data TEXT,
      entry_price REAL,
      stop_loss_price REAL,
      tp1_price REAL,
      tp2_price REAL,
      tp3_price REAL,
      risk_percent REAL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'user-ilhamgb11',
      idea_id TEXT,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL,
      position_size REAL NOT NULL,
      stop_loss_price REAL NOT NULL,
      take_profit_price REAL,
      status TEXT NOT NULL,
      pnl_usd REAL,
      pnl_idr REAL,
      pnl_percent REAL,
      r_multiple REAL,
      psychological_state TEXT,
      lessons_learned TEXT,
      opened_at INTEGER NOT NULL,
      closed_at INTEGER,
      screenshots_meta TEXT
    );

    CREATE TABLE IF NOT EXISTS portfolio_holdings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'user-ilhamgb11',
      symbol TEXT NOT NULL,
      amount REAL NOT NULL,
      average_buy_price REAL,
      target_percent REAL,
      exchange TEXT NOT NULL,
      is_manual INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cashflow_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'user-ilhamgb11',
      type TEXT NOT NULL,
      amount_usd REAL NOT NULL,
      amount_idr REAL NOT NULL,
      source_or_destination TEXT,
      exchange TEXT,
      transaction_date INTEGER NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_whitelist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      role TEXT DEFAULT 'USER',
      notes TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `;

  // Execute schema creation in multiple statements
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    await sqliteClient.execute(statement);
  }

  // Ensure avatar_url column exists in users table (safe migration)
  try {
    await sqliteClient.execute('ALTER TABLE users ADD COLUMN avatar_url TEXT;');
  } catch {}

  // Ensure primary Owner is seeded in whitelist
  const now = Date.now();
  await sqliteClient.execute({
    sql: `INSERT OR IGNORE INTO user_whitelist (email, role, notes, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [env.OWNER_EMAIL.toLowerCase().trim(), 'OWNER', 'Primary System Owner', 'ACTIVE', now, now],
  }).catch(() => {});
}
