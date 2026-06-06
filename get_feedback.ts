import { pool } from './src/config/database';

async function main() {
  const result = await pool.query('SELECT * FROM feedbacks ORDER BY created_at DESC LIMIT 10;');
  console.log(JSON.stringify(result.rows, null, 2));
  process.exit(0);
}

main();
