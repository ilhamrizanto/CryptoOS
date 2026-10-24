import { Router } from 'express';
import { settingsService } from './settings.service.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const settingsRouter = Router();

// Enforce authentication on all settings endpoints
settingsRouter.use(requireAuth);

/**
 * POST /api/settings/webhook/telegram
 * Test Telegram Bot connection by dispatching formatted ping
 */
settingsRouter.post('/webhook/telegram', async (req, res, next) => {
  try {
    const result = await settingsService.testTelegram(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/settings/webhook/discord
 * Test Discord Webhook by dispatching rich embed ping
 */
settingsRouter.post('/webhook/discord', async (req, res, next) => {
  try {
    const result = await settingsService.testDiscord(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/settings/backup/export
 * Download complete database JSON bundle for the authenticated user
 */
settingsRouter.get('/backup/export', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const backup = await settingsService.exportFullDatabase(userId);
    res.json({
      success: true,
      data: backup,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/settings/backup/import
 * Restore/Merge user database from provided JSON bundle
 */
settingsRouter.post('/backup/import', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const { backup, mode = 'merge' } = req.body;
    const result = await settingsService.importFullDatabase(userId, backup, mode);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
