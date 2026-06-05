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
    
    // Create the device_tokens table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.device_tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        token       TEXT NOT NULL,
        device_type TEXT NOT NULL DEFAULT 'android',
        is_active   BOOLEAN NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ DEFAULT now(),
        updated_at  TIMESTAMPTZ DEFAULT now(),
        UNIQUE (user_id, token)
      );
    `;
    await client.query(createTableQuery);
    console.log('device_tokens table created successfully');

    // Create indexes
    const createIndexQuery1 = `CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.device_tokens (user_id, is_active);`;
    await client.query(createIndexQuery1);
    
    const createIndexQuery2 = `CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON public.device_tokens (token);`;
    await client.query(createIndexQuery2);
    console.log('Indexes created successfully');

    // Attempt to create the update_updated_at trigger function if it doesn't exist
    const createFuncQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = now(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `;
    await client.query(createFuncQuery);

    // Create trigger for device_tokens
    const createTriggerQuery = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_device_tokens') THEN
          CREATE TRIGGER set_updated_at_device_tokens
          BEFORE UPDATE ON public.device_tokens
          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        END IF;
      END
      $$;
    `;
    await client.query(createTriggerQuery);
    console.log('Trigger created successfully');

  } catch (err) {
    console.error('Error creating device_tokens table:', err);
  } finally {
    await client.end();
  }
}
run();
