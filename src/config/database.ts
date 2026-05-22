/**
 * PostgreSQL connection pool (pg / node-postgres)
 * Compatible with Supabase Transaction Pooler.
 * Forces IPv4 to prevent ENETUNREACH on cloud hosts.
 */

import { Pool, PoolClient } from 'pg';
import dns from 'dns';
import { env } from './env';

// Force IPv4 DNS — Supabase hosts may resolve to IPv6 first
dns.setDefaultResultOrder('ipv4first');

let connectionString = env.DATABASE_URL.replace(/^["']|["']$/g, '');

if (connectionString.startsWith('postgres://')) {
  connectionString = 'postgresql://' + connectionString.slice(11);
}

if (!connectionString.startsWith('postgresql://')) {
  throw new Error('DATABASE_URL must start with postgresql:// or postgres://');
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err.message);
});

/**
 * Execute a parameterized query.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const result = await pool.query(text, params);
  return { rows: result.rows as T[], rowCount: result.rowCount };
}

/**
 * Get a client from the pool for manual transaction management.
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Execute a function within a database transaction.
 * Uses READ COMMITTED by default (sufficient with FOR UPDATE locks).
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
  isolationLevel: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' = 'READ COMMITTED'
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
