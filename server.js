/**
 * Expense Tracker API - Entry point
 * MVC backend with Express, PostgreSQL (Neon), JWT
 */

require('dotenv').config();
const express = require('express');
const { validateEnv } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/categories', categoryRoutes);


app.get("/", (req, res) => {
  res.send("API is running");
});

// Health check (for Render / load balancers)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root: show API base (avoids 404 when someone hits the wrong URL)
app.get('/', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.json({
    message: 'Expense Tracker API',
    base: `${base}/api`,
    endpoints: {
      auth: `${base}/api/auth/register, /api/auth/login, /api/auth/me`,
      transactions: `${base}/api/transactions`,
      dashboard: `${base}/api/dashboard`,
      budget: `${base}/api/budget`,
      analytics: `${base}/api/analytics/*`,
      categories: `${base}/api/categories`,
    },
    health: `${base}/health`,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Expense Tracker API running on port ${PORT}`);
});
