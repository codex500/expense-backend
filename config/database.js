/**
 * PostgreSQL connection pool (pg / node-postgres)
 * For Neon: use DATABASE_URL with SSL. Compatible with Render.
 */

const { Pool } = require('pg');

let connectionString = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '');
if (!connectionString) {
  throw new Error('DATABASE_URL is required.');
}
if (connectionString.startsWith('https://') || connectionString.includes('apirest') || connectionString.includes('/rest/')) {
  throw new Error(
    'DATABASE_URL must be a Postgres connection string (postgresql://user:password@host/db?sslmode=require), not the Neon REST/API URL.'
  );
}
if (connectionString.startsWith('postgres://')) {
  connectionString = 'postgresql://' + connectionString.slice(11);
}
if (!connectionString.startsWith('postgresql://')) {
  throw new Error('DATABASE_URL must start with postgresql:// or postgres://');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
});

module.exports = pool;
