import { sqliteClient } from '../../db/index.js';
import { NotFoundError } from '../../utils/errors.js';
import { marketService } from '../market/market.service.js';

export interface CreateCashflowDto {
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'STAKING_YIELD' | 'AIRDROP' | 'FEE';
  amountUsd: number;
  amountIdr?: number;
  sourceOrDestination?: string;
  exchange?: string;
  transactionDate?: number;
  notes?: string;
}

export class CashflowService {
  /**
   * List all cashflow ledger entries for a specific user
   */
  public async listTransactions(userId: string, type?: string) {
    let sql = 'SELECT * FROM cashflow_ledger WHERE user_id = ?';
    const args: (string | number | null)[] = [userId];

    if (type) {
      sql += ' AND type = ?';
      args.push(type);
    }

    sql += ' ORDER BY transaction_date DESC';

    const result = await sqliteClient.execute({ sql, args });
    return result.rows.map(this.mapRowToTransaction);
  }

  /**
   * Create a new cashflow transaction for a specific user
   */
  public async createTransaction(userId: string, dto: CreateCashflowDto) {
    const id = `cfl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const date = dto.transactionDate || Date.now();

    const usdIdrInfo = await marketService.getUsdIdr();
    const rate = usdIdrInfo.value || 16300;
    const amountIdr = dto.amountIdr || Math.round(dto.amountUsd * rate);

    await sqliteClient.execute({
      sql: `INSERT INTO cashflow_ledger (
        id, user_id, type, amount_usd, amount_idr, source_or_destination, exchange, transaction_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        userId,
        dto.type,
        dto.amountUsd,
        amountIdr,
        dto.sourceOrDestination ?? null,
        dto.exchange ?? null,
        date,
        dto.notes ?? null,
      ],
    });

    const result = await sqliteClient.execute({
      sql: 'SELECT * FROM cashflow_ledger WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    return this.mapRowToTransaction(result.rows[0]);
  }

  /**
   * Delete cashflow transaction for a specific user
   */
  public async deleteTransaction(userId: string, id: string) {
    const result = await sqliteClient.execute({
      sql: 'SELECT id FROM cashflow_ledger WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    if (result.rows.length === 0) {
      throw new NotFoundError(`Cashflow transaction '${id}' not found`);
    }

    await sqliteClient.execute({
      sql: 'DELETE FROM cashflow_ledger WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    return { id, deleted: true };
  }

  /**
   * Summary calculation for Treasury & Cashflow (isolated per user)
   */
  public async getSummary(userId: string, overrideRate?: number) {
    const transactions = await this.listTransactions(userId);
    const usdIdrInfo = await marketService.getUsdIdr();
    const rate = overrideRate || usdIdrInfo.value || 16300;

    let totalDepositsUsd = 0;
    let totalWithdrawalsUsd = 0;
    let totalStakingYieldUsd = 0;
    let totalAirdropsUsd = 0;
    let totalFeesUsd = 0;

    for (const t of transactions) {
      if (t.type === 'DEPOSIT') totalDepositsUsd += t.amountUsd;
      else if (t.type === 'WITHDRAWAL') totalWithdrawalsUsd += t.amountUsd;
      else if (t.type === 'STAKING_YIELD') totalStakingYieldUsd += t.amountUsd;
      else if (t.type === 'AIRDROP') totalAirdropsUsd += t.amountUsd;
      else if (t.type === 'FEE') totalFeesUsd += t.amountUsd;
    }

    const netCapitalInflowUsd = totalDepositsUsd - totalWithdrawalsUsd;

    return {
      totalDepositsUsd,
      totalDepositsIdr: Math.round(totalDepositsUsd * rate),
      totalWithdrawalsUsd,
      totalWithdrawalsIdr: Math.round(totalWithdrawalsUsd * rate),
      totalStakingYieldUsd,
      totalStakingYieldIdr: Math.round(totalStakingYieldUsd * rate),
      totalAirdropsUsd,
      totalAirdropsIdr: Math.round(totalAirdropsUsd * rate),
      totalFeesUsd,
      totalFeesIdr: Math.round(totalFeesUsd * rate),
      netCapitalInflowUsd,
      netCapitalInflowIdr: Math.round(netCapitalInflowUsd * rate),
      usdToIdrRate: rate,
      transactionCount: transactions.length,
    };
  }

  private mapRowToTransaction(row: Record<string, unknown>) {
    return {
      id: row.id as string,
      type: row.type as 'DEPOSIT' | 'WITHDRAWAL' | 'STAKING_YIELD' | 'AIRDROP' | 'FEE',
      amountUsd: row.amount_usd as number,
      amountIdr: row.amount_idr as number,
      sourceOrDestination: row.source_or_destination as string | null,
      exchange: row.exchange as string | null,
      transactionDate: row.transaction_date as number,
      notes: row.notes as string | null,
    };
  }
}

export const cashflowService = new CashflowService();
