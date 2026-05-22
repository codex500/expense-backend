/**
 * Dashboard service — aggregated summary data for the home screen.
 * Uses a single optimized query batch instead of multiple round trips.
 */

import { query } from '../../config/database';
import { percentageChange } from '../../shared/utils/money';

export class DashboardService {

  async getSummary(userId: string) {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.toISOString().slice(0, 7) + '-01';

    // Execute all queries in parallel
    const [
      accountsResult,
      currentMonthResult,
      prevMonthResult,
      recentTxnResult,
      budgetResult,
    ] = await Promise.all([
      // Total balance across all active accounts
      query<{ total_balance: string }>(
        `SELECT COALESCE(SUM(current_balance_paise), 0) AS total_balance 
         FROM accounts WHERE user_id = $1 AND is_active = true`,
        [userId]
      ),
      // Current month income + expense
      query<{ type: string; total: string; count: string }>(
        `SELECT type, COALESCE(SUM(amount_paise), 0) AS total, COUNT(*) AS count
         FROM transactions 
         WHERE user_id = $1 AND transaction_date >= $2 AND transaction_date < ($2::date + INTERVAL '1 month')::date
         GROUP BY type`,
        [userId, currentMonth]
      ),
      // Previous month income + expense (for comparison)
      query<{ type: string; total: string }>(
        `SELECT type, COALESCE(SUM(amount_paise), 0) AS total
         FROM transactions 
         WHERE user_id = $1 AND transaction_date >= $2 AND transaction_date < ($2::date + INTERVAL '1 month')::date
         GROUP BY type`,
        [userId, prevMonth]
      ),
      // Recent transactions (last 5)
      query(
        `SELECT t.*, a.account_name, a.type AS account_type
         FROM transactions t
         LEFT JOIN accounts a ON t.account_id = a.id
         WHERE t.user_id = $1
         ORDER BY t.transaction_date DESC, t.created_at DESC
         LIMIT 5`,
        [userId]
      ),
      // Current month budget status
      query<{ amount_paise: string; scope: string }>(
        `SELECT amount_paise, scope FROM budgets
         WHERE user_id = $1 AND month = $2 AND scope = 'overall'
         LIMIT 1`,
        [userId, currentMonth]
      ),
    ]);

    // Process current month
    const currentIncome = Number(currentMonthResult.rows.find(r => r.type === 'income')?.total || 0);
    const currentExpense = Number(currentMonthResult.rows.find(r => r.type === 'expense')?.total || 0);
    const transactionCount = currentMonthResult.rows.reduce((sum, r) => sum + Number(r.count), 0);

    // Process previous month
    const prevIncome = Number(prevMonthResult.rows.find(r => r.type === 'income')?.total || 0);
    const prevExpense = Number(prevMonthResult.rows.find(r => r.type === 'expense')?.total || 0);

    // Budget info
    const overallBudget = budgetResult.rows[0] ? Number(budgetResult.rows[0].amount_paise) : 0;
    const budgetUsedPercent = overallBudget > 0 ? Math.round((currentExpense / overallBudget) * 100) : 0;

    return {
      totalBalancePaise: Number(accountsResult.rows[0].total_balance),
      currentMonth: {
        incomePaise: currentIncome,
        expensePaise: currentExpense,
        savingsPaise: currentIncome - currentExpense,
        transactionCount,
      },
      comparison: {
        incomeChange: percentageChange(currentIncome, prevIncome),
        expenseChange: percentageChange(currentExpense, prevExpense),
      },
      budget: overallBudget > 0 ? {
        amountPaise: overallBudget,
        spentPaise: currentExpense,
        remainingPaise: Math.max(0, overallBudget - currentExpense),
        percentUsed: budgetUsedPercent,
      } : null,
      recentTransactions: recentTxnResult.rows.map((row) => ({
        id: row.id,
        type: row.type,
        category: row.category,
        amountPaise: Number(row.amount_paise),
        note: row.note,
        transactionDate: row.transaction_date,
        accountName: row.account_name,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
