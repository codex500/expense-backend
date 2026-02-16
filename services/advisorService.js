/**
 * Smart Spending Advisor Service
 * Analyzes user spending patterns and provides insights
 */

const pool = require('../config/database');

/**
 * Get spending advisor insights for user
 */
async function getAdvisorInsights(userId) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get last 30 days expenses
    const last30DaysResult = await pool.query(
      `SELECT category, SUM(amount) as total
       FROM transactions
       WHERE user_id = $1
       AND type = 'expense'
       AND transaction_date >= $2
       GROUP BY category
       ORDER BY total DESC`,
      [userId, thirtyDaysAgo.toISOString().slice(0, 10)]
    );

    // Get total spending last 30 days
    const total30DaysResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_id = $1
       AND type = 'expense'
       AND transaction_date >= $2`,
      [userId, thirtyDaysAgo.toISOString().slice(0, 10)]
    );

    // Get last month spending
    const lastMonthResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_id = $1
       AND type = 'expense'
       AND transaction_date >= $2
       AND transaction_date <= $3`,
      [userId, lastMonthStart.toISOString().slice(0, 10), lastMonthEnd.toISOString().slice(0, 10)]
    );

    const total30Days = Number(total30DaysResult.rows[0]?.total || 0);
    const totalLastMonth = Number(lastMonthResult.rows[0]?.total || 0);
    const dailyAverage = total30Days / 30;
    
    const topCategory = last30DaysResult.rows[0] || null;
    const spendingIncreased = total30Days > totalLastMonth && totalLastMonth > 0;
    const increasePercent = totalLastMonth > 0 
      ? Math.round(((total30Days - totalLastMonth) / totalLastMonth) * 100)
      : 0;

    // Generate saving tip
    let savingTip = 'Track your expenses daily to build better financial habits.';
    if (topCategory && topCategory.total > total30Days * 0.3) {
      savingTip = `Consider reducing spending on ${topCategory.category} - it's your biggest expense category.`;
    } else if (spendingIncreased) {
      savingTip = `Your spending increased by ${increasePercent}% compared to last month. Review your expenses to identify areas to cut back.`;
    } else if (total30Days > 0) {
      savingTip = 'Great job maintaining consistent spending! Keep tracking to stay on budget.';
    }

    return {
      top_spending_category: topCategory ? {
        name: topCategory.category,
        amount: Number(topCategory.total),
      } : null,
      daily_average_spending: Math.round(dailyAverage * 100) / 100,
      spending_increased: spendingIncreased,
      increase_percent: increasePercent,
      saving_tip: savingTip,
      last_30_days_total: total30Days,
      last_month_total: totalLastMonth,
    };
  } catch (err) {
    console.error('[AdvisorService] Error:', err.message);
    throw err;
  }
}

module.exports = { getAdvisorInsights };
