/**
 * Budget controller - set monthly budget, check 80% spending warning
 */

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { validateBudget } = require('../utils/validation');

/**
 * PUT /api/budget
 * Set monthly budget and/or budget_limit for the current user
 */
async function setBudget(req, res, next) {
  try {
    const errors = validateBudget(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }
    
    let user;
    if (req.body.monthly_budget !== undefined) {
      const monthlyBudget = Number(req.body.monthly_budget);
      user = await User.updateMonthlyBudget(req.user.id, monthlyBudget);
    }
    
    if (req.body.budget_limit !== undefined) {
      const budgetLimit = Number(req.body.budget_limit);
      user = await User.updateBudgetLimit(req.user.id, budgetLimit);
    }
    
    if (!user) {
      user = await User.findById(req.user.id);
    }
    
    res.json({
      success: true,
      message: 'Budget updated.',
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
    const budgetLimit = user.budget_limit || 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthlyExpense = await Transaction.totalExpense(
      req.user.id,
      startOfMonth.toISOString().slice(0, 10),
      endOfMonth.toISOString().slice(0, 10)
    );
    const percentUsed = monthlyBudget > 0 ? (monthlyExpense / monthlyBudget) * 100 : 0;
    const percentUsedLimit = budgetLimit > 0 ? (monthlyExpense / budgetLimit) * 100 : 0;
    
    let warning = null;
    if (monthlyBudget > 0 && percentUsed >= 80) {
      warning = `You have used ${percentUsed.toFixed(1)}% of your monthly budget. Consider limiting spending.`;
    } else if (budgetLimit > 0 && percentUsedLimit >= 80) {
      warning = `You have used ${percentUsedLimit.toFixed(1)}% of your budget limit. Consider limiting spending.`;
    }

    res.json({
      success: true,
      data: {
        monthly_budget: monthlyBudget,
        budget_limit: budgetLimit,
        monthly_expense: monthlyExpense,
        percent_used: Math.round(percentUsed * 10) / 10,
        percent_used_limit: Math.round(percentUsedLimit * 10) / 10,
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
