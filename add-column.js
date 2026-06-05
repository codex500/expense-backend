const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query('ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS push_token TEXT;');
    console.log('push_token column added successfully');
  } catch (err) {
    console.error('Error adding column', err);
  } finally {
    await client.end();
  }
}
run();
