import { Router } from 'express';
import { authService } from './auth.service.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { password } = req.body;
    const session = await authService.login(password);
    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/google
authRouter.post('/google', async (req, res, next) => {
  try {
    const { email, name, idToken, credential, accessToken } = req.body;
    const session = await authService.loginWithGoogle(email, name, idToken || credential, accessToken);
    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/verify
authRouter.get('/verify', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: req.user,
    },
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (_req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
});

// =========================================================================
// ADMIN WHITELIST ENDPOINTS (OWNER / ADMIN ONLY)
// =========================================================================

// GET /api/auth/admin/whitelist
authRouter.get('/admin/whitelist', requireAdmin, async (_req, res, next) => {
  try {
    const users = await authService.getWhitelistUsers();
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/admin/whitelist
authRouter.post('/admin/whitelist', requireAdmin, async (req, res, next) => {
  try {
    const { email, role, notes } = req.body;
    const created = await authService.addWhitelistUser(email, role, notes);
    res.status(201).json({
      success: true,
      data: created,
      message: `Email ${email} berhasil didaftarkan ke whitelist.`,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/admin/whitelist/:id
authRouter.put('/admin/whitelist/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { role, notes, status } = req.body;
    await authService.updateWhitelistUser(id, { role, notes, status });
    res.json({
      success: true,
      message: 'Data whitelist user berhasil diperbarui.',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/admin/whitelist/:id
authRouter.delete('/admin/whitelist/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    await authService.deleteWhitelistUser(id);
    res.json({
      success: true,
      message: 'User berhasil dihapus dari whitelist.',
    });
  } catch (error) {
    next(error);
  }
});
