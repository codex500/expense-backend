/**
 * Database Migration Script
 * Reads schema.sql and runs it against the Supabase database.
 */

import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';

async function runMigrations() {
    console.log('Running database migrations...');
    const client = await pool.connect();

    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Drop old tables that are incompatible with the new schema
        console.log('Cleaning up old schema...');
        await client.query(`
            DROP TABLE IF EXISTS user_streaks CASCADE;
            DROP TABLE IF EXISTS email_logs CASCADE;
            DROP TABLE IF EXISTS transactions CASCADE;
            DROP TABLE IF EXISTS categories CASCADE;
            DROP TABLE IF EXISTS budgets CASCADE;
            DROP TABLE IF EXISTS salary_entries CASCADE;
            DROP TABLE IF EXISTS notifications CASCADE;
            DROP TABLE IF EXISTS accounts CASCADE;
            DROP TABLE IF EXISTS audit_logs CASCADE;
            DROP TABLE IF EXISTS user_profiles CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
        `);

        // Execute schema
        await client.query(schemaSql);

        console.log('✅ Migrations completed successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
