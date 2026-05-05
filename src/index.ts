/**
 * Expense Tracker API - Entry point
 * Production-ready TypeScript Architecture
 */

import { env } from './config/env';

// Handle Uncaught Errors
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './shared/middleware/errorHandler';
import { apiLimiter } from './shared/middleware/rateLimiter';
import compression from 'compression';
import morgan from 'morgan';
import timeout from 'connect-timeout';
import pool from './config/database';
import { setupCronJobs } from './jobs/cron';

// Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import accountRoutes from './modules/accounts/accounts.routes';
import transactionRoutes from './modules/transactions/transactions.routes';
import budgetRoutes from './modules/budgets/budgets.routes';
import salaryRoutes from './modules/salary/salary.module';
import analyticsRoutes from './modules/analytics/analytics.routes';
import advisorRoutes from './modules/advisor/advisor.module';
import notificationRoutes from './modules/notifications/notifications.module';
import contactRoutes from './modules/contact/contact.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app = express();

app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet());
app.use(compression());
app.use(morgan('dev')); // Request logging
app.use(timeout('30s')); // Timeout handling
app.use((req, res, next) => {
  if (!req.timedout) next();
});
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean);
    if (allowed.includes(origin) || origin === env.APP_URL) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Debug Log for Client IP
app.use((req, res, next) => {
  next();
});

// Global Rate Limiter
app.use('/api/', apiLimiter);

// API Routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/accounts', accountRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/budgets', budgetRoutes);
apiRouter.use('/salary', salaryRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/advisor', advisorRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/contact', contactRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

app.use('/api', apiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.send("OK");
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Expense Tracker API v2',
    version: '2.0.0',
    docs: '/api/docs'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(env.PORT, '0.0.0.0', () => {
  console.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  
  // Warm up database connection
  pool.query('SELECT 1')
    .then(() => console.info('✅ Database connected to Supabase Pooler'))
    .catch((err) => console.warn('⚠️ Database connection warning:', err.message));
    
  // Start Cron Jobs
  setupCronJobs();
});
