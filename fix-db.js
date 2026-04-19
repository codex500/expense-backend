const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL + '?sslmode=require' });
async function run() {
  try {
    await pool.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20), ADD COLUMN IF NOT EXISTS dob DATE, ADD COLUMN IF NOT EXISTS gender VARCHAR(20), ADD COLUMN IF NOT EXISTS pan_card TEXT;`);
    console.log("Columns added successfully");
  } catch (e) { console.error(e); }
  finally { pool.end(); }
}
run();
