import { Router } from 'express';
import { cashflowService } from './cashflow.service.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const cashflowRouter = Router();

// Enforce authentication on all cashflow endpoints
cashflowRouter.use(requireAuth);

/**
 * GET /api/cashflow/summary
 * Total Deposits, Withdrawals, Staking Yields, Net Capital Inflow
 */
cashflowRouter.get('/summary', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const rate = req.query.rate ? parseFloat(req.query.rate as string) : undefined;
    const summary = await cashflowService.getSummary(userId, rate);
    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cashflow
 * List cashflow transactions with optional ?type=DEPOSIT|WITHDRAWAL...
 */
cashflowRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const type = req.query.type as string | undefined;
    const transactions = await cashflowService.listTransactions(userId, type);
    res.json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cashflow
 * Log new cash mutation (deposit, withdrawal, staking yield)
 */
cashflowRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const created = await cashflowService.createTransaction(userId, req.body);
    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/cashflow/:id
 * Delete cashflow record
 */
cashflowRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const result = await cashflowService.deleteTransaction(userId, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
