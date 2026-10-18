import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './env.js';
import { initializeDatabase } from './db/init.js';
import { sqliteClient } from './db/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { authRouter } from './modules/auth/auth.router.js';

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
