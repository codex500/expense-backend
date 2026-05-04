import { query } from '../../config/database';

export class DashboardService {
  async getSummary(userId: string) {
    const sql = `
      WITH stats AS (
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END) AS total_expense
        FROM transactions
        WHERE user_id = $1
      ),
      balance AS (
        SELECT SUM(current_balance_paise) AS total_balance
        FROM accounts
        WHERE user_id = $1 AND is_active = true
      ),
      recent AS (
        SELECT json_agg(t) AS recent_transactions
        FROM (
          SELECT * FROM transactions 
          WHERE user_id = $1 
          ORDER BY transaction_date DESC, created_at DESC 
          LIMIT 5
        ) t
      ),
      weekly AS (
        SELECT json_agg(w) AS weekly_data
        FROM (
          SELECT 
            DATE_TRUNC('week', transaction_date) AS week,
            SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END) AS income,
            SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END) AS expense
          FROM transactions
          WHERE user_id = $1 AND transaction_date >= CURRENT_DATE - INTERVAL '1 month'
          GROUP BY week
          ORDER BY week DESC
        ) w
      )
      SELECT 
        COALESCE((SELECT total_income FROM stats), 0) AS "totalIncome",
        COALESCE((SELECT total_expense FROM stats), 0) AS "totalExpense",
        COALESCE((SELECT total_balance FROM balance), 0) AS "balance",
        COALESCE((SELECT recent_transactions FROM recent), '[]'::json) AS "recentTransactions",
        COALESCE((SELECT weekly_data FROM weekly), '[]'::json) AS "weeklyData"
    `;

    const { rows } = await query(sql, [userId]);
    const row = rows[0];

    // PostgreSQL returns SUM(bigint) as strings — parse to numbers
    return {
      totalIncome: Number(row.totalIncome) || 0,
      totalExpense: Number(row.totalExpense) || 0,
      balance: Number(row.balance) || 0,
      recentTransactions: (row.recentTransactions || []).map((t: any) => ({
        ...t,
        amount_paise: Number(t.amount_paise) || 0,
      })),
      weeklyData: (row.weeklyData || []).map((w: any) => ({
        week: w.week,
        income: Number(w.income) || 0,
        expense: Number(w.expense) || 0,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
