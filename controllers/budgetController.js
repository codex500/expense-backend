/**
 * Budget controller - set monthly budget, check 80% spending warning
 */

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { validateBudget } = require('../utils/validation');

/**
 * PUT /api/budget
 * Set monthly budget for the current user
 */
async function setBudget(req, res, next) {
  try {
    const errors = validateBudget(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }
    const monthlyBudget = Number(req.body.monthly_budget);
    const user = await User.updateMonthlyBudget(req.user.id, monthlyBudget);
    res.json({
      success: true,
      message: 'Monthly budget updated.',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/budget/status
 * Return budget, current month expense, and warning if spending crossed 80%
 */
async function getBudgetStatus(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    const monthlyBudget = user.monthly_budget || 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthlyExpense = await Transaction.totalExpense(
      req.user.id,
      startOfMonth.toISOString().slice(0, 10),
      endOfMonth.toISOString().slice(0, 10)
    );
    const percentUsed = monthlyBudget > 0 ? (monthlyExpense / monthlyBudget) * 100 : 0;
    const warning = percentUsed >= 80 && monthlyBudget > 0
      ? `You have used ${percentUsed.toFixed(1)}% of your monthly budget. Consider limiting spending.`
      : null;

    res.json({
      success: true,
      data: {
        monthly_budget: monthlyBudget,
        monthly_expense: monthlyExpense,
        percent_used: Math.round(percentUsed * 10) / 10,
        warning,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  setBudget,
  getBudgetStatus,
};
