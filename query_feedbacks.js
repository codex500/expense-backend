const { Client } = require('pg');
require('dotenv').config({ path: '/home/divyesh015/Documents/expense-tracker/expense-backend/.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM feedbacks ORDER BY created_at DESC LIMIT 10');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
