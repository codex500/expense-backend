/**
 * Budget Alert Service - Check and send alerts when budget exceeds 80%
 */

const pool = require('../config/database');
const { sendBudgetAlertEmail } = require('./emailService');
const Transaction = require('../models/Transaction');

/**
 * Check and send budget alerts for all users
 * Called periodically (e.g., daily or after transactions)
 */
async function checkBudgetAlerts() {
  if (process.env.EMAIL_ENABLED !== 'true') return;

  try {
    // Get users with budget_limit set
    const usersResult = await pool.query(
      'SELECT id, email, name, budget_limit FROM users WHERE budget_limit > 0'
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    for (const user of usersResult.rows) {
      try {
        const monthlyExpense = await Transaction.totalExpense(
          user.id,
          startOfMonth.toISOString().slice(0, 10),
          endOfMonth.toISOString().slice(0, 10)
        );

        const percentUsed = (monthlyExpense / user.budget_limit) * 100;

        // Send alert if >= 80% and not already alerted today
        if (percentUsed >= 80) {
          const alreadyAlerted = await pool.query(
            'SELECT 1 FROM email_logs WHERE user_id = $1 AND sent_date = CURRENT_DATE LIMIT 1',
            [user.id]
          );

          if (alreadyAlerted.rows.length === 0) {
            await sendBudgetAlertEmail(user.email, user.name, monthlyExpense, user.budget_limit);
            // Log alert as email sent
            await pool.query(
              'INSERT INTO email_logs (user_id, sent_date) VALUES ($1, CURRENT_DATE) ON CONFLICT DO NOTHING',
              [user.id]
            );
          }
        }
      } catch (err) {
        console.error(`[BudgetAlert] Error for user ${user.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[BudgetAlert] Error:', err.message);
  }
}

module.exports = { checkBudgetAlerts };
