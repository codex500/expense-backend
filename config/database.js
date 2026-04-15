/**
 * PostgreSQL connection pool (pg / node-postgres)
 * Compatible with Supabase and any PostgreSQL connection string.
 * Forces IPv4 to prevent ENETUNREACH errors on Render/Railway.
 */

const { Pool } = require('pg');
const dns = require('dns');

// Force IPv4 DNS resolution (Supabase direct hosts resolve to IPv6,
// which is unreachable from Render/Railway free tier)
dns.setDefaultResultOrder('ipv4first');

let connectionString = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '');
if (!connectionString) {
  throw new Error('DATABASE_URL is required.');
}
if (connectionString.startsWith('https://') || connectionString.includes('/rest/')) {
  throw new Error(
    'DATABASE_URL must be a Postgres connection string (postgresql://user:password@host/db), not a REST/API URL.'
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
