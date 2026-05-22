/**
 * Analytics service — spending trends, category breakdowns, and insights.
 */

import { query } from '../../config/database';
import { percentageChange } from '../../shared/utils/money';

export class AnalyticsService {

  async getAnalytics(userId: string, months: number = 6) {
    // Monthly trend data
    const { rows: monthlyData } = await query<{
      month: string;
      type: string;
      total: string;
      count: string;
    }>(
      `SELECT 
         DATE_TRUNC('month', transaction_date)::date AS month,
         type,
         COALESCE(SUM(amount_paise), 0) AS total,
         COUNT(*) AS count
       FROM transactions
       WHERE user_id = $1 
         AND transaction_date >= (CURRENT_DATE - ($2 * INTERVAL '1 month'))::date
       GROUP BY month, type
       ORDER BY month ASC`,
      [userId, months]
    );

    // Category breakdown for current month
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const { rows: categoryData } = await query<{
      category: string;
      total: string;
      count: string;
    }>(
      `SELECT category, COALESCE(SUM(amount_paise), 0) AS total, COUNT(*) AS count
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
         AND transaction_date >= $2 
         AND transaction_date < ($2::date + INTERVAL '1 month')::date
       GROUP BY category
       ORDER BY total DESC`,
      [userId, currentMonth]
    );

    // Top spending categories (all time)
    const { rows: topCategories } = await query<{
      category: string;
      total: string;
      count: string;
    }>(
      `SELECT category, COALESCE(SUM(amount_paise), 0) AS total, COUNT(*) AS count
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       GROUP BY category
       ORDER BY total DESC
       LIMIT 5`,
      [userId]
    );

    // Daily spending for current month
    const { rows: dailySpending } = await query<{
      day: string;
      total: string;
    }>(
      `SELECT transaction_date AS day, COALESCE(SUM(amount_paise), 0) AS total
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
         AND transaction_date >= $2 
         AND transaction_date < ($2::date + INTERVAL '1 month')::date
       GROUP BY transaction_date
       ORDER BY transaction_date ASC`,
      [userId, currentMonth]
    );

    // Build monthly trend array
    const monthlyTrend = new Map<string, { income: number; expense: number; savings: number }>();
    for (const row of monthlyData) {
      const key = String(row.month);
      if (!monthlyTrend.has(key)) {
        monthlyTrend.set(key, { income: 0, expense: 0, savings: 0 });
      }
      const entry = monthlyTrend.get(key)!;
      if (row.type === 'income') entry.income = Number(row.total);
      if (row.type === 'expense') entry.expense = Number(row.total);
      entry.savings = entry.income - entry.expense;
    }

    // Total expense for percentage calculations
    const totalExpense = categoryData.reduce((sum, r) => sum + Number(r.total), 0);

    return {
      monthlyTrend: Array.from(monthlyTrend.entries()).map(([month, data]) => ({
        month,
        ...data,
      })),
      categoryBreakdown: categoryData.map((r) => ({
        category: r.category,
        amountPaise: Number(r.total),
        transactionCount: Number(r.count),
        percentage: totalExpense > 0 ? Math.round((Number(r.total) / totalExpense) * 100) : 0,
      })),
      topCategories: topCategories.map((r) => ({
        category: r.category,
        totalPaise: Number(r.total),
        count: Number(r.count),
      })),
      dailySpending: dailySpending.map((r) => ({
        date: r.day,
        amountPaise: Number(r.total),
      })),
    };
  }

  async getCategoryAnalytics(userId: string, monthStr?: string) {
    const targetMonth = monthStr ? `${monthStr}-01` : new Date().toISOString().slice(0, 7) + '-01';
    const { rows: categoryData } = await query<{
      category: string;
      total: string;
      count: string;
    }>(
      `SELECT category, COALESCE(SUM(amount_paise), 0) AS total, COUNT(*) AS count
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
         AND transaction_date >= $2 
         AND transaction_date < ($2::date + INTERVAL '1 month')::date
       GROUP BY category
       ORDER BY total DESC`,
      [userId, targetMonth]
    );

    const totalExpense = categoryData.reduce((sum, r) => sum + Number(r.total), 0);

    return categoryData.map((r) => ({
      category: r.category,
      amountPaise: Number(r.total),
      transactionCount: Number(r.count),
      percentage: totalExpense > 0 ? Math.round((Number(r.total) / totalExpense) * 100) : 0,
    }));
  }

  async getMonthlyAnalytics(userId: string, months: number = 6) {
    const { rows: monthlyData } = await query<{
      month: string;
      type: string;
      total: string;
      count: string;
    }>(
      `SELECT 
         DATE_TRUNC('month', transaction_date)::date AS month,
         type,
         COALESCE(SUM(amount_paise), 0) AS total,
         COUNT(*) AS count
       FROM transactions
       WHERE user_id = $1 
         AND transaction_date >= (CURRENT_DATE - ($2 * INTERVAL '1 month'))::date
       GROUP BY month, type
       ORDER BY month ASC`,
      [userId, months]
    );

    const monthlyTrend = new Map<string, { income: number; expense: number; savings: number }>();
    for (const row of monthlyData) {
      const key = String(row.month);
      if (!monthlyTrend.has(key)) {
        monthlyTrend.set(key, { income: 0, expense: 0, savings: 0 });
      }
      const entry = monthlyTrend.get(key)!;
      if (row.type === 'income') entry.income = Number(row.total);
      if (row.type === 'expense') entry.expense = Number(row.total);
      entry.savings = entry.income - entry.expense;
    }

    return Array.from(monthlyTrend.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  async getWeeklyAnalytics(userId: string, monthStr?: string) {
    const targetMonth = monthStr ? `${monthStr}-01` : new Date().toISOString().slice(0, 7) + '-01';
    const { rows: weeklyData } = await query<{
      week: string;
      total: string;
    }>(
      `SELECT 
         DATE_TRUNC('week', transaction_date)::date AS week,
         COALESCE(SUM(amount_paise), 0) AS total
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
         AND transaction_date >= $2 
         AND transaction_date < ($2::date + INTERVAL '1 month')::date
       GROUP BY week
       ORDER BY week ASC`,
      [userId, targetMonth]
    );

    return weeklyData.map((r) => ({
      week: r.week,
      expense: Number(r.total),
    }));
  }
}

export const analyticsService = new AnalyticsService();
