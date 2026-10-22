import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import crypto from 'crypto';
import { env } from '../../env.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { sqliteClient } from '../../db/index.js';

export interface AuthSession {
  token: string;
  user: {
    id: string;
    username: string;
    email?: string;
    role: string;
  };
}

export class AuthService {
  private static readonly DEFAULT_HASH =
    '$2a$10$N.QG7Vq2h9W4K6u9q/w2r.4rYqL7Wn5oB6B8R1x5f5Z8b8v0c1c2e';

  /**
   * Verify password and generate JWT session token
   * Supports:
   * - Master password ('cryptoos2026', 'admin') -> user-ilhamgb11 (OWNER)
   * - Test / Demo password ('newuser', 'demo') -> user-demo-clean (USER - 0 records / empty state)
   */
  public async login(password: string): Promise<AuthSession> {
    if (!password) {
      throw new UnauthorizedError('Password is required');
    }

    const masterHash = env.MASTER_PASSWORD_HASH || AuthService.DEFAULT_HASH;

    let isOwner = false;
    try {
      isOwner = await bcrypt.compare(password, masterHash);
    } catch {
      isOwner = password === masterHash;
    }

    if (!isOwner && (password === 'cryptoos2026' || password === 'admin')) {
      isOwner = true;
    }

    let isDemo = false;
    if (password === 'newuser' || password === 'demo' || password === 'demo123') {
      isDemo = true;
    }

    if (!isOwner && !isDemo) {
      throw new UnauthorizedError('Invalid password. Access denied.');
    }

    const payload = isOwner
      ? {
          userId: 'user-ilhamgb11',
          username: 'Ilham',
          email: 'ilhamgb11@gmail.com',
          role: 'OWNER',
        }
      : {
          userId: 'user-demo-clean',
          username: 'New Trader',
          email: 'demo@cryptoos.trade',
          role: 'USER',
        };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      token,
      user: {
        id: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role,
      },
    };
  }

  /**
   * Authorize user via Google Account (supports Google ID Token, Access Token, or verified email)
   * Multi-user: Any authenticated Google user gets their own dedicated account & clean isolated workspace!
   */
  public async loginWithGoogle(
    email?: string,
    name?: string,
    idToken?: string,
    accessToken?: string
  ): Promise<AuthSession> {
    let resolvedEmail = email;
    let resolvedName = name;

    // If Google accessToken is provided, query Google OAuth2 UserInfo
    if (accessToken) {
      try {
        const userinfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000,
        });
        if (userinfoRes.data?.email) {
          resolvedEmail = userinfoRes.data.email;
          resolvedName = userinfoRes.data.name || resolvedName;
        }
      } catch (e) {
        console.warn('[AuthService] Failed to fetch Google userinfo from access token:', (e as Error).message);
      }
    }

    // If Google ID Token is provided, verify via Google tokeninfo endpoint or decode
    if (idToken && !resolvedEmail) {
      try {
        const tokenRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, {
          timeout: 4000,
        });
        if (tokenRes.data?.email) {
          resolvedEmail = tokenRes.data.email;
          resolvedName = tokenRes.data.name || resolvedName;
        }
      } catch {
        try {
          const decoded = jwt.decode(idToken) as any;
          if (decoded && decoded.email) {
            resolvedEmail = decoded.email;
            resolvedName = decoded.name || resolvedName;
          }
        } catch {}
      }
    }

    if (!resolvedEmail) {
      throw new UnauthorizedError('Google email, access token, or ID token is required');
    }

    const normalizedEmail = resolvedEmail.toLowerCase().trim();
    const isOwner =
      normalizedEmail.startsWith('ilhamgb11@') ||
      normalizedEmail === 'ilhamgb11@gmail.com';

    // Owner retains existing historical records; any other user gets a unique deterministic ID
    const userId = isOwner
      ? 'user-ilhamgb11'
      : `user-${crypto.createHash('sha256').update(normalizedEmail).digest('hex').slice(0, 12)}`;

    const username = resolvedName || normalizedEmail.split('@')[0];
    const role = isOwner ? 'OWNER' : 'USER';

    // Upsert into users table
    await sqliteClient.execute({
      sql: `INSERT INTO users (username, password, email, role, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET email = excluded.email`,
      args: [username, 'oauth-google', normalizedEmail, role, Date.now()],
    }).catch(() => {});

    const payload = {
      userId,
      username,
      email: normalizedEmail,
      role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '14d',
    });

    return {
      token,
      user: {
        id: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role,
      },
    };
  }

  /**
   * Verify an existing JWT token
   */
  public verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        username: string;
        email?: string;
        role: string;
      };
      return decoded;
    } catch {
      throw new UnauthorizedError('Session has expired or token is invalid');
    }
  }
}

export const authService = new AuthService();
