const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query('ALTER TABLE user_profiles RENAME COLUMN pan_card TO pan_number');
    console.log('Renamed pan_card to pan_number');
  } catch(e) { console.log(e.message); }
  
  try {
    await pool.query('ALTER TABLE user_profiles RENAME COLUMN mobile_number TO phone_number');
    console.log('Renamed mobile_number to phone_number');
  } catch(e) { console.log(e.message); }
  
  try {
    await pool.query('ALTER TABLE user_profiles DROP COLUMN phone');
    console.log('Dropped unused phone column');
  } catch(e) { console.log(e.message); }

  await pool.end();
}
run();
