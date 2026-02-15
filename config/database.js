/**
 * Database configuration - PostgreSQL (Neon) connection pool
 * Uses pg driver with connection string from environment
 */

const { Pool } = require('pg');

// Neon requires SSL; allow longer timeout for cold start (free tier suspends)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
