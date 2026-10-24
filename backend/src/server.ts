import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './env.js';
import { initializeDatabase } from './db/init.js';
import { sqliteClient } from './db/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { authRouter } from './modules/auth/auth.router.js';
import { marketRouter } from './modules/market/market.router.js';
import { ideasRouter } from './modules/ideas/ideas.router.js';
import { journalRouter } from './modules/journal/journal.router.js';
import { portfolioRouter } from './modules/portfolio/portfolio.router.js';
import { cashflowRouter } from './modules/cashflow/cashflow.router.js';
import { settingsRouter } from './modules/settings/settings.router.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and any origin during development
      if (!origin || env.NODE_ENV === 'development' || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(null, origin === env.CORS_ORIGIN);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Global API rate limiter (300 requests / minute)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again in 1 minute.',
    },
  },
});

// Strict authentication rate limiter (20 attempts / 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
    },
  },
});

// Webhook dispatcher rate limiter (12 dispatches / minute)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
      message: 'Webhook dispatch rate limit exceeded. Please wait a moment.',
    },
  },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/google', authLimiter);
app.use('/api/settings/webhook', webhookLimiter);

// Base healthcheck
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      app: 'CryptoOS Backend API',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: Date.now(),
      env: env.NODE_ENV,
    },
  });
});

// Global API info endpoint
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'CryptoOS API Engine',
      modules: ['auth', 'market', 'exchange', 'ideas', 'journal', 'portfolio', 'cashflow', 'settings'],
      documentation: '/docs/API_SPEC.md',
    },
  });
});

// Authentication Router (Milestone 1)
app.use('/api/auth', authRouter);

// Market Intelligence Router (Milestone 2)
app.use('/api/market', marketRouter);

// Trade Ideas & Pipeline Router (Milestone 3)
app.use('/api/ideas', ideasRouter);

// Trading Journal Router (Milestone 5)
app.use('/api/journal', journalRouter);

// Portfolio Tracker Router (Milestone 6)
app.use('/api/portfolio', portfolioRouter);

// Treasury & Cashflow Router (Milestone 8)
app.use('/api/cashflow', cashflowRouter);

// System Settings & Webhooks Router
app.use('/api/settings', settingsRouter);

// Central Error Handler
app.use(errorHandler);

// Start server after DB initialization
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ SQLite Database schema verified');

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 CryptoOS Backend running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Gracefully shutting down CryptoOS server...');
      server.close(async () => {
        try {
          sqliteClient.close();
          console.log('📦 Database connection closed.');
        } catch (e) {
          console.error('Error closing database:', e);
        }
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
