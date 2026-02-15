/**
 * Database - Neon over HTTP (no WebSocket). Works from Render without 404/timeouts.
 * Exposes a pool-like API so models stay unchanged.
 */

const { neon } = require('@neondatabase/serverless');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

// fullResults: true so return value has .rows like node-postgres
const sql = neon(connectionString, { fullResults: true });

const pool = {
  async query(text, params = []) {
    const result = await sql.query(text, params);
    return result;
  },
  end() {
    // No-op for HTTP (no persistent connection)
  },
};

module.exports = pool;
