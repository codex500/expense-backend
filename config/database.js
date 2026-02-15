/**
 * Database configuration - Neon serverless driver (HTTP/WebSocket)
 * Avoids TCP timeouts when connecting from Render to Neon
 */

const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Node.js needs explicit WebSocket for Neon Pool
neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 60000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
