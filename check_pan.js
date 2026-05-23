const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.tovereipbychthkworys:R3cb5dS4dm6yTjiE@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', ssl: { rejectUnauthorized: false } });
async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'pan_card'
  `);
  console.log("Column exists:", res.rows.length > 0);
  if (res.rows.length === 0) {
    console.log("Adding column...");
    await client.query("ALTER TABLE user_profiles ADD COLUMN pan_card TEXT;");
    console.log("Added column.");
  }
  await client.end();
}
check().catch(console.error);
