import { Router } from 'express';
import { authService } from './auth.service.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

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
