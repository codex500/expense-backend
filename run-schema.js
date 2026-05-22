const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    const sql = fs.readFileSync('schema.sql', 'utf8');
    await client.query(sql);
    console.log('Schema executed successfully');
  } catch (err) {
    console.error('Error executing schema', err);
  } finally {
    await client.end();
  }
}
run();
