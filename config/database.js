/**
 * Database configuration - PostgreSQL (Neon) connection pool
 * Uses pg driver with connection string from environment
 */

const { Pool } = require('pg');

// Neon: use -pooler host for serverless (Render). Long timeout for cold start (free tier suspends).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 60000,
  allowExitOnIdle: false,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
