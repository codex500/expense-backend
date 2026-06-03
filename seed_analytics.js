const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Get a user ID for test@trackifyapp.space
    const userRes = await client.query("SELECT id FROM public.user_profiles WHERE email = 'test@trackifyapp.space' LIMIT 1");
    if (userRes.rows.length === 0) {
      console.log('No user found for test@trackifyapp.space');
      return;
    }
    const userId = userRes.rows[0].id;
    
    // Get an account ID
    const accountRes = await client.query('SELECT id FROM public.accounts WHERE user_id = $1 LIMIT 1', [userId]);
    let accountId = null;
    if (accountRes.rows.length > 0) {
      accountId = accountRes.rows[0].id;
    } else {
      console.log('No account found for user, creating one.');
      const newAcc = await client.query('INSERT INTO public.accounts (user_id, account_name, type) VALUES ($1, $2, $3) RETURNING id', [userId, 'Main Bank', 'bank']);
      accountId = newAcc.rows[0].id;
    }

    console.log(`Seeding data for user: ${userId}, account: ${accountId}`);

    // Delete old transactions for a clean slate (optional, but good for testing)
    await client.query('DELETE FROM public.transactions WHERE user_id = $1', [userId]);

    // Generate transactions for the last 6 months
    const categories = ['Groceries', 'Rent', 'Travel', 'Entertainment', 'Subscription', 'Utilities'];
    
    let queryParams = [];
    let values = [];
    let count = 1;

    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() - monthOffset);
      
      // Income for the month
      for (let i = 0; i < 2; i++) {
        const date = new Date(baseDate);
        date.setDate(1 + i * 15);
        queryParams.push(`($${count++}, $${count++}, $${count++}, $${count++}, $${count++}, $${count++})`);
        values.push(
          userId, 
          accountId,
          i === 0 ? 500000 : 300000, // 5000 / 3000 in paise
          'income', 
          'Salary', 
          date.toISOString()
        );
      }

      // Expenses for the month (20 entries)
      for (let i = 0; i < 20; i++) {
        const date = new Date(baseDate);
        date.setDate(Math.floor(Math.random() * 28) + 1);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const amount = Math.floor(Math.random() * 10000) + 1000; // 10 to 100 in paise
        
        queryParams.push(`($${count++}, $${count++}, $${count++}, $${count++}, $${count++}, $${count++})`);
        values.push(
          userId, 
          accountId,
          amount, 
          'expense', 
          category, 
          date.toISOString()
        );
      }
    }

    const insertQuery = `
      INSERT INTO public.transactions (user_id, account_id, amount_paise, type, category, transaction_date)
      VALUES ${queryParams.join(', ')}
    `;

    await client.query(insertQuery, values);
    console.log('Successfully seeded analytics transactions.');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.end();
  }
}

seed();
