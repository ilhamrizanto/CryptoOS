import { Router } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { env } from '../../env.js';
import { ForbiddenError, ValidationError } from '../../utils/errors.js';
import { sqliteClient } from '../../db/index.js';
import { seedDemoData, DEMO_USERS } from '../../db/seedDemoData.js';
import { getDemoResetMarkerPath, readLastResetTimestamp, writeLastResetTimestamp } from '../../middleware/demoAutoReset.middleware.js';

export const demoRouter = Router();

const VALID_ROLES = ['admin', 'operator', 'viewer'] as const;
type DemoRole = typeof VALID_ROLES[number];

/**
 * GET /api/demo/status
 * Check if demo mode is active and retrieve status/timestamp
 */
demoRouter.get('/status', (_req, res) => {
  const lastReset = readLastResetTimestamp();
  const nextReset = lastReset + 3600 * 1000;

  res.json({
    success: true,
    data: {
      demoMode: env.DEMO_MODE,
      lastReset,
      nextReset,
      timeRemainingMs: Math.max(0, nextReset - Date.now()),
      roles: [
        {
          id: 'admin',
          label: 'Admin (Portfolio Lead)',
          badge: 'ADMIN',
          description: 'Full administrative command, whitelist governance, and risk configuration',
          email: 'demo-admin@cryptoos.trade',
        },
        {
          id: 'operator',
          label: 'Operator (Quant Trader)',
          badge: 'OPERATOR',
          description: 'Trade execution, 4-pillars analysis pipeline, and journal ledger management',
          email: 'demo-trader@cryptoos.trade',
        },
        {
          id: 'viewer',
          label: 'Viewer (Client Auditor)',
          badge: 'VIEWER',
          description: 'Institutional performance audit, real-time read-only analytics & reporting',
          email: 'demo-viewer@cryptoos.trade',
        },
      ],
    },
  });
});

/**
 * POST /api/demo/login/:role
 * 1-Click Instant Guest Authentication for Demo Roles
 */
demoRouter.post('/login/:role', async (req, res, next) => {
  try {
    if (!env.DEMO_MODE) {
      throw new ForbiddenError('Demo mode is disabled on this server.');
    }

    const requestedRole = (req.params.role || '').toLowerCase() as DemoRole;
    if (!VALID_ROLES.includes(requestedRole)) {
      throw new ValidationError(`Invalid demo role "${req.params.role}". Valid roles: admin, operator, viewer.`);
    }

    const demoUserConfig = DEMO_USERS.find(
      (u) =>
        (requestedRole === 'admin' && u.role === 'ADMIN') ||
        (requestedRole === 'operator' && u.role === 'USER') ||
        (requestedRole === 'viewer' && u.role === 'VIEWER')
    );

    if (!demoUserConfig) {
      throw new ValidationError('Could not locate demo user configuration for role.');
    }

    const now = Date.now();

    // 1. Ensure user row exists in 'users'
    await sqliteClient.execute({
      sql: `INSERT INTO users (username, password, email, role, avatar_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET
              role = excluded.role,
              avatar_url = excluded.avatar_url,
              email = excluded.email`,
      args: [
        demoUserConfig.username,
        'cryptoos-demo-guest-session',
        demoUserConfig.email,
        demoUserConfig.role,
        demoUserConfig.avatarUrl,
        now,
      ],
    });

    // 2. Ensure whitelisted in 'user_whitelist'
    await sqliteClient.execute({
      sql: `INSERT INTO user_whitelist (email, role, notes, status, created_at, updated_at)
            VALUES (?, ?, ?, 'ACTIVE', ?, ?)
            ON CONFLICT(email) DO UPDATE SET
              role = excluded.role,
              status = 'ACTIVE',
              updated_at = excluded.updated_at`,
      args: [demoUserConfig.email, demoUserConfig.role, demoUserConfig.notes, now, now],
    });

    // 3. Ensure demo data exists for this user; if empty, seed fresh
    const countCheck = await sqliteClient.execute({
      sql: 'SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ?',
      args: [demoUserConfig.userId],
    });
    const entryCount = Number(countCheck.rows[0]?.count || 0);
    if (entryCount === 0) {
      await seedDemoData({ reset: false, targetUserIds: [demoUserConfig.userId] });
    }

    // 4. Generate Ephemeral JWT Token (Pillar 7: Short 2-hour lifespan for guest demo)
    const payload = {
      userId: demoUserConfig.userId,
      username: demoUserConfig.username,
      email: demoUserConfig.email,
      role: demoUserConfig.role,
      avatarUrl: demoUserConfig.avatarUrl,
      isDemoUser: true,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '2h', // Ephemeral demo session
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: payload.userId,
          username: payload.username,
          email: payload.email,
          role: payload.role,
          avatarUrl: payload.avatarUrl,
          isDemoUser: true,
        },
      },
      message: `Demo guest session initiated as ${demoUserConfig.username} (${demoUserConfig.role}).`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/demo/reset or POST /api/reset-demo-data
 * Self-Service Demo Environment Reset
 */
demoRouter.post(['/reset', '/reset-demo-data'], async (_req, res, next) => {
  try {
    if (!env.DEMO_MODE) {
      throw new ForbiddenError('Demo mode is disabled on this server.');
    }

    console.log('[DemoRouter] Self-service demo reset requested. Reseeding fresh database state...');
    const result = await seedDemoData({ reset: true });
    writeLastResetTimestamp(Date.now());

    res.json({
      success: true,
      data: {
        timestamp: Date.now(),
        stats: result.stats,
      },
      message: 'Demo environment successfully reset to pristine institutional state.',
    });
  } catch (error) {
    next(error);
  }
});

