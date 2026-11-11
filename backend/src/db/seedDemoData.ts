import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sqliteClient } from './index.js';
import { initializeDatabase } from './init.js';

export interface SeedStats {
  usersSeeded: number;
  whitelistSeeded: number;
  ideasSeeded: number;
  tradesSeeded: number;
  holdingsSeeded: number;
  cashflowSeeded: number;
  settingsSeeded: number;
}

export const DEMO_USERS = [
  {
    userId: 'user-demo-admin',
    username: 'Demo Portfolio Lead',
    email: 'demo-admin@cryptoos.trade',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80',
    notes: 'Institutional Risk Officer & Admin (Full Access)',
  },
  {
    userId: 'user-demo-operator',
    username: 'Demo Quant Trader',
    email: 'demo-trader@cryptoos.trade',
    role: 'USER',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=80',
    notes: 'Senior Quantitative Execution Operator',
  },
  {
    userId: 'user-demo-viewer',
    username: 'Demo Client Auditor',
    email: 'demo-viewer@cryptoos.trade',
    role: 'VIEWER',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&h=160&q=80',
    notes: 'External LP / Client Auditor (Read-Only)',
  },
];

// Target user IDs that receive the demo datasets
export const DEMO_TARGET_USERS = [
  'user-demo-admin',
  'user-demo-operator',
  'user-demo-viewer',
  'user-ilhamgb11',
];

export async function seedDemoData(options?: {
  reset?: boolean;
  targetUserIds?: string[];
}): Promise<{ success: boolean; stats: SeedStats }> {
  const isReset = options?.reset ?? false;
  const targetUsers = options?.targetUserIds ?? DEMO_TARGET_USERS;

  console.log(`[SEED] Initializing demo data seeding (reset=${isReset})...`);
  await initializeDatabase();

  const stats: SeedStats = {
    usersSeeded: 0,
    whitelistSeeded: 0,
    ideasSeeded: 0,
    tradesSeeded: 0,
    holdingsSeeded: 0,
    cashflowSeeded: 0,
    settingsSeeded: 0,
  };

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1. Reset old demo records if requested
  if (isReset) {
    console.log('[RESET] Cleaning existing demo records across tables...');
    for (const uid of targetUsers) {
      await sqliteClient.execute({ sql: 'DELETE FROM trade_ideas WHERE user_id = ?', args: [uid] });
      await sqliteClient.execute({ sql: 'DELETE FROM journal_entries WHERE user_id = ?', args: [uid] });
      await sqliteClient.execute({ sql: 'DELETE FROM portfolio_holdings WHERE user_id = ?', args: [uid] });
      await sqliteClient.execute({ sql: 'DELETE FROM cashflow_ledger WHERE user_id = ?', args: [uid] });
    }
  }

  // 2. Seed / ensure Demo Users in 'users' & 'user_whitelist'
  const demoPasswordHash = await bcrypt.hash('cryptoos-demo-2026', 10);
  for (const du of DEMO_USERS) {
    await sqliteClient.execute({
      sql: `INSERT INTO users (username, password, email, role, avatar_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET
              role = excluded.role,
              avatar_url = excluded.avatar_url,
              email = excluded.email`,
      args: [du.username, demoPasswordHash, du.email, du.role, du.avatarUrl, now],
    });
    stats.usersSeeded++;

    await sqliteClient.execute({
      sql: `INSERT INTO user_whitelist (email, role, notes, status, created_at, updated_at)
            VALUES (?, ?, ?, 'ACTIVE', ?, ?)
            ON CONFLICT(email) DO UPDATE SET
              role = excluded.role,
              notes = excluded.notes,
              status = 'ACTIVE',
              updated_at = excluded.updated_at`,
      args: [du.email, du.role, du.notes, now, now],
    });
    stats.whitelistSeeded++;
  }

  // 3. Realistic Demo Data Template
  const sampleTradeIdeas = [
    {
      symbol: 'BTC',
      direction: 'LONG',
      timeframe: '4H',
      status: 'ACTIVE',
      entryPrice: 62450.0,
      stopLossPrice: 60800.0,
      tp1Price: 65200.0,
      tp2Price: 68000.0,
      tp3Price: 72000.0,
      riskPercent: 1.5,
      notes: 'Bullish reclaim of 4H daily value area low. CME FedWatch pricing 85% rate hold; DXY showing weekly bearish breakdown.',
      macroData: JSON.stringify({
        fedBias: 'Hawkish Hold / Neutral Easing',
        dxyTrend: 'Bearish Continuation',
        fngScore: 54,
        macroRating: 'BULLISH_CONFLUENCE',
      }),
      fundamentalData: JSON.stringify({
        etfInflows: '+420M Weekly Net',
        hashrate: 'All-Time High 680 EH/s',
        narrative: 'Post-Halving Supply Compression',
      }),
      priceActionData: JSON.stringify({
        smcBias: 'Bullish Order Block & FVG Tap',
        volumeProfile: 'High Volume Node Reclaim',
        vwapConfluence: 'Above Weekly VWAP',
      }),
      evidenceData: JSON.stringify({
        checklistPassed: 4,
        totalChecks: 4,
        calculatedRR: '1:3.48',
      }),
    },
    {
      symbol: 'ETH',
      direction: 'SHORT',
      timeframe: '1D',
      status: 'WATCHLIST',
      entryPrice: 2680.0,
      stopLossPrice: 2810.0,
      tp1Price: 2450.0,
      tp2Price: 2320.0,
      tp3Price: 2180.0,
      riskPercent: 1.0,
      notes: 'Bearish divergence on daily RSI at key macro resistance. Gas fees depressed, institutional rotation favoring BTC dominance.',
      macroData: JSON.stringify({
        fedBias: 'Macro Inflation Sticky',
        dxyTrend: 'Consolidation',
        fngScore: 48,
        macroRating: 'NEUTRAL_DEFENSIVE',
      }),
      fundamentalData: JSON.stringify({
        burnRate: 'Net Inflationary (+0.4% YoY)',
        layer2Drain: 'Base & Arbitrum cannibalizing mainnet fees',
      }),
      priceActionData: JSON.stringify({
        smcBias: 'Liquidity Grab at Range High ($2,720)',
        volumeProfile: 'Declining Volume on Push',
      }),
      evidenceData: JSON.stringify({
        checklistPassed: 3,
        totalChecks: 4,
        calculatedRR: '1:2.77',
      }),
    },
    {
      symbol: 'SOL',
      direction: 'LONG',
      timeframe: '4H',
      status: 'READY',
      entryPrice: 152.0,
      stopLossPrice: 144.5,
      tp1Price: 168.0,
      tp2Price: 182.0,
      tp3Price: 198.0,
      riskPercent: 1.5,
      notes: 'DEX daily volume flipped Ethereum mainnet. Clean bull flag breakout on 4H chart with aggressive spot CVD absorption.',
      macroData: JSON.stringify({
        fedBias: 'Risk-On Liquidity Expansion',
        altseasonIndex: 58,
      }),
      fundamentalData: JSON.stringify({
        dexVolume: '$3.4B / 24h',
        activeWallets: '2.1M daily active users',
      }),
      priceActionData: JSON.stringify({
        smcBias: 'Clean Sweep of Equal Lows ($144.8)',
        pattern: 'Ascending Triangle Compression',
      }),
      evidenceData: JSON.stringify({
        checklistPassed: 4,
        totalChecks: 4,
        calculatedRR: '1:3.20',
      }),
    },
    {
      symbol: 'LINK',
      direction: 'LONG',
      timeframe: '1D',
      status: 'CLOSED',
      entryPrice: 11.2,
      stopLossPrice: 10.4,
      tp1Price: 12.8,
      tp2Price: 14.5,
      tp3Price: 16.0,
      riskPercent: 1.0,
      notes: 'CCIP enterprise oracle partnerships expanding across Swift & tokenized real-world assets (RWA).',
      macroData: JSON.stringify({ fngScore: 52 }),
      fundamentalData: JSON.stringify({ catalyst: 'RWA Liquidity Hub' }),
      priceActionData: JSON.stringify({ bias: 'Accumulation Range Breakout' }),
      evidenceData: JSON.stringify({ calculatedRR: '1:3.50' }),
    },
    {
      symbol: 'SUI',
      direction: 'LONG',
      timeframe: '1H',
      status: 'READY',
      entryPrice: 1.82,
      stopLossPrice: 1.69,
      tp1Price: 2.15,
      tp2Price: 2.45,
      tp3Price: 2.80,
      riskPercent: 1.2,
      notes: 'High-throughput Move ecosystem TVL breakout above $1B. Aggressive taker buy flow detected on Bybit & Binance perps.',
      macroData: JSON.stringify({ fngScore: 60 }),
      fundamentalData: JSON.stringify({ tvlTrend: '+28% 7D Inflow' }),
      priceActionData: JSON.stringify({ pattern: '1H Fair Value Gap Retest' }),
      evidenceData: JSON.stringify({ calculatedRR: '1:3.31' }),
    },
  ];

  const sampleJournalEntries = [
    {
      symbol: 'BTC',
      direction: 'LONG',
      entryPrice: 58400.0,
      exitPrice: 63800.0,
      positionSize: 0.45,
      stopLossPrice: 56900.0,
      takeProfitPrice: 64000.0,
      status: 'CLOSED',
      pnlUsd: 2430.0,
      pnlIdr: 43618500.0,
      pnlPercent: 9.25,
      rMultiple: 3.6,
      psychologicalState: 'Calm, patient entry. Followed institutional 4-pillars checklist without FOMO.',
      lessonsLearned: 'Locked 50% profit at TP1; trailing stop preserved capital during sudden CPI spike.',
      openedAt: now - 14 * dayMs,
      closedAt: now - 9 * dayMs,
    },
    {
      symbol: 'SOL',
      direction: 'LONG',
      entryPrice: 128.5,
      exitPrice: 154.2,
      positionSize: 85.0,
      stopLossPrice: 121.0,
      takeProfitPrice: 155.0,
      status: 'CLOSED',
      pnlUsd: 2184.5,
      pnlIdr: 39211775.0,
      pnlPercent: 20.0,
      rMultiple: 3.42,
      psychologicalState: 'High conviction trade. Did not move stop loss wider despite intraday shakeouts.',
      lessonsLearned: 'Spot CVD confirmation provided clear sign of institutional absorption.',
      openedAt: now - 11 * dayMs,
      closedAt: now - 6 * dayMs,
    },
    {
      symbol: 'ETH',
      direction: 'SHORT',
      entryPrice: 2710.0,
      exitPrice: 2785.0,
      positionSize: 8.0,
      stopLossPrice: 2785.0,
      takeProfitPrice: 2480.0,
      status: 'CLOSED',
      pnlUsd: -600.0,
      pnlIdr: -10770000.0,
      pnlPercent: -2.77,
      rMultiple: -1.0,
      psychologicalState: 'Disciplined stop loss hit. Felt slight frustration but respected pre-defined risk limit.',
      lessonsLearned: 'ETH had sudden ETF inflow news headline. Hard stop loss prevented catastrophic drawdown.',
      openedAt: now - 8 * dayMs,
      closedAt: now - 7 * dayMs,
    },
    {
      symbol: 'LINK',
      direction: 'LONG',
      entryPrice: 10.8,
      exitPrice: 13.4,
      positionSize: 750.0,
      stopLossPrice: 9.9,
      takeProfitPrice: 13.5,
      status: 'CLOSED',
      pnlUsd: 1950.0,
      pnlIdr: 35002500.0,
      pnlPercent: 24.07,
      rMultiple: 2.89,
      psychologicalState: 'Relaxed swing trade setup over multiple days.',
      lessonsLearned: 'Patient swing entries on higher timeframe (1D) consistently deliver better R:R than scalping.',
      openedAt: now - 18 * dayMs,
      closedAt: now - 10 * dayMs,
    },
    {
      symbol: 'NEAR',
      direction: 'LONG',
      entryPrice: 4.15,
      exitPrice: 5.35,
      positionSize: 1200.0,
      stopLossPrice: 3.8,
      takeProfitPrice: 5.4,
      status: 'CLOSED',
      pnlUsd: 1440.0,
      pnlIdr: 25848000.0,
      pnlPercent: 28.9,
      rMultiple: 3.43,
      psychologicalState: 'Executed exactly according to AI narrative rotation checklist.',
      lessonsLearned: 'Took full target at resistance line as planned.',
      openedAt: now - 15 * dayMs,
      closedAt: now - 9 * dayMs,
    },
    {
      symbol: 'ARB',
      direction: 'LONG',
      entryPrice: 0.58,
      exitPrice: 0.54,
      positionSize: 8000.0,
      stopLossPrice: 0.54,
      takeProfitPrice: 0.72,
      status: 'CLOSED',
      pnlUsd: -320.0,
      pnlIdr: -5744000.0,
      pnlPercent: -6.9,
      rMultiple: -1.0,
      psychologicalState: 'Clean loss. Did not revenge trade; turned off terminal for the session.',
      lessonsLearned: 'Token unlock schedule pressured spot order book. Always cross-check tokenomics schedule.',
      openedAt: now - 6 * dayMs,
      closedAt: now - 5 * dayMs,
    },
    {
      symbol: 'SUI',
      direction: 'LONG',
      entryPrice: 1.42,
      exitPrice: 1.95,
      positionSize: 3000.0,
      stopLossPrice: 1.28,
      takeProfitPrice: 1.98,
      status: 'CLOSED',
      pnlUsd: 1590.0,
      pnlIdr: 28540500.0,
      pnlPercent: 37.3,
      rMultiple: 3.78,
      psychologicalState: 'Confident execution based on on-chain TVL surge.',
      lessonsLearned: 'Early identification of ecosystem momentum provides highest asymmetrical returns.',
      openedAt: now - 5 * dayMs,
      closedAt: now - 2 * dayMs,
    },
    {
      symbol: 'BTC',
      direction: 'LONG',
      entryPrice: 62450.0,
      exitPrice: null,
      positionSize: 0.35,
      stopLossPrice: 60800.0,
      takeProfitPrice: 68000.0,
      status: 'OPEN',
      pnlUsd: 682.5,
      pnlIdr: 12250875.0,
      pnlPercent: 3.12,
      rMultiple: 1.18,
      psychologicalState: 'Active position. Risk mitigated by trailing stop loss to break-even.',
      lessonsLearned: 'Monitoring funding rates across major perpetual swaps.',
      openedAt: now - 2 * dayMs,
      closedAt: null,
    },
    {
      symbol: 'SOL',
      direction: 'LONG',
      entryPrice: 152.0,
      exitPrice: null,
      positionSize: 60.0,
      stopLossPrice: 144.5,
      takeProfitPrice: 182.0,
      status: 'OPEN',
      pnlUsd: 390.0,
      pnlIdr: 7000500.0,
      pnlPercent: 4.28,
      rMultiple: 0.87,
      psychologicalState: 'Active runner with 1/3 position left.',
      lessonsLearned: 'Protect profits aggressively once trade moves into 2R territory.',
      openedAt: now - 1 * dayMs,
      closedAt: null,
    },
  ];

  const sampleHoldings = [
    { symbol: 'BTC', amount: 0.85, averageBuyPrice: 61200.0, targetPercent: 35.0, exchange: 'BINANCE' },
    { symbol: 'ETH', amount: 8.40, averageBuyPrice: 2420.0, targetPercent: 25.0, exchange: 'BYBIT' },
    { symbol: 'SOL', amount: 95.0, averageBuyPrice: 138.5, targetPercent: 15.0, exchange: 'OKX' },
    { symbol: 'LINK', amount: 450.0, averageBuyPrice: 11.20, targetPercent: 8.0, exchange: 'BINANCE' },
    { symbol: 'SUI', amount: 3200.0, averageBuyPrice: 1.65, targetPercent: 7.0, exchange: 'BYBIT' },
    { symbol: 'USDT', amount: 15250.0, averageBuyPrice: 1.0, targetPercent: 5.0, exchange: 'BINANCE' },
    { symbol: 'USDC', amount: 10000.0, averageBuyPrice: 1.0, targetPercent: 5.0, exchange: 'WALLET' },
  ];

  const sampleCashflows = [
    {
      type: 'DEPOSIT',
      amountUsd: 50000.0,
      amountIdr: 897500000.0,
      sourceOrDestination: 'BCA Private Treasury Account',
      exchange: 'BINANCE',
      transactionDate: now - 30 * dayMs,
      notes: 'Initial institutional capital funding allocation for Quantitative Vault Alpha',
    },
    {
      type: 'STAKING_YIELD',
      amountUsd: 485.0,
      amountIdr: 8705750.0,
      sourceOrDestination: 'Lido Staked ETH (stETH)',
      exchange: 'WALLET',
      transactionDate: now - 20 * dayMs,
      notes: 'Monthly PoS validator rewards distributed to cold storage vault',
    },
    {
      type: 'AIRDROP',
      amountUsd: 1250.0,
      amountIdr: 22437500.0,
      sourceOrDestination: 'Arbitrum Foundation DAO Claim',
      exchange: 'WALLET',
      transactionDate: now - 12 * dayMs,
      notes: 'Protocol governance participation incentive converted to treasury reserve',
    },
    {
      type: 'WITHDRAWAL',
      amountUsd: 5000.0,
      amountIdr: 89750000.0,
      sourceOrDestination: 'Founders Corporate Dividend Account',
      exchange: 'BINANCE',
      transactionDate: now - 4 * dayMs,
      notes: 'Bi-weekly portfolio performance profit harvesting to fiat reserves',
    },
  ];

  // 4. Insert data for all targeted user IDs
  for (const uid of targetUsers) {
    // 4a. Trade Ideas
    for (const idea of sampleTradeIdeas) {
      const ideaId = 'idea-' + crypto.randomUUID().slice(0, 8);
      await sqliteClient.execute({
        sql: `INSERT INTO trade_ideas (
          id, user_id, created_at, updated_at, symbol, direction, timeframe,
          status, confidence_score, playstyle, strategy, confluences,
          macro_data, fundamental_data, price_action_data, evidence_data,
          entry_price, stop_loss_price, tp1_price, tp2_price, tp3_price,
          risk_percent, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          ideaId,
          uid,
          now - Math.floor(Math.random() * 5 * dayMs),
          now,
          idea.symbol,
          idea.direction,
          idea.timeframe,
          idea.status,
          (idea as any).confidenceScore ?? 8.5,
          (idea as any).playstyle || 'SWING',
          (idea as any).strategy || 'PRICE_ACTION',
          JSON.stringify(['Key Support/Resistance', 'Volume Breakout', 'Liquidity Sweep']),
          idea.macroData,
          idea.fundamentalData,
          idea.priceActionData,
          idea.evidenceData,
          idea.entryPrice,
          idea.stopLossPrice,
          idea.tp1Price,
          idea.tp2Price,
          idea.tp3Price,
          idea.riskPercent,
          idea.notes,
        ],
      });
      stats.ideasSeeded++;
    }

    // 4b. Journal Entries
    for (const j of sampleJournalEntries) {
      const entryId = 'trade-' + crypto.randomUUID().slice(0, 8);
      await sqliteClient.execute({
        sql: `INSERT INTO journal_entries (
          id, user_id, symbol, direction, entry_price, exit_price, position_size,
          stop_loss_price, take_profit_price, status, confidence_score, playstyle, strategy,
          pnl_usd, pnl_idr, pnl_percent, r_multiple, psychological_state, lessons_learned,
          opened_at, closed_at, screenshots_meta
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          entryId,
          uid,
          j.symbol,
          j.direction,
          j.entryPrice,
          j.exitPrice,
          j.positionSize,
          j.stopLossPrice,
          j.takeProfitPrice,
          j.status,
          (j as any).confidenceScore ?? (j.pnlUsd && j.pnlUsd > 0 ? 9 : 6),
          (j as any).playstyle || 'SWING',
          (j as any).strategy || 'PRICE_ACTION',
          j.pnlUsd,
          j.pnlIdr,
          j.pnlPercent,
          j.rMultiple,
          j.psychologicalState,
          j.lessonsLearned,
          j.openedAt,
          j.closedAt,
          JSON.stringify({ verifiedExecution: true, exchangeRef: 'INSTITUTIONAL_TERMINAL' }),
        ],
      });
      stats.tradesSeeded++;
    }

    // 4c. Portfolio Holdings
    for (const h of sampleHoldings) {
      const holdingId = 'hold-' + crypto.randomUUID().slice(0, 8);
      await sqliteClient.execute({
        sql: `INSERT INTO portfolio_holdings (
          id, user_id, symbol, amount, average_buy_price, target_percent,
          exchange, is_manual, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        args: [holdingId, uid, h.symbol, h.amount, h.averageBuyPrice, h.targetPercent, h.exchange, now],
      });
      stats.holdingsSeeded++;
    }

    // 4d. Cashflow Ledger
    for (const c of sampleCashflows) {
      const cfId = 'cf-' + crypto.randomUUID().slice(0, 8);
      await sqliteClient.execute({
        sql: `INSERT INTO cashflow_ledger (
          id, user_id, type, amount_usd, amount_idr, source_or_destination,
          exchange, transaction_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [cfId, uid, c.type, c.amountUsd, c.amountIdr, c.sourceOrDestination, c.exchange, c.transactionDate, c.notes],
      });
      stats.cashflowSeeded++;
    }
  }

  // 5. System Settings Defaults
  const defaultSettings = [
    { key: 'rate_usd_idr', value: '17950' },
    { key: 'max_risk_percent', value: '1.5' },
    { key: 'circuit_breaker_dd', value: '5.0' },
    { key: 'kelly_multiplier', value: '0.5' },
    { key: 'active_exchanges', value: JSON.stringify(['BINANCE', 'BYBIT', 'OKX']) },
  ];

  for (const s of defaultSettings) {
    await sqliteClient.execute({
      sql: `INSERT INTO system_settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [s.key, s.value, now],
    });
    stats.settingsSeeded++;
  }

  console.log('[OK] Demo data seeding completed successfully!');
  console.log(
    `[INFO] Users: ${stats.usersSeeded}, Whitelist: ${stats.whitelistSeeded}, Ideas: ${stats.ideasSeeded}, Trades: ${stats.tradesSeeded}, Holdings: ${stats.holdingsSeeded}, Cashflows: ${stats.cashflowSeeded}`
  );

  return { success: true, stats };
}

// Standalone CLI Execution Support
const isDirectRun = process.argv[1]?.includes('seedDemoData') || process.argv.includes('--run-seed');
if (isDirectRun) {
  const shouldReset = process.argv.includes('--reset');
  seedDemoData({ reset: shouldReset })
    .then(() => {
      console.log('[DONE] Seed command finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[ERROR] Failed to seed demo data:', err);
      process.exit(1);
    });
}

