import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or local backend
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback to backend/.env

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_PATH: z.string().default('./data/cryptoos.db'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().default('cryptoos-dev-insecure-secret-key-change-in-production-12345'),
  MASTER_PASSWORD_HASH: z.string().optional(),

  // Public Portfolio Guest Demo Mode (Safe & Self-Healing Showcase Sandbox)
  DEMO_MODE: z
    .union([z.boolean(), z.string()])
    .optional()
    .default(false)
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      const str = String(val).toLowerCase().trim();
      return str === 'true' || str === '1' || str === 'yes';
    }),

  // Administrative Access Configuration (Configured via ENV)
  OWNER_EMAIL: z.string().default('ilhamgb11@gmail.com'),
  ADMIN_EMAILS: z.string().default('ilhamgb11@gmail.com'),
  
  // Google Cloud & OAuth Services (Web OAuth Credentials)
  GOOGLE_CLIENT_ID: z.string().optional().default('973014592409-t4v36qps5lh2rrc7pqjv3ebtvuek4fb3.apps.googleusercontent.com'),
  GOOGLE_CLIENT_SECRET: z.string().optional().default('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'),
  GOOGLE_PROJECT_ID: z.string().optional().default('idyllic-lattice-434108-s8'),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional().default('./CryptoOS-GAService.json'),

  // Exchange API credentials (optional - Global & Indonesian Local)
  BINANCE_API_KEY: z.string().optional().default(''),
  BINANCE_API_SECRET: z.string().optional().default(''),
  BYBIT_API_KEY: z.string().optional().default(''),
  BYBIT_API_SECRET: z.string().optional().default(''),
  OKX_API_KEY: z.string().optional().default(''),
  OKX_API_SECRET: z.string().optional().default(''),
  OKX_PASSPHRASE: z.string().optional().default(''),
  MEXC_API_KEY: z.string().optional().default(''),
  MEXC_API_SECRET: z.string().optional().default(''),
  INDODAX_API_KEY: z.string().optional().default(''),
  INDODAX_API_SECRET: z.string().optional().default(''),
  TOKOCRYPTO_API_KEY: z.string().optional().default(''),
  TOKOCRYPTO_API_SECRET: z.string().optional().default(''),
  TRIV_API_KEY: z.string().optional().default(''),
  TRIV_API_SECRET: z.string().optional().default(''),
  KUCOIN_API_KEY: z.string().optional().default(''),
  KUCOIN_API_SECRET: z.string().optional().default(''),
  KUCOIN_PASSPHRASE: z.string().optional().default(''),
  GATEIO_API_KEY: z.string().optional().default(''),
  GATEIO_API_SECRET: z.string().optional().default(''),
  BITGET_API_KEY: z.string().optional().default(''),
  BITGET_API_SECRET: z.string().optional().default(''),
  BITGET_PASSPHRASE: z.string().optional().default(''),
  
  // Market APIs (optional)
  FRED_API_KEY: z.string().optional().default(''),
  ALPHA_VANTAGE_KEY: z.string().optional().default(''),
  EXCHANGERATE_API_KEY: z.string().optional().default(''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
