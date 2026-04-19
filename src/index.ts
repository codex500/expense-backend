/**
 * Expense Tracker API - Entry point
 * Production-ready TypeScript Architecture
 */

import { env } from './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './shared/middleware/errorHandler';
import { apiLimiter } from './shared/middleware/rateLimiter';
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

const app = express();

// Security Middlewares
app.use(helmet());
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

app.use('/api', apiRouter);

// Health Check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
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
  console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  
  // Warm up database connection
  pool.query('SELECT 1')
    .then(() => console.log('✅ Database connected to Supabase Pooler'))
    .catch((err) => console.warn('⚠️ Database connection warning:', err.message));
    
  // Start Cron Jobs
  setupCronJobs();
});
