import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export interface AuthenticatedUser {
  userId: string;
  username: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing or invalid');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (_error) {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}

/**
 * Enforce Admin or Owner privileges
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenError('Akses ditolak: Hanya Administrator atau Owner yang memiliki izin akses.');
    }
    next();
  });
}
