const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.tovereipbychthkworys:R3cb5dS4dm6yTjiE@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', ssl: { rejectUnauthorized: false } });
async function check() {
  await client.connect();
  const res = await client.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5');
  console.log("Transactions:", res.rows);
  const acc = await client.query('SELECT * FROM accounts ORDER BY created_at DESC LIMIT 5');
  console.log("Accounts:", acc.rows);
  await client.end();
}
check().catch(console.error);
