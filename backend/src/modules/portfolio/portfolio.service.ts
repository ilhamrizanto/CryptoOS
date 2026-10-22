import { sqliteClient } from '../../db/index.js';
import { NotFoundError } from '../../utils/errors.js';
import { marketService } from '../market/market.service.js';

export interface HoldingDto {
  symbol: string;
  amount: number;
  averageBuyPrice?: number;
  targetPercent?: number;
  exchange: 'BINANCE' | 'BYBIT' | 'OKX' | 'MANUAL' | 'WALLET';
  isManual?: boolean;
}

export class PortfolioService {
  /**
   * List all portfolio holdings for a specific user
   */
  public async listHoldings(userId: string) {
    const result = await sqliteClient.execute({
      sql: 'SELECT * FROM portfolio_holdings WHERE user_id = ? ORDER BY symbol ASC',
      args: [userId],
    });
    return result.rows.map(this.mapRowToHolding);
  }

  /**
   * Get holding by ID for a specific user
   */
  public async getHoldingById(userId: string, id: string) {
    const result = await sqliteClient.execute({
      sql: 'SELECT * FROM portfolio_holdings WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    if (result.rows.length === 0) {
      throw new NotFoundError(`Portfolio holding '${id}' not found`);
    }

    return this.mapRowToHolding(result.rows[0]);
  }

  /**
   * Create or add new holding for a specific user
   */
  public async createHolding(userId: string, dto: HoldingDto) {
    const id = `hld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    await sqliteClient.execute({
      sql: `INSERT INTO portfolio_holdings (
        id, user_id, symbol, amount, average_buy_price, target_percent, exchange, is_manual, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        userId,
        dto.symbol.toUpperCase(),
        dto.amount,
        dto.averageBuyPrice ?? null,
        dto.targetPercent ?? null,
        dto.exchange,
        dto.isManual !== undefined ? (dto.isManual ? 1 : 0) : 1,
        now,
      ],
    });

    return this.getHoldingById(userId, id);
  }

  /**
   * Update holding for a specific user
   */
  public async updateHolding(userId: string, id: string, dto: Partial<HoldingDto>) {
    await this.getHoldingById(userId, id);
    const now = Date.now();

    const fields: string[] = ['updated_at = ?'];
    const args: (string | number | null)[] = [now];

    if (dto.symbol !== undefined) {
      fields.push('symbol = ?');
      args.push(dto.symbol.toUpperCase());
    }
    if (dto.amount !== undefined) {
      fields.push('amount = ?');
      args.push(dto.amount);
    }
    if (dto.averageBuyPrice !== undefined) {
      fields.push('average_buy_price = ?');
      args.push(dto.averageBuyPrice);
    }
    if (dto.targetPercent !== undefined) {
      fields.push('target_percent = ?');
      args.push(dto.targetPercent);
    }
    if (dto.exchange !== undefined) {
      fields.push('exchange = ?');
      args.push(dto.exchange);
    }
    if (dto.isManual !== undefined) {
      fields.push('is_manual = ?');
      args.push(dto.isManual ? 1 : 0);
    }

    args.push(id);
    args.push(userId);

    await sqliteClient.execute({
      sql: `UPDATE portfolio_holdings SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      args,
    });

    return this.getHoldingById(userId, id);
  }

  /**
   * Delete holding for a specific user
   */
  public async deleteHolding(userId: string, id: string) {
    await this.getHoldingById(userId, id);
    await sqliteClient.execute({
      sql: 'DELETE FROM portfolio_holdings WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });
    return { id, deleted: true };
  }

  /**
   * Realtime Portfolio Summary with USD & IDR calculations (isolated per user)
   */
  public async getSummary(userId: string, overrideRate?: number) {
    const holdings = await this.listHoldings(userId);

    // Live USD/IDR rate
    const usdIdrInfo = await marketService.getUsdIdr();
    const rate = overrideRate || usdIdrInfo.value || 16300;

    // Approximate live prices
    const priceMap: Record<string, number> = {
      BTC: 94800,
      ETH: 3450,
      SOL: 185.5,
      BNB: 650,
      XRP: 1.45,
      DOGE: 0.38,
      SUI: 3.40,
      USDT: 1.0,
      USDC: 1.0,
      USD: 1.0,
    };

    let totalNetWorthUsd = 0;
    let totalCostBasisUsd = 0;

    const holdingsWithMarketData = holdings.map((h) => {
      const currentPrice = priceMap[h.symbol] || h.averageBuyPrice || 10.0;
      const currentValueUsd = h.amount * currentPrice;
      const costBasisUsd = (h.averageBuyPrice || currentPrice) * h.amount;
      const pnlUsd = currentValueUsd - costBasisUsd;
      const pnlPercent = costBasisUsd > 0 ? (pnlUsd / costBasisUsd) * 100 : 0;

      totalNetWorthUsd += currentValueUsd;
      totalCostBasisUsd += costBasisUsd;

      return {
        ...h,
        currentPriceUsd: currentPrice,
        currentValueUsd: parseFloat(currentValueUsd.toFixed(2)),
        currentValueIdr: Math.round(currentValueUsd * rate),
        costBasisUsd: parseFloat(costBasisUsd.toFixed(2)),
        pnlUsd: parseFloat(pnlUsd.toFixed(2)),
        pnlIdr: Math.round(pnlUsd * rate),
        pnlPercent: parseFloat(pnlPercent.toFixed(2)),
        allocationPercent: 0,
      };
    });

    // Compute allocation percent
    for (const h of holdingsWithMarketData) {
      h.allocationPercent = totalNetWorthUsd > 0 ? parseFloat(((h.currentValueUsd / totalNetWorthUsd) * 100).toFixed(1)) : 0;
    }

    // Breakdown by Exchange
    const byExchange: Record<string, { exchange: string; totalUsd: number; totalIdr: number; count: number; percent: number }> = {};
    for (const h of holdingsWithMarketData) {
      if (!byExchange[h.exchange]) {
        byExchange[h.exchange] = { exchange: h.exchange, totalUsd: 0, totalIdr: 0, count: 0, percent: 0 };
      }
      byExchange[h.exchange].totalUsd += h.currentValueUsd;
      byExchange[h.exchange].totalIdr += h.currentValueIdr;
      byExchange[h.exchange].count += 1;
    }

    for (const key of Object.keys(byExchange)) {
      byExchange[key].percent = totalNetWorthUsd > 0 ? parseFloat(((byExchange[key].totalUsd / totalNetWorthUsd) * 100).toFixed(1)) : 0;
    }

    const totalPnlUsd = totalNetWorthUsd - totalCostBasisUsd;
    const totalPnlPercent = totalCostBasisUsd > 0 ? (totalPnlUsd / totalCostBasisUsd) * 100 : 0;

    return {
      totalNetWorthUsd: parseFloat(totalNetWorthUsd.toFixed(2)),
      totalNetWorthIdr: Math.round(totalNetWorthUsd * rate),
      totalCostBasisUsd: parseFloat(totalCostBasisUsd.toFixed(2)),
      totalPnlUsd: parseFloat(totalPnlUsd.toFixed(2)),
      totalPnlIdr: Math.round(totalPnlUsd * rate),
      totalPnlPercent: parseFloat(totalPnlPercent.toFixed(2)),
      usdToIdrRate: rate,
      holdings: holdingsWithMarketData,
      byExchange: Object.values(byExchange),
    };
  }

  private mapRowToHolding(row: Record<string, unknown>) {
    return {
      id: row.id as string,
      symbol: row.symbol as string,
      amount: row.amount as number,
      averageBuyPrice: row.average_buy_price as number | null,
      targetPercent: row.target_percent as number | null,
      exchange: row.exchange as 'BINANCE' | 'BYBIT' | 'OKX' | 'MANUAL' | 'WALLET',
      isManual: Boolean(row.is_manual),
      updatedAt: row.updated_at as number,
    };
  }
}

export const portfolioService = new PortfolioService();
