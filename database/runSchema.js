/**
 * Run schema.sql against the database (uses .env DATABASE_URL)
 * Uses pg (TCP) so multi-statement schema runs correctly. App uses Neon HTTP.
 * Usage: node database/runSchema.js   or  npm run db:setup
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 60000,
  });
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('Schema applied successfully. Tables: users, transactions, categories');
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Schema failed:', err.message);
  process.exit(1);
});
