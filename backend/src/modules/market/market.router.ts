import { Router } from 'express';
import { z } from 'zod';
import { marketService } from './market.service.js';
import { ValidationError } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const marketRouter = Router();

// GET /api/market/intel - Aggregated Market Data
marketRouter.get('/intel', async (req, res, next) => {
  try {
    const forceRefresh = req.query.refresh === 'true' || req.query.refresh === '1';
    const data = await marketService.getAggregatedIntel(forceRefresh);
    res.json({
      success: true,
      data,
      meta: {
        timestamp: Date.now(),
        cached: !forceRefresh,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/market/fedwatch - FedWatch details
marketRouter.get('/fedwatch', async (_req, res, next) => {
  try {
    const data = await marketService.getFedWatchData();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

const fedwatchSchema = z.object({
  easeProb: z.number().min(0).max(100),
  noChangeProb: z.number().min(0).max(100),
  hikeProb: z.number().min(0).max(100),
  notes: z.string().optional(),
});

// PATCH /api/market/fedwatch - Update FedWatch probability manually
marketRouter.patch('/fedwatch', requireAuth, async (req, res, next) => {
  try {
    const parsed = fedwatchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Format data FedWatch tidak valid', parsed.error.format());
    }

    const updated = await marketService.saveFedWatchData(parsed.data);
    res.json({
      success: true,
      data: updated,
      meta: {
        message: 'Probabilitas FedWatch berhasil diperbarui',
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/market/usd-idr - Quick rate lookup
marketRouter.get('/usd-idr', async (_req, res, next) => {
  try {
    const rate = await marketService.getUsdIdr();
    res.json({
      success: true,
      data: rate,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/market/coin/search - Search token by symbol or name
marketRouter.get('/coin/search', async (req, res, next) => {
  try {
    const q = (req.query.q as string) || '';
    const coins = await marketService.searchCoins(q);
    res.json({
      success: true,
      data: coins,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/market/coin/:coinId/fundamental - Fetch tokenomics and fundamental metrics
marketRouter.get('/coin/:coinId/fundamental', async (req, res, next) => {
  try {
    const data = await marketService.getCoinFundamental(req.params.coinId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});
