import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { env } from '../env.js';
import { seedDemoData } from '../db/seedDemoData.js';

const RESET_INTERVAL_MS = 60 * 60 * 1000; // 1 Hour (3,600,000 ms)
let isResetting = false;

export function getDemoResetMarkerPath(): string {
  // Store marker file in project root or backend directory
  const rootPath = path.resolve(process.cwd(), '.demo_last_reset');
  return rootPath;
}

export function readLastResetTimestamp(): number {
  try {
    const markerFile = getDemoResetMarkerPath();
    if (fs.existsSync(markerFile)) {
      const content = fs.readFileSync(markerFile, 'utf8').trim();
      const ts = parseInt(content, 10);
      if (!isNaN(ts) && ts > 0) {
        return ts;
      }
    }
  } catch (err) {
    console.warn('[DemoAutoReset] Failed to read last reset timestamp:', (err as Error).message);
  }
  return Date.now();
}

export function writeLastResetTimestamp(timestamp: number): void {
  try {
    const markerFile = getDemoResetMarkerPath();
    fs.writeFileSync(markerFile, timestamp.toString(), 'utf8');
  } catch (err) {
    console.warn('[DemoAutoReset] Failed to write last reset timestamp:', (err as Error).message);
  }
}

/**
 * In-App Lazy Auto-Reset Middleware (Pillar 5)
 * Checks elapsed time on incoming HTTP requests.
 * If elapsed >= 1 hour (3,600s), automatically executes full demo re-seed
 * without requiring any OS cron job or heavy background daemon process.
 */
export async function demoAutoResetMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  // Only active when DEMO_MODE=True
  if (!env.DEMO_MODE) {
    return next();
  }

  // Skip static/health requests to minimize unnecessary checks
  if (req.path === '/api/health' || req.path === '/favicon.ico') {
    return next();
  }

  const now = Date.now();
  const markerFile = getDemoResetMarkerPath();

  // If marker file does not exist, initialize it
  if (!fs.existsSync(markerFile)) {
    writeLastResetTimestamp(now);
    return next();
  }

  const lastReset = readLastResetTimestamp();
  const elapsed = now - lastReset;

  if (elapsed >= RESET_INTERVAL_MS) {
    if (isResetting) {
      // Concurrency lock: another parallel request is already resetting
      return next();
    }

    isResetting = true;
    console.log(
      `[DemoAutoReset] Lazy auto-reset triggered (elapsed: ${Math.round(elapsed / 1000)}s >= 3600s). Restoring demo data...`
    );

    try {
      await seedDemoData({ reset: true });
      writeLastResetTimestamp(Date.now());
      console.log('[DemoAutoReset] Lazy auto-reset finished successfully. Pristine state restored.');
    } catch (error) {
      console.error('[DemoAutoReset] Error during lazy auto-reset:', error);
    } finally {
      isResetting = false;
    }
  }

  next();
}

