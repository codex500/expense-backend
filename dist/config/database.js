"use strict";
/**
 * PostgreSQL connection pool (pg / node-postgres)
 * Compatible with Supabase Transaction Pooler.
 * Forces IPv4 to prevent ENETUNREACH on Render/Railway.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.getClient = getClient;
exports.withTransaction = withTransaction;
const pg_1 = require("pg");
const dns_1 = __importDefault(require("dns"));
const env_1 = require("./env");
// Force IPv4 DNS — Supabase hosts may resolve to IPv6 first
dns_1.default.setDefaultResultOrder('ipv4first');
let connectionString = env_1.env.DATABASE_URL.replace(/^[\"']|[\"']$/g, '');
if (connectionString.startsWith('postgres://')) {
    connectionString = 'postgresql://' + connectionString.slice(11);
}
if (!connectionString.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must start with postgresql:// or postgres://');
}
exports.pool = new pg_1.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
});
exports.pool.on('error', (err) => {
    console.error('[DB] Pool error:', err.message);
});
/**
 * Execute a query with parameterized values.
 */
async function query(text, params) {
    const result = await exports.pool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
}
/**
 * Get a client from the pool for manual transaction management.
 * ALWAYS release the client in a finally block.
 */
async function getClient() {
    return exports.pool.connect();
}
/**
 * Execute a function within a database transaction.
 * Automatically begins, commits on success, rolls back on error.
 * Uses SERIALIZABLE isolation for money-critical operations.
 */
async function withTransaction(fn, isolationLevel = 'SERIALIZABLE') {
    const client = await exports.pool.connect();
    try {
        await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
exports.default = exports.pool;
//# sourceMappingURL=database.js.map