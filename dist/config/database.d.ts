/**
 * PostgreSQL connection pool (pg / node-postgres)
 * Compatible with Supabase Transaction Pooler.
 * Forces IPv4 to prevent ENETUNREACH on Render/Railway.
 */
import { Pool, PoolClient } from 'pg';
export declare const pool: Pool;
/**
 * Execute a query with parameterized values.
 */
export declare function query<T = any>(text: string, params?: any[]): Promise<{
    rows: T[];
    rowCount: number | null;
}>;
/**
 * Get a client from the pool for manual transaction management.
 * ALWAYS release the client in a finally block.
 */
export declare function getClient(): Promise<PoolClient>;
/**
 * Execute a function within a database transaction.
 * Automatically begins, commits on success, rolls back on error.
 * Uses SERIALIZABLE isolation for money-critical operations.
 */
export declare function withTransaction<T>(fn: (client: PoolClient) => Promise<T>, isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE'): Promise<T>;
export default pool;
//# sourceMappingURL=database.d.ts.map