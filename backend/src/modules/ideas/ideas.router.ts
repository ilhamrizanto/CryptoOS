import { Router } from 'express';
import { z } from 'zod';
import { ideasService } from './ideas.service.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const ideasRouter = Router();

// Enforce authentication on all ideas endpoints
ideasRouter.use(requireAuth);

const createIdeaSchema = z.object({
  symbol: z.string().min(1, 'Symbol harus diisi'),
  direction: z.enum(['LONG', 'SHORT']),
  timeframe: z.string().default('4H'),
  status: z.enum(['WATCHLIST', 'READY', 'ACTIVE', 'CLOSED', 'INVALIDATED']).default('WATCHLIST'),
  macroData: z.record(z.unknown()).optional(),
  fundamentalData: z.record(z.unknown()).optional(),
  priceActionData: z.record(z.unknown()).optional(),
  evidenceData: z.record(z.unknown()).optional(),
  entryPrice: z.number().optional(),
  stopLossPrice: z.number().optional(),
  tp1Price: z.number().optional(),
  tp2Price: z.number().optional(),
  tp3Price: z.number().optional(),
  riskPercent: z.number().optional(),
  notes: z.string().optional(),
});

// GET /api/ideas - List all ideas for authenticated user
ideasRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string | undefined;
    const ideas = await ideasService.listIdeas(userId, status);
    res.json({
      success: true,
      data: ideas,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ideas/:id - Get single idea
ideasRouter.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const idea = await ideasService.getIdeaById(userId, req.params.id);
    res.json({
      success: true,
      data: idea,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ideas - Create new idea
ideasRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const parsed = createIdeaSchema.parse(req.body);
    const created = await ideasService.createIdea(userId, parsed as any);
    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/ideas/:id - Update idea
ideasRouter.put('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const updated = await ideasService.updateIdea(userId, req.params.id, req.body);
    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/ideas/:id - Delete idea
ideasRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const result = await ideasService.deleteIdea(userId, req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ideas/:id/execute - Transfer idea into active journal position
ideasRouter.post('/:id/execute', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const posSize = req.body.positionSize ? parseFloat(req.body.positionSize) : undefined;
    const result = await ideasService.transferToJournal(userId, req.params.id, posSize);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
