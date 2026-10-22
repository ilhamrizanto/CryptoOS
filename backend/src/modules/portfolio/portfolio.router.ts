import { Router } from 'express';
import { portfolioService } from './portfolio.service.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const portfolioRouter = Router();

// Enforce authentication on all portfolio endpoints
portfolioRouter.use(requireAuth);

/**
 * GET /api/portfolio/summary
 * Total Net worth in USD & IDR, asset distribution, exchange breakdown
 */
portfolioRouter.get('/summary', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const rate = req.query.rate ? parseFloat(req.query.rate as string) : undefined;
    const summary = await portfolioService.getSummary(userId, rate);
    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/portfolio/holdings
 * List all holdings for authenticated user
 */
portfolioRouter.get('/holdings', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const holdings = await portfolioService.listHoldings(userId);
    res.json({
      success: true,
      data: holdings,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/portfolio/holdings/:id
 * Get single holding for authenticated user
 */
portfolioRouter.get('/holdings/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const holding = await portfolioService.getHoldingById(userId, req.params.id);
    res.json({
      success: true,
      data: holding,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/portfolio/holdings
 * Create new holding for authenticated user
 */
portfolioRouter.post('/holdings', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const created = await portfolioService.createHolding(userId, req.body);
    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/portfolio/holdings/:id
 * Update holding for authenticated user
 */
portfolioRouter.put('/holdings/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const updated = await portfolioService.updateHolding(userId, req.params.id, req.body);
    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/portfolio/holdings/:id
 * Delete holding for authenticated user
 */
portfolioRouter.delete('/holdings/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const result = await portfolioService.deleteHolding(userId, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
