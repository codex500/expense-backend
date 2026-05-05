import fs from 'fs';
import path from 'path';
import { query } from './src/config/database';

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'src/database/migrations/v3.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running v3 migration...');
    await query(sql);
    console.log('Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
