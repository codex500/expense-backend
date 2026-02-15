/**
 * Dashboard controller - totals, balance, monthly/today expense
 */

const Transaction = require('../models/Transaction');

/**
 * GET /api/dashboard
 * Returns: total balance, total income, total expense, monthly expense, today's expense
 */
async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [totalIncome, totalExpense, monthlyExpense, todayExpense] = await Promise.all([
      Transaction.totalIncome(userId),
      Transaction.totalExpense(userId),
      Transaction.totalExpense(userId, startOfMonth.toISOString().slice(0, 10), endOfMonth.toISOString().slice(0, 10)),
      Transaction.totalExpense(userId, startOfToday.toISOString().slice(0, 10), endOfToday.toISOString().slice(0, 10)),
    ]);

    const totalBalance = totalIncome - totalExpense;

    res.json({
      success: true,
      data: {
        total_balance: totalBalance,
        total_income: totalIncome,
        total_expense: totalExpense,
        monthly_expense: monthlyExpense,
        todays_expense: todayExpense,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
