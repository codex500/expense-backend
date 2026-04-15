/**
 * Dashboard controller - totals, balance, monthly/today income & expense
 */

const Transaction = require('../models/Transaction');

/**
 * GET /api/dashboard
 * Returns: total balance, total income, total expense,
 *          monthly income, monthly expense, today's income, today's expense
 */
async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const monthStart = startOfMonth.toISOString().slice(0, 10);
    const monthEnd = endOfMonth.toISOString().slice(0, 10);
    const todayStart = startOfToday.toISOString().slice(0, 10);
    const todayEnd = endOfToday.toISOString().slice(0, 10);

    const [totalIncome, totalExpense, monthlyIncome, monthlyExpense, todayIncome, todayExpense] = await Promise.all([
      Transaction.totalIncome(userId),
      Transaction.totalExpense(userId),
      Transaction.totalIncome(userId, monthStart, monthEnd),
      Transaction.totalExpense(userId, monthStart, monthEnd),
      Transaction.totalIncome(userId, todayStart, todayEnd),
      Transaction.totalExpense(userId, todayStart, todayEnd),
    ]);

    const totalBalance = totalIncome - totalExpense;

    res.json({
      success: true,
      data: {
        total_balance: totalBalance,
        total_income: totalIncome,
        total_expense: totalExpense,
        monthly_income: monthlyIncome,
        monthly_expense: monthlyExpense,
        todays_income: todayIncome,
        todays_expense: todayExpense,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
