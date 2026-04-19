"use strict";
/**
 * Database Migration Script
 * Reads schema.sql and runs it against the Supabase database.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
async function runMigrations() {
    console.log('Running database migrations...');
    const client = await database_1.pool.connect();
    try {
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf8');
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
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
    }
    finally {
        client.release();
        await database_1.pool.end();
    }
}
runMigrations();
//# sourceMappingURL=migrate.js.map