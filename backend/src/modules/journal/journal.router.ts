import { Router } from 'express';
import { journalService } from './journal.service.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const journalRouter = Router();

// Enforce authentication on all journal endpoints
journalRouter.use(requireAuth);

/**
 * GET /api/journal/analytics
 * Performance metrics: Win rate, profit factor, expectancy, equity curve
 */
journalRouter.get('/analytics', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const analytics = await journalService.getAnalytics(userId);
    res.json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/journal/entries
 * List all journal entries with optional ?status=OPEN|CLOSED
 */
journalRouter.get('/entries', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string | undefined;
    const entries = await journalService.listEntries(userId, status);
    res.json({
      success: true,
      data: entries,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/journal/entries/:id
 * Get single journal entry
 */
journalRouter.get('/entries/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const entry = await journalService.getEntryById(userId, req.params.id);
    res.json({
      success: true,
      data: entry,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/journal/entries
 * Manually log a new trade entry
 */
journalRouter.post('/entries', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const entry = await journalService.createEntry(userId, req.body);
    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/journal/entries/:id/close
 * Close trade with exit price and compute final PnL & R-multiple
 */
journalRouter.post('/entries/:id/close', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const closed = await journalService.closeEntry(userId, req.params.id, req.body);
    res.json({
      success: true,
      data: closed,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/journal/entries/:id
 * Update notes, psychology, or reflection
 */
journalRouter.patch('/entries/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const updated = await journalService.updateEntry(userId, req.params.id, req.body);
    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/journal/entries/:id
 * Delete journal entry
 */
journalRouter.delete('/entries/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const result = await journalService.deleteEntry(userId, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
