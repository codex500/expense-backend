/**
 * Run schema.sql + migrations.sql against the Supabase PostgreSQL database
 * Usage: node database/runSchema.js   or  npm run db:setup
 */
require('dotenv').config();
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  // Run base schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('✅ Schema applied: users, transactions, categories');

  // Run migrations
  const migrations = fs.readFileSync(path.join(__dirname, 'migrations.sql'), 'utf8');
  await pool.query(migrations);
  console.log('✅ Migrations applied: email_logs, user_streaks, budget_limit');

  console.log('✅ Database setup complete (Supabase PostgreSQL)');
  await pool.end();
}

run().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
