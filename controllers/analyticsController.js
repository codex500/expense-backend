/**
 * Analytics controller - category expense/income, monthly spending/income, last 7 days, weekly
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
 * GET /api/analytics/category-income
 */
async function getCategoryIncome(req, res, next) {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    const data = await Transaction.incomeByCategory(userId, startDate, endDate);
    res.json({ success: true, data: { category_income: data } });
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
 * GET /api/analytics/monthly-income
 */
async function getMonthlyIncome(req, res, next) {
  try {
    const userId = req.user.id;
    const months = parseInt(req.query.months || '12', 10);
    const data = await Transaction.monthlyIncome(userId, months);
    res.json({ success: true, data: { monthly_income: data } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/monthly-summary
 * Returns income + expense side-by-side per month
 */
async function getMonthlySummary(req, res, next) {
  try {
    const userId = req.user.id;
    const months = parseInt(req.query.months || '12', 10);
    const data = await Transaction.monthlySummary(userId, months);
    res.json({ success: true, data: { monthly_summary: data } });
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
    const [spending, income] = await Promise.all([
      Transaction.last7DaysSpending(userId),
      Transaction.last7DaysIncome(userId),
    ]);
    res.json({
      success: true,
      data: {
        last_7_days_spending: spending,
        last_7_days_income: income,
      },
    });
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
    const [spendingData, incomeData] = await Promise.all([
      Transaction.last7DaysSpending(userId),
      Transaction.last7DaysIncome(userId),
    ]);
    
    if (spendingData.length === 0 && incomeData.length === 0) {
      return res.json({
        success: true,
        data: {
          weekly_spending: [],
          weekly_income: [],
          highest_spending_day: null,
          lowest_spending_day: null,
          total_week_spending: 0,
          total_week_income: 0,
        },
      });
    }

    let highestSpendingDay = null;
    let lowestSpendingDay = null;
    let totalWeekSpending = 0;
    let totalWeekIncome = 0;

    if (spendingData.length > 0) {
      highestSpendingDay = spendingData.reduce((max, day) => 
        day.total > max.total ? day : max, spendingData[0]
      );
      lowestSpendingDay = spendingData.reduce((min, day) => 
        day.total < min.total ? day : min, spendingData[0]
      );
      totalWeekSpending = spendingData.reduce((sum, day) => sum + day.total, 0);
    }

    totalWeekIncome = incomeData.reduce((sum, day) => sum + day.total, 0);

    res.json({
      success: true,
      data: {
        weekly_spending: spendingData,
        weekly_income: incomeData,
        highest_spending_day: highestSpendingDay ? {
          date: highestSpendingDay.day,
          amount: highestSpendingDay.total,
        } : null,
        lowest_spending_day: lowestSpendingDay ? {
          date: lowestSpendingDay.day,
          amount: lowestSpendingDay.total,
        } : null,
        total_week_spending: totalWeekSpending,
        total_week_income: totalWeekIncome,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategoryExpense,
  getCategoryIncome,
  getMonthlySpending,
  getMonthlyIncome,
  getMonthlySummary,
  getLast7Days,
  getWeekly,
};
