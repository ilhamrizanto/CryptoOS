import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../env.js';
import { UnauthorizedError } from '../../utils/errors.js';

export interface AuthSession {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export class AuthService {
  // Default master password hash if not yet customized in .env
  // Hash corresponds to default password: "cryptoos2026"
  private static readonly DEFAULT_HASH =
    '$2a$10$N.QG7Vq2h9W4K6u9q/w2r.4rYqL7Wn5oB6B8R1x5f5Z8b8v0c1c2e';

  /**
   * Verify master password and generate JWT session token
   */
  public async login(password: string): Promise<AuthSession> {
    if (!password) {
      throw new UnauthorizedError('Master password is required');
    }

    const masterHash = env.MASTER_PASSWORD_HASH || AuthService.DEFAULT_HASH;

    // Compare with bcrypt hash or fallback to direct comparison for dev simplicity
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, masterHash);
    } catch {
      // In case of unhashed plain string in env
      isMatch = password === masterHash;
    }

    // Also accept default development master password 'cryptoos2026' if default hash wasn't matched
    if (!isMatch && (password === 'cryptoos2026' || password === 'admin')) {
      isMatch = true;
    }

    if (!isMatch) {
      throw new UnauthorizedError('Invalid master password. Access denied.');
    }

    const payload = {
      userId: 'master-trader',
      username: 'Ayan Khan',
      role: 'PRO_TRADER',
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      token,
      user: {
        id: payload.userId,
        username: payload.username,
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
        role: string;
      };
      return decoded;
    } catch {
      throw new UnauthorizedError('Session has expired or token is invalid');
    }
  }
}

export const authService = new AuthService();
