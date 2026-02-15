/**
 * Analytics controller - category-wise expense, monthly spending, last 7 days
 */

const Transaction = require('../models/Transaction');

/**
 * GET /api/analytics/category-expense
 * Category-wise expense for pie chart (optional query: startDate, endDate)
 */
async function getCategoryExpense(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = await Transaction.expenseByCategory(
      req.user.id,
      startDate || null,
      endDate || null
    );
    res.json({
      success: true,
      data: { category_expense: data },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/monthly-spending
 * Monthly spending for graph (optional query: months, default 12)
 */
async function getMonthlySpending(req, res, next) {
  try {
    const months = Math.min(Math.max(parseInt(req.query.months, 10) || 12, 1), 24);
    const data = await Transaction.monthlySpending(req.user.id, months);
    res.json({
      success: true,
      data: { monthly_spending: data },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/last-7-days
 * Last 7 days spending per day
 */
async function getLast7Days(req, res, next) {
  try {
    const data = await Transaction.last7DaysSpending(req.user.id);
    res.json({
      success: true,
      data: { last_7_days: data },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategoryExpense,
  getMonthlySpending,
  getLast7Days,
};
