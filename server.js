/**
 * Expense Tracker API - Entry point
 * Production-ready for Render + Neon PostgreSQL
 */

require('dotenv').config();

const { validateEnv } = require('./config/env');
validateEnv();

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const pool = require('./config/database');
const { startReminderJobs } = require('./jobs/reminderJobs');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow frontend and Postman; preflight
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes (must be under /api)
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/categories', categoryRoutes);

// Health (for Render and load balancers)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.json({
    message: 'Expense Tracker API',
    base: `${base}/api`,
    endpoints: {
      auth: `${base}/api/auth/register, ${base}/api/auth/login, ${base}/api/auth/me`,
      transactions: `${base}/api/transactions`,
      dashboard: `${base}/api/dashboard`,
      budget: `${base}/api/budget`,
      analytics: `${base}/api/analytics/*`,
      categories: `${base}/api/categories`,
    },
    health: `${base}/health`,
  });
});

// 404 - must be before error handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler (must be last, 4 args)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Expense Tracker API running on port ${PORT}`);
  pool.query('SELECT 1').then(() => console.log('Database warmup OK')).catch((err) => console.warn('Database warmup:', err.message));
  startReminderJobs();
});
