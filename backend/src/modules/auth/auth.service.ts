import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import crypto from 'crypto';
import { env } from '../../env.js';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../../utils/errors.js';
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

export interface WhitelistUser {
  id: number;
  email: string;
  role: string;
  notes?: string;
  status: 'ACTIVE' | 'REVOKED';
  createdAt: number;
  updatedAt: number;
  lastLogin?: number;
}

export class AuthService {
  private static readonly DEFAULT_HASH =
    '$2b$10$Fz7oBbbyy5VP5tMm0vs7t.95VbCeA6xRBlKIY25zpe3k1yz59Bs3S'; // bcrypt for cryptoos2026

  /**
   * Verify password and generate JWT session token
   * - Master password hash verified via bcrypt against env.MASTER_PASSWORD_HASH -> OWNER
   * - Test / Demo password in development only -> USER (user-demo-clean)
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
      isOwner = false;
    }

    let isDemo = false;
    if (env.NODE_ENV !== 'production' && (password === 'newuser' || password === 'demo')) {
      isDemo = true;
    }

    if (!isOwner && !isDemo) {
      throw new UnauthorizedError('Invalid master key password. Access denied.');
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
   * Authorize user via Google Account with strict cryptographic token verification
   * and Whitelist validation
   */
  public async loginWithGoogle(
    _email?: string,
    _name?: string,
    idToken?: string,
    accessToken?: string
  ): Promise<AuthSession> {
    if (!accessToken && !idToken) {
      throw new UnauthorizedError('Cryptographic Google credential (access token or ID token) is required.');
    }

    let resolvedEmail: string | undefined;
    let resolvedName: string | undefined;

    // 1. Verify via Google OAuth2 UserInfo if access token provided
    if (accessToken) {
      try {
        const userinfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 6000,
        });
        if (userinfoRes.data?.email && userinfoRes.data?.email_verified !== false) {
          resolvedEmail = userinfoRes.data.email;
          resolvedName = userinfoRes.data.name;
        }
      } catch (e) {
        console.warn('[AuthService] Google access token verification failed:', (e as Error).message);
      }
    }

    // 2. Verify via Google TokenInfo if ID token provided
    if (!resolvedEmail && idToken) {
      try {
        const tokenRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, {
          timeout: 6000,
        });
        if (
          tokenRes.data?.email &&
          (tokenRes.data.email_verified === 'true' || tokenRes.data.email_verified === true)
        ) {
          if (env.GOOGLE_CLIENT_ID && tokenRes.data.aud && tokenRes.data.aud !== env.GOOGLE_CLIENT_ID) {
            throw new UnauthorizedError('Google ID token audience mismatch');
          }
          resolvedEmail = tokenRes.data.email;
          resolvedName = tokenRes.data.name;
        }
      } catch (e) {
        console.warn('[AuthService] Google ID token verification failed:', (e as Error).message);
      }
    }

    if (!resolvedEmail) {
      throw new UnauthorizedError('Google authentication failed. Credential is invalid or unverified by Google.');
    }

    const normalizedEmail = resolvedEmail.toLowerCase().trim();
    const isOwner =
      normalizedEmail.startsWith('ilhamgb11@') ||
      normalizedEmail === 'ilhamgb11@gmail.com';

    // 3. Strict Whitelist Enforcement
    const wlQuery = await sqliteClient.execute({
      sql: 'SELECT * FROM user_whitelist WHERE LOWER(email) = ? LIMIT 1',
      args: [normalizedEmail],
    });

    if (!isOwner && wlQuery.rows.length === 0) {
      throw new ForbiddenError(
        `Akses Ditolak: Email (${normalizedEmail}) belum terdaftar di whitelist CryptoOS. Hubungi Administrator untuk didaftarkan.`
      );
    }

    if (!isOwner && String(wlQuery.rows[0].status || '').toUpperCase() === 'REVOKED') {
      throw new ForbiddenError(
        `Akses Dinonaktifkan: Akses akun (${normalizedEmail}) telah dinonaktifkan oleh Administrator.`
      );
    }

    const determinedRole = isOwner
      ? 'OWNER'
      : (wlQuery.rows[0]?.role ? String(wlQuery.rows[0].role).toUpperCase() : 'USER');

    const role = isOwner ? 'OWNER' : determinedRole;

    // Owner retains existing historical records; any other user gets a unique deterministic ID
    const userId = isOwner
      ? 'user-ilhamgb11'
      : `user-${crypto.createHash('sha256').update(normalizedEmail).digest('hex').slice(0, 12)}`;

    const username = resolvedName || normalizedEmail.split('@')[0];

    // Upsert into users table
    await sqliteClient.execute({
      sql: `INSERT INTO users (username, password, email, role, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET email = excluded.email, role = excluded.role`,
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

  // =========================================================================
  // ADMIN WHITELIST MANAGEMENT METHODS
  // =========================================================================

  /**
   * List all whitelisted users
   */
  public async getWhitelistUsers(): Promise<WhitelistUser[]> {
    const result = await sqliteClient.execute({
      sql: `SELECT w.id, w.email, w.role, w.notes, w.status, w.created_at, w.updated_at, u.created_at as last_login
            FROM user_whitelist w
            LEFT JOIN users u ON LOWER(u.email) = LOWER(w.email)
            ORDER BY w.id ASC`,
      args: [],
    });

    return result.rows.map((r: any) => ({
      id: Number(r.id),
      email: String(r.email),
      role: String(r.role || 'USER').toUpperCase(),
      notes: r.notes ? String(r.notes) : '',
      status: (String(r.status || 'ACTIVE').toUpperCase() === 'REVOKED' ? 'REVOKED' : 'ACTIVE') as 'ACTIVE' | 'REVOKED',
      createdAt: Number(r.created_at || Date.now()),
      updatedAt: Number(r.updated_at || Date.now()),
      lastLogin: r.last_login ? Number(r.last_login) : undefined,
    }));
  }

  /**
   * Add a new email to whitelist
   */
  public async addWhitelistUser(email: string, role = 'USER', notes = ''): Promise<WhitelistUser> {
    if (!email || !email.includes('@')) {
      throw new ValidationError('Format alamat email tidak valid.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const sanitizedRole = role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
    const now = Date.now();

    await sqliteClient.execute({
      sql: `INSERT INTO user_whitelist (email, role, notes, status, created_at, updated_at)
            VALUES (?, ?, ?, 'ACTIVE', ?, ?)
            ON CONFLICT(email) DO UPDATE SET
              role = excluded.role,
              notes = excluded.notes,
              status = 'ACTIVE',
              updated_at = excluded.updated_at`,
      args: [normalizedEmail, sanitizedRole, notes.trim(), now, now],
    });

    const inserted = await sqliteClient.execute({
      sql: 'SELECT * FROM user_whitelist WHERE LOWER(email) = ? LIMIT 1',
      args: [normalizedEmail],
    });

    const row = inserted.rows[0];
    return {
      id: Number(row.id),
      email: String(row.email),
      role: String(row.role || 'USER').toUpperCase(),
      notes: row.notes ? String(row.notes) : '',
      status: 'ACTIVE',
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    };
  }

  /**
   * Update whitelisted user status or role
   */
  public async updateWhitelistUser(
    id: number,
    data: { role?: string; notes?: string; status?: 'ACTIVE' | 'REVOKED' }
  ): Promise<void> {
    const existing = await sqliteClient.execute({
      sql: 'SELECT * FROM user_whitelist WHERE id = ? LIMIT 1',
      args: [id],
    });

    if (existing.rows.length === 0) {
      throw new ValidationError('User whitelist tidak ditemukan.');
    }

    const user = existing.rows[0];
    const isOwner =
      String(user.email).toLowerCase() === 'ilhamgb11@gmail.com' ||
      String(user.role).toUpperCase() === 'OWNER';

    if (isOwner && data.status === 'REVOKED') {
      throw new ForbiddenError('Akses akun Owner utama tidak dapat dinonaktifkan.');
    }

    const updatedRole = isOwner ? 'OWNER' : (data.role ? data.role.toUpperCase() : String(user.role));
    const updatedNotes = data.notes !== undefined ? data.notes : (user.notes ? String(user.notes) : '');
    const updatedStatus = isOwner ? 'ACTIVE' : (data.status || String(user.status));
    const now = Date.now();

    await sqliteClient.execute({
      sql: `UPDATE user_whitelist 
            SET role = ?, notes = ?, status = ?, updated_at = ?
            WHERE id = ?`,
      args: [updatedRole, updatedNotes, updatedStatus, now, id],
    });
  }

  /**
   * Delete user from whitelist
   */
  public async deleteWhitelistUser(id: number): Promise<void> {
    const existing = await sqliteClient.execute({
      sql: 'SELECT * FROM user_whitelist WHERE id = ? LIMIT 1',
      args: [id],
    });

    if (existing.rows.length === 0) {
      throw new ValidationError('User whitelist tidak ditemukan.');
    }

    const user = existing.rows[0];
    if (
      String(user.email).toLowerCase() === 'ilhamgb11@gmail.com' ||
      String(user.role).toUpperCase() === 'OWNER'
    ) {
      throw new ForbiddenError('Akun Owner utama tidak dapat dihapus dari whitelist.');
    }

    await sqliteClient.execute({
      sql: 'DELETE FROM user_whitelist WHERE id = ?',
      args: [id],
    });
  }
}

export const authService = new AuthService();
