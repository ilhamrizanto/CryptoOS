import { Request, Response, NextFunction } from 'express';
import { env } from '../env.js';
import { ForbiddenError, ValidationError } from '../utils/errors.js';
import { sqliteClient } from '../db/index.js';

const DEMO_PROTECTED_EMAILS = [
  'demo-admin@cryptoos.trade',
  'demo-trader@cryptoos.trade',
  'demo-viewer@cryptoos.trade',
  'ilhamgb11@gmail.com',
];

const MAX_DEMO_RECORDS_PER_TABLE = 50;

/**
 * Demo Protection Middleware (Pillar 7)
 * 1. Enforces read-only permissions for VIEWER role on mutating HTTP methods.
 * 2. Protects demo and primary system users from being deleted or modified.
 * 3. Enforces an anti-bloat record quota cap (max 50 records) in demo mode.
 */
export async function demoProtectionMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!env.DEMO_MODE) {
    return next();
  }

  const method = req.method.toUpperCase();
  const path = req.path.toLowerCase();

  // 1. Viewer Role Read-Only Enforcement
  if (req.user?.role === 'VIEWER') {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // Allow demo reset & logout for everyone
      if (path.includes('/demo/reset') || path.includes('/reset-demo-data') || path.includes('/auth/logout')) {
        return next();
      }

      throw new ForbiddenError(
        '[Viewer Role] Akses hanya-baca (read-only). Peran Viewer tidak diizinkan mengubah data. Silakan beralih ke peran Operator atau Admin untuk menguji fitur edit.'
      );
    }
  }

  // 2. Protect Demo Users from modification / deletion in Whitelist
  if (path.startsWith('/api/auth/admin/whitelist') && ['PUT', 'DELETE'].includes(method)) {
    const id = parseInt(String(req.params.id || path.split('/').pop()), 10);
    if (!isNaN(id)) {
      try {
        const userQuery = await sqliteClient.execute({
          sql: 'SELECT email FROM user_whitelist WHERE id = ? LIMIT 1',
          args: [id],
        });
        if (userQuery.rows.length > 0) {
          const email = String(userQuery.rows[0].email || '').toLowerCase().trim();
          if (DEMO_PROTECTED_EMAILS.includes(email)) {
            throw new ForbiddenError(
              `[Demo Mode] Akun sistem demo (${email}) dilindungi dan tidak dapat dihapus atau dimodifikasi agar tamu lain tetap dapat mengeksplorasi aplikasi.`
            );
          }
        }
      } catch (err: any) {
        if (err instanceof ForbiddenError) throw err;
      }
    }
  }

  // 3. Anti-Bloat / Anti-Spam Quota Cap in Demo Mode
  if (method === 'POST') {
    const userId = req.user?.userId;
    if (userId) {
      let targetTable: string | null = null;
      if (path.startsWith('/api/journal')) targetTable = 'journal_entries';
      else if (path.startsWith('/api/ideas')) targetTable = 'trade_ideas';
      else if (path.startsWith('/api/cashflow')) targetTable = 'cashflow_ledger';
      else if (path.startsWith('/api/portfolio')) targetTable = 'portfolio_holdings';

      if (targetTable) {
        try {
          const countRes = await sqliteClient.execute({
            sql: `SELECT COUNT(*) as cnt FROM ${targetTable} WHERE user_id = ?`,
            args: [userId],
          });
          const count = Number(countRes.rows[0]?.cnt || 0);
          if (count >= MAX_DEMO_RECORDS_PER_TABLE) {
            throw new ValidationError(
              `[Demo Mode] Limit kuota demo tercapai (maksimal ${MAX_DEMO_RECORDS_PER_TABLE} rekaman di modul ini). Silakan gunakan tombol "Reset Demo" di navigasi atas untuk mengosongkan dan me-refresh data.`
            );
          }
        } catch (err: any) {
          if (err instanceof ValidationError) throw err;
        }
      }
    }
  }

  next();
}

