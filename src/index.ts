/**
 * Trackify API v4 — Production Entry Point
 *
 * Architecture: Express + Supabase Auth + PostgreSQL (via pg pool)
 * Auth: Supabase JWT only — no custom JWT generation
 * Database: Direct pg pool (Supabase Transaction Pooler on :6543)
 */

import dns from 'dns';
// Force IPv4 DNS resolution — prevents ENETUNREACH on Render/cloud hosts
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { pool } from './config/database';
import { errorHandler } from './shared/middleware/errorHandler';
import { apiLimiter } from './shared/middleware/rateLimiter';
import { setupCronJobs } from './jobs/cron';

// Module route imports
import authRoutes from './modules/auth/auth.routes';
import accountsRoutes from './modules/accounts/accounts.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';
import budgetsRoutes from './modules/budgets/budgets.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import advisorRoutes from './modules/advisor/advisor.routes';
import contactRoutes from './modules/contact/contact.routes';

const app = express();

// ═══════════════════════════════════════════════════════════
// GLOBAL MIDDLEWARE
// ═══════════════════════════════════════════════════════════

// Trust proxy for Render / Cloudflare (MUST be first)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// Response compression
app.use(compression());

// CORS
const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.length === 0 || allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request logging
if (!env.IS_PRODUCTION) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api/', apiLimiter);

// ═══════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════
app.get('/health', async (_req, res) => {
  try {
    const dbCheck = await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      version: '4.0.0',
      timestamp: new Date().toISOString(),
      database: dbCheck ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    });
  } catch {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// ═══════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/contact', contactRoutes);

// ═══════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
    code: 'NOT_FOUND',
  });
});

// ═══════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════
const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.info(`
╔══════════════════════════════════════════════╗
║           TRACKIFY API v4.0.0                ║
║──────────────────────────────────────────────║
║  Port:      ${String(PORT).padEnd(33)}║
║  Env:       ${env.NODE_ENV.padEnd(33)}║
║  Database:  Supabase PostgreSQL              ║
║  Auth:      Supabase Auth (JWT)              ║
╚══════════════════════════════════════════════╝
  `);

  // Setup cron jobs after server starts
  setupCronJobs();
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.info(`\n[${signal}] Shutting down gracefully...`);
  server.close(async () => {
    try {
      await pool.end();
      console.info('[Shutdown] Database pool closed.');
    } catch (err) {
      console.error('[Shutdown] Error closing pool:', err);
    }
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[Shutdown] Forced exit after timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled errors
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UncaughtException]', error);
  gracefulShutdown('UncaughtException');
});

export default app;
