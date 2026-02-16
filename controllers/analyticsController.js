/**
 * Analytics controller - category expense, monthly spending, last 7 days, weekly
 */

const Transaction = require('../models/Transaction');

/**
 * GET /api/analytics/category-expense
 */
async function getCategoryExpense(req, res, next) {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    const data = await Transaction.expenseByCategory(userId, startDate, endDate);
    res.json({ success: true, data: { category_expense: data } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/monthly-spending
 */
async function getMonthlySpending(req, res, next) {
  try {
    const userId = req.user.id;
    const months = parseInt(req.query.months || '12', 10);
    const data = await Transaction.monthlySpending(userId, months);
    res.json({ success: true, data: { monthly_spending: data } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/last-7-days
 */
async function getLast7Days(req, res, next) {
  try {
    const userId = req.user.id;
    const data = await Transaction.last7DaysSpending(userId);
    res.json({ success: true, data: { last_7_days: data } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/weekly
 * Returns 7-day spending with highest/lowest day analysis
 */
async function getWeekly(req, res, next) {
  try {
    const userId = req.user.id;
    const data = await Transaction.last7DaysSpending(userId);
    
    if (data.length === 0) {
      return res.json({
        success: true,
        data: {
          weekly_data: [],
          highest_day: null,
          lowest_day: null,
          total_week: 0,
        },
      });
    }

    const highestDay = data.reduce((max, day) => 
      day.total > max.total ? day : max, data[0]
    );
    const lowestDay = data.reduce((min, day) => 
      day.total < min.total ? day : min, data[0]
    );
    const totalWeek = data.reduce((sum, day) => sum + day.total, 0);

    res.json({
      success: true,
      data: {
        weekly_data: data,
        highest_day: {
          date: highestDay.day,
          amount: highestDay.total,
        },
        lowest_day: {
          date: lowestDay.day,
          amount: lowestDay.total,
        },
        total_week: totalWeek,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategoryExpense,
  getMonthlySpending,
  getLast7Days,
  getWeekly,
};
