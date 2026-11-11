import { sqliteClient } from '../../db/index.js';
import { NotFoundError } from '../../utils/errors.js';

export interface CreateJournalDto {
  ideaId?: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  positionSize: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  confidenceScore?: number;
  playstyle?: string;
  strategy?: string;
  psychologicalState?: string;
  screenshotsMeta?: string[];
  openedAt?: number;
}

export interface CloseJournalDto {
  exitPrice: number;
  closedAt?: number;
  lessonsLearned?: string;
  usdToIdrRate?: number;
}

export class JournalService {
  /**
   * List journal entries for specific user with optional status filter
   */
  public async listEntries(userId: string, status?: string) {
    let sql = 'SELECT * FROM journal_entries WHERE user_id = ?';
    const args: (string | number | null)[] = [userId];

    if (status) {
      sql += ' AND status = ?';
      args.push(status);
    }

    sql += ' ORDER BY opened_at DESC';

    const result = await sqliteClient.execute({ sql, args });
    return result.rows.map(this.mapRowToEntry);
  }

  /**
   * Get single journal entry by ID for specific user
   */
  public async getEntryById(userId: string, id: string) {
    const result = await sqliteClient.execute({
      sql: 'SELECT * FROM journal_entries WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    if (result.rows.length === 0) {
      throw new NotFoundError(`Journal entry with ID '${id}' not found`);
    }

    return this.mapRowToEntry(result.rows[0]);
  }

  /**
   * Create a new journal entry for specific user
   */
  public async createEntry(userId: string, dto: CreateJournalDto) {
    const id = `jnl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = dto.openedAt || Date.now();

    await sqliteClient.execute({
      sql: `INSERT INTO journal_entries (
        id, user_id, idea_id, symbol, direction, entry_price, position_size,
        stop_loss_price, take_profit_price, status, opened_at,
        confidence_score, playstyle, strategy,
        psychological_state, screenshots_meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        userId,
        dto.ideaId ?? null,
        dto.symbol.toUpperCase(),
        dto.direction,
        dto.entryPrice,
        dto.positionSize,
        dto.stopLossPrice,
        dto.takeProfitPrice ?? null,
        now,
        dto.confidenceScore ?? 8,
        dto.playstyle || 'SWING',
        dto.strategy || 'PRICE_ACTION',
        dto.psychologicalState ?? null,
        dto.screenshotsMeta ? JSON.stringify(dto.screenshotsMeta) : null,
      ],
    });

    return this.getEntryById(userId, id);
  }

  /**
   * Close trade entry for specific user
   */
  public async closeEntry(userId: string, id: string, dto: CloseJournalDto) {
    const entry = await this.getEntryById(userId, id);
    const closedAt = dto.closedAt || Date.now();
    const exitPrice = dto.exitPrice;

    // 1. Calculate PnL in USD
    let pnlUsd = 0;
    if (entry.direction === 'LONG') {
      pnlUsd = (exitPrice - entry.entryPrice) * entry.positionSize;
    } else {
      pnlUsd = (entry.entryPrice - exitPrice) * entry.positionSize;
    }

    // 2. Calculate PnL % based on notional entry value
    const notionalValue = entry.entryPrice * entry.positionSize;
    const pnlPercent = notionalValue > 0 ? (pnlUsd / notionalValue) * 100 : 0;

    // 3. Calculate R-Multiple
    const slDistance = Math.abs(entry.entryPrice - entry.stopLossPrice) * entry.positionSize;
    const rMultiple = slDistance > 0 ? parseFloat((pnlUsd / slDistance).toFixed(2)) : 0;

    // 4. Calculate PnL in IDR
    const rate = dto.usdToIdrRate || 16300;
    const pnlIdr = Math.round(pnlUsd * rate);

    await sqliteClient.execute({
      sql: `UPDATE journal_entries SET
        status = 'CLOSED',
        exit_price = ?,
        closed_at = ?,
        pnl_usd = ?,
        pnl_idr = ?,
        pnl_percent = ?,
        r_multiple = ?,
        lessons_learned = ?
      WHERE id = ? AND user_id = ?`,
      args: [
        exitPrice,
        closedAt,
        parseFloat(pnlUsd.toFixed(2)),
        pnlIdr,
        parseFloat(pnlPercent.toFixed(2)),
        rMultiple,
        dto.lessonsLearned ?? entry.lessonsLearned ?? null,
        id,
        userId,
      ],
    });

    // If linked to an idea, mark idea as CLOSED for this user
    if (entry.ideaId) {
      await sqliteClient.execute({
        sql: 'UPDATE trade_ideas SET status = ? WHERE id = ? AND user_id = ?',
        args: ['CLOSED', entry.ideaId, userId],
      }).catch(() => {});
    }

    return this.getEntryById(userId, id);
  }

  /**
   * Update psychological state or reflection on an existing entry
   */
  public async updateEntry(userId: string, id: string, dto: Partial<CreateJournalDto & { lessonsLearned?: string }>) {
    await this.getEntryById(userId, id);

    const fields: string[] = [];
    const args: (string | number | null)[] = [];

    if (dto.psychologicalState !== undefined) {
      fields.push('psychological_state = ?');
      args.push(dto.psychologicalState);
    }
    if (dto.lessonsLearned !== undefined) {
      fields.push('lessons_learned = ?');
      args.push(dto.lessonsLearned);
    }
    if (dto.takeProfitPrice !== undefined) {
      fields.push('take_profit_price = ?');
      args.push(dto.takeProfitPrice);
    }
    if (dto.stopLossPrice !== undefined) {
      fields.push('stop_loss_price = ?');
      args.push(dto.stopLossPrice);
    }
    if (dto.confidenceScore !== undefined) {
      fields.push('confidence_score = ?');
      args.push(dto.confidenceScore);
    }
    if (dto.playstyle !== undefined) {
      fields.push('playstyle = ?');
      args.push(dto.playstyle);
    }
    if (dto.strategy !== undefined) {
      fields.push('strategy = ?');
      args.push(dto.strategy);
    }

    if (fields.length > 0) {
      args.push(id);
      args.push(userId);
      await sqliteClient.execute({
        sql: `UPDATE journal_entries SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
        args,
      });
    }

    return this.getEntryById(userId, id);
  }

  /**
   * Delete journal entry
   */
  public async deleteEntry(userId: string, id: string) {
    await this.getEntryById(userId, id);
    await sqliteClient.execute({
      sql: 'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });
    return { id, deleted: true };
  }

  /**
   * Compute comprehensive trade performance analytics (isolated per user)
   */
  public async getAnalytics(userId: string) {
    const entries = await this.listEntries(userId, 'CLOSED');

    const totalTrades = entries.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        profitFactor: 0,
        totalPnlUsd: 0,
        totalPnlIdr: 0,
        averageRMultiple: 0,
        expectancyUsd: 0,
        bestTradeUsd: 0,
        worstTradeUsd: 0,
        equityCurve: [],
      };
    }

    let winCount = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let totalPnlUsd = 0;
    let totalPnlIdr = 0;
    let totalR = 0;
    let bestTradeUsd = -Infinity;
    let worstTradeUsd = Infinity;

    let runningEquity = 25000;
    const equityCurve: Array<{ time: number; equity: number; tradePnl: number }> = [];

    for (const trade of entries) {
      const pnl = trade.pnlUsd || 0;
      totalPnlUsd += pnl;
      totalPnlIdr += trade.pnlIdr || 0;
      totalR += trade.rMultiple || 0;

      if (pnl > 0) {
        winCount++;
        grossProfit += pnl;
      } else {
        grossLoss += Math.abs(pnl);
      }

      if (pnl > bestTradeUsd) bestTradeUsd = pnl;
      if (pnl < worstTradeUsd) worstTradeUsd = pnl;

      runningEquity += pnl;
      equityCurve.push({
        time: trade.closedAt || trade.openedAt,
        equity: parseFloat(runningEquity.toFixed(2)),
        tradePnl: parseFloat(pnl.toFixed(2)),
      });
    }

    const winRate = parseFloat(((winCount / totalTrades) * 100).toFixed(1));
    const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.0 : 0;
    const averageRMultiple = parseFloat((totalR / totalTrades).toFixed(2));
    const expectancyUsd = parseFloat((totalPnlUsd / totalTrades).toFixed(2));

    // Behavioral Confidence Breakdown: High (8-10), Mid (5-7), Low (1-4)
    let highConfWins = 0, highConfTotal = 0, highConfPnl = 0;
    let midConfWins = 0, midConfTotal = 0, midConfPnl = 0;
    let lowConfWins = 0, lowConfTotal = 0, lowConfPnl = 0;

    for (const trade of entries) {
      const conf = (trade as any).confidenceScore ?? 8;
      const isWin = (trade.pnlUsd || 0) > 0;
      const pnl = trade.pnlUsd || 0;
      if (conf >= 8) {
        highConfTotal++;
        if (isWin) highConfWins++;
        highConfPnl += pnl;
      } else if (conf >= 5) {
        midConfTotal++;
        if (isWin) midConfWins++;
        midConfPnl += pnl;
      } else {
        lowConfTotal++;
        if (isWin) lowConfWins++;
        lowConfPnl += pnl;
      }
    }

    return {
      totalTrades,
      winCount,
      lossCount: totalTrades - winCount,
      winRate,
      profitFactor,
      totalPnlUsd: parseFloat(totalPnlUsd.toFixed(2)),
      totalPnlIdr: Math.round(totalPnlIdr),
      averageRMultiple,
      expectancyUsd,
      bestTradeUsd: bestTradeUsd === -Infinity ? 0 : bestTradeUsd,
      worstTradeUsd: worstTradeUsd === Infinity ? 0 : worstTradeUsd,
      equityCurve: equityCurve.reverse(),
      confidenceBreakdown: {
        high: { total: highConfTotal, wins: highConfWins, winRate: highConfTotal > 0 ? parseFloat(((highConfWins / highConfTotal) * 100).toFixed(1)) : 0, pnlUsd: parseFloat(highConfPnl.toFixed(2)) },
        mid: { total: midConfTotal, wins: midConfWins, winRate: midConfTotal > 0 ? parseFloat(((midConfWins / midConfTotal) * 100).toFixed(1)) : 0, pnlUsd: parseFloat(midConfPnl.toFixed(2)) },
        low: { total: lowConfTotal, wins: lowConfWins, winRate: lowConfTotal > 0 ? parseFloat(((lowConfWins / lowConfTotal) * 100).toFixed(1)) : 0, pnlUsd: parseFloat(lowConfPnl.toFixed(2)) },
      },
    };
  }

  private mapRowToEntry(row: Record<string, unknown>) {
    return {
      id: row.id as string,
      ideaId: row.idea_id as string | null,
      symbol: row.symbol as string,
      direction: row.direction as 'LONG' | 'SHORT',
      entryPrice: row.entry_price as number,
      exitPrice: row.exit_price as number | null,
      positionSize: row.position_size as number,
      stopLossPrice: row.stop_loss_price as number,
      takeProfitPrice: row.take_profit_price as number | null,
      status: row.status as 'OPEN' | 'CLOSED' | 'CANCELLED',
      confidenceScore: (row.confidence_score as number) ?? 8,
      playstyle: (row.playstyle as string) || 'SWING',
      strategy: (row.strategy as string) || 'PRICE_ACTION',
      pnlUsd: row.pnl_usd as number | null,
      pnlIdr: row.pnl_idr as number | null,
      pnlPercent: row.pnl_percent as number | null,
      rMultiple: row.r_multiple as number | null,
      psychologicalState: row.psychological_state as string | null,
      lessonsLearned: row.lessons_learned as string | null,
      openedAt: row.opened_at as number,
      closedAt: row.closed_at as number | null,
      screenshotsMeta: row.screenshots_meta ? JSON.parse(row.screenshots_meta as string) : [],
    };
  }
}

export const journalService = new JournalService();
