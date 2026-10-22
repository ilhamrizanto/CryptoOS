import { sqliteClient } from '../../db/index.js';
import { NotFoundError } from '../../utils/errors.js';

export interface TradeIdeaDto {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  timeframe: string;
  status?: 'WATCHLIST' | 'READY' | 'ACTIVE' | 'CLOSED' | 'INVALIDATED';
  macroData?: Record<string, unknown>;
  fundamentalData?: Record<string, unknown>;
  priceActionData?: Record<string, unknown>;
  evidenceData?: Record<string, unknown>;
  entryPrice?: number;
  stopLossPrice?: number;
  tp1Price?: number;
  tp2Price?: number;
  tp3Price?: number;
  riskPercent?: number;
  notes?: string;
}

export class IdeasService {
  /**
   * List all trade ideas for a specific user
   */
  public async listIdeas(userId: string, status?: string) {
    let sql = 'SELECT * FROM trade_ideas WHERE user_id = ?';
    const args: (string | number | null)[] = [userId];

    if (status) {
      sql += ' AND status = ?';
      args.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await sqliteClient.execute({ sql, args });
    return result.rows.map(this.mapRowToIdea);
  }

  /**
   * Get trade idea by ID for a specific user
   */
  public async getIdeaById(userId: string, id: string) {
    const result = await sqliteClient.execute({
      sql: 'SELECT * FROM trade_ideas WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    if (result.rows.length === 0) {
      throw new NotFoundError(`Trade idea with ID '${id}' not found`);
    }

    return this.mapRowToIdea(result.rows[0]);
  }

  /**
   * Create a new trade idea for a specific user
   */
  public async createIdea(userId: string, dto: TradeIdeaDto) {
    const id = `idea_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    await sqliteClient.execute({
      sql: `INSERT INTO trade_ideas (
        id, user_id, created_at, updated_at, symbol, direction, timeframe, status,
        macro_data, fundamental_data, price_action_data, evidence_data,
        entry_price, stop_loss_price, tp1_price, tp2_price, tp3_price,
        risk_percent, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        userId,
        now,
        now,
        dto.symbol.toUpperCase(),
        dto.direction,
        dto.timeframe || '4H',
        dto.status || 'WATCHLIST',
        dto.macroData ? JSON.stringify(dto.macroData) : null,
        dto.fundamentalData ? JSON.stringify(dto.fundamentalData) : null,
        dto.priceActionData ? JSON.stringify(dto.priceActionData) : null,
        dto.evidenceData ? JSON.stringify(dto.evidenceData) : null,
        dto.entryPrice ?? null,
        dto.stopLossPrice ?? null,
        dto.tp1Price ?? null,
        dto.tp2Price ?? null,
        dto.tp3Price ?? null,
        dto.riskPercent ?? 2.0,
        dto.notes ?? null,
      ],
    });

    return this.getIdeaById(userId, id);
  }

  /**
   * Update a trade idea for a specific user
   */
  public async updateIdea(userId: string, id: string, dto: Partial<TradeIdeaDto>) {
    await this.getIdeaById(userId, id);
    const now = Date.now();

    const fields: string[] = ['updated_at = ?'];
    const args: (string | number | null)[] = [now];

    if (dto.symbol !== undefined) {
      fields.push('symbol = ?');
      args.push(dto.symbol.toUpperCase());
    }
    if (dto.direction !== undefined) {
      fields.push('direction = ?');
      args.push(dto.direction);
    }
    if (dto.timeframe !== undefined) {
      fields.push('timeframe = ?');
      args.push(dto.timeframe);
    }
    if (dto.status !== undefined) {
      fields.push('status = ?');
      args.push(dto.status);
    }
    if (dto.macroData !== undefined) {
      fields.push('macro_data = ?');
      args.push(JSON.stringify(dto.macroData));
    }
    if (dto.fundamentalData !== undefined) {
      fields.push('fundamental_data = ?');
      args.push(JSON.stringify(dto.fundamentalData));
    }
    if (dto.priceActionData !== undefined) {
      fields.push('price_action_data = ?');
      args.push(JSON.stringify(dto.priceActionData));
    }
    if (dto.evidenceData !== undefined) {
      fields.push('evidence_data = ?');
      args.push(JSON.stringify(dto.evidenceData));
    }
    if (dto.entryPrice !== undefined) {
      fields.push('entry_price = ?');
      args.push(dto.entryPrice);
    }
    if (dto.stopLossPrice !== undefined) {
      fields.push('stop_loss_price = ?');
      args.push(dto.stopLossPrice);
    }
    if (dto.tp1Price !== undefined) {
      fields.push('tp1_price = ?');
      args.push(dto.tp1Price);
    }
    if (dto.tp2Price !== undefined) {
      fields.push('tp2_price = ?');
      args.push(dto.tp2Price);
    }
    if (dto.tp3Price !== undefined) {
      fields.push('tp3_price = ?');
      args.push(dto.tp3Price);
    }
    if (dto.riskPercent !== undefined) {
      fields.push('risk_percent = ?');
      args.push(dto.riskPercent);
    }
    if (dto.notes !== undefined) {
      fields.push('notes = ?');
      args.push(dto.notes);
    }

    args.push(id);
    args.push(userId);

    await sqliteClient.execute({
      sql: `UPDATE trade_ideas SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      args,
    });

    return this.getIdeaById(userId, id);
  }

  /**
   * Delete trade idea for a specific user
   */
  public async deleteIdea(userId: string, id: string) {
    await this.getIdeaById(userId, id);
    await sqliteClient.execute({
      sql: 'DELETE FROM trade_ideas WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });
    return { id, deleted: true };
  }

  /**
   * Transfer trade idea directly into an active position in Journal for this user!
   */
  public async transferToJournal(userId: string, id: string, positionSize?: number) {
    const idea = await this.getIdeaById(userId, id);
    const now = Date.now();
    const journalId = `jnl_${now}_${Math.random().toString(36).substring(2, 7)}`;

    const entryPrice = idea.entryPrice || 0;
    const stopLossPrice = idea.stopLossPrice || 0;
    const takeProfitPrice = idea.tp1Price || 0;
    const posSize = positionSize || (entryPrice > 0 ? 1000 / entryPrice : 1);

    // 1. Create Journal Entry
    await sqliteClient.execute({
      sql: `INSERT INTO journal_entries (
        id, user_id, idea_id, symbol, direction, entry_price, position_size,
        stop_loss_price, take_profit_price, status, opened_at,
        psychological_state, screenshots_meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?)`,
      args: [
        journalId,
        userId,
        idea.id,
        idea.symbol,
        idea.direction,
        entryPrice,
        posSize,
        stopLossPrice,
        takeProfitPrice,
        now,
        idea.notes || 'Executed from 4-Pillar Pipeline Incubator',
        idea.evidenceData ? JSON.stringify(idea.evidenceData) : null,
      ],
    });

    // 2. Mark Idea as ACTIVE
    await this.updateIdea(userId, id, { status: 'ACTIVE' });

    return {
      journalId,
      ideaId: id,
      symbol: idea.symbol,
      status: 'OPEN',
      openedAt: now,
    };
  }

  private mapRowToIdea(row: Record<string, unknown>) {
    return {
      id: row.id as string,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      symbol: row.symbol as string,
      direction: row.direction as 'LONG' | 'SHORT',
      timeframe: row.timeframe as string,
      status: row.status as string,
      macroData: row.macro_data ? JSON.parse(row.macro_data as string) : null,
      fundamentalData: row.fundamental_data ? JSON.parse(row.fundamental_data as string) : null,
      priceActionData: row.price_action_data ? JSON.parse(row.price_action_data as string) : null,
      evidenceData: row.evidence_data ? JSON.parse(row.evidence_data as string) : null,
      entryPrice: row.entry_price as number | null,
      stopLossPrice: row.stop_loss_price as number | null,
      tp1Price: row.tp1_price as number | null,
      tp2Price: row.tp2_price as number | null,
      tp3Price: row.tp3_price as number | null,
      riskPercent: row.risk_percent as number | null,
      notes: row.notes as string | null,
    };
  }
}

export const ideasService = new IdeasService();
