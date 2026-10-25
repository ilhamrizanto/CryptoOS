import { Router } from 'express';
import axios from 'axios';
import { authService } from './auth.service.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { sqliteClient } from '../../db/index.js';

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
    const { email, name, idToken, credential, accessToken, picture } = req.body;
    const session = await authService.loginWithGoogle(email, name, idToken || credential, accessToken, picture);
    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/verify
authRouter.get('/verify', requireAuth, async (req, res, next) => {
  try {
    let avatarUrl = req.user?.avatarUrl;
    if (!avatarUrl && req.user?.email) {
      const row = await sqliteClient.execute({
        sql: 'SELECT avatar_url FROM users WHERE LOWER(email) = ? LIMIT 1',
        args: [req.user.email.toLowerCase()],
      });
      if (row.rows.length > 0 && row.rows[0].avatar_url) {
        avatarUrl = String(row.rows[0].avatar_url);
      }
    }
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          ...req.user,
          avatarUrl,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/sync-google-avatar
authRouter.post('/sync-google-avatar', requireAuth, async (req, res, next) => {
  try {
    const { accessToken, avatarUrl } = req.body;
    let resolvedPicture: string | undefined = avatarUrl;

    if (!resolvedPicture && accessToken) {
      try {
        const userinfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 6000,
        });
        resolvedPicture = userinfoRes.data?.picture;
      } catch (e) {
        console.warn('[AuthRouter] Failed to fetch Google userinfo:', (e as Error).message);
      }
    }

    if (resolvedPicture && req.user?.email) {
      await sqliteClient.execute({
        sql: 'UPDATE users SET avatar_url = ? WHERE LOWER(email) = ?',
        args: [resolvedPicture, req.user.email.toLowerCase()],
      });
    }

    res.json({
      success: true,
      data: {
        avatarUrl: resolvedPicture || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/upload-avatar
authRouter.post('/upload-avatar', requireAuth, async (req, res, next) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return res.status(400).json({ success: false, error: { message: 'avatarUrl is required' } });
    }

    if (req.user?.email) {
      await sqliteClient.execute({
        sql: 'UPDATE users SET avatar_url = ? WHERE LOWER(email) = ?',
        args: [avatarUrl, req.user.email.toLowerCase()],
      });
    }

    res.json({
      success: true,
      data: { avatarUrl },
    });
  } catch (err) {
    next(err);
  }
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
      message: `Email ${email} successfully registered to whitelist.`,
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
      message: 'Whitelisted user updated successfully.',
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
      message: 'User removed from whitelist successfully.',
    });
  } catch (error) {
    next(error);
  }
});
