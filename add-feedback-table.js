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
    
    const query = `
      CREATE TABLE IF NOT EXISTS public.feedbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        category TEXT,
        message TEXT NOT NULL,
        device_info JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    await client.query(query);
    console.log('feedbacks table created successfully');
  } catch (err) {
    console.error('Error creating feedbacks table:', err);
  } finally {
    await client.end();
  }
}
run();
