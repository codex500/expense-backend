/**
 * Advisor service — intelligent financial insights and suggestions.
 */

import { analyticsService } from '../analytics/analytics.service';
import { sendSuccess } from '../../shared/utils/response';
import { percentageChange } from '../../shared/utils/money';
import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { AuthenticatedRequest } from '../../shared/types';
import { query } from '../../config/database';

export class AdvisorService {

  async generateInsights(userId: string) {
    const now = new Date();
    const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

    const insights: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 1. Overspending Warning & Spending Behavior
    const currentExpense = await analyticsService.totalExpense(userId, currentMonthStart);
    const prevExpense = await analyticsService.totalExpense(userId, prevMonthStart, prevMonthEnd);
    
    if (prevExpense > 0) {
      const change = percentageChange(currentExpense, prevExpense);
      if (change > 20) {
          warnings.push(`Warning: Your expenses are ${change}% higher than last month. Consider slowing down your spending. `);
      } else if (change < -10) {
          insights.push(`Great job! You've spent ${Math.abs(change)}% less than last month.`);
      }
    }

    // 2. Top Unnecessary Expense Category (heuristic: Entertainment, Shopping)
    const currentCategories = await analyticsService.expenseByCategory(userId, currentMonthStart);
    let potentialSavingsPaise = 0;
    
    for (const cat of currentCategories) {
        if (['Shopping', 'Entertainment', 'Dining Out'].includes(cat.category)) {
            if (cat.percentage > 20) {
               warnings.push(`You spent ${cat.percentage}% of your expenses on ${cat.category} this month.`);
               potentialSavingsPaise += cat.totalPaise;
            }
        }
    }

    if (potentialSavingsPaise > 0) {
        suggestions.push(`You could potentially save ₹${(potentialSavingsPaise * 0.2 / 100).toFixed(0)} if you reduce discretionary spending by 20%.`);
    }

    // 3. Budgets check
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const { rows: budgets } = await query(
      `SELECT * FROM budgets WHERE user_id = $1 AND month = $2`, [userId, currentMonthStr]
    );

    if (budgets.length === 0) {
        suggestions.push(`Set up a monthly budget to track your expenses more effectively.`);
    }

    return {
      insights,
      warnings,
      suggestions,
      monthlySummary: {
          currentExpensePaise: currentExpense,
          previousExpensePaise: prevExpense,
      }
    };
  }
}

export const advisorService = new AdvisorService();

// --- Controller & Routes ---
const router = Router();
router.use(authenticate as any);

router.get('/insights', async (req: any, res, next) => {
    try {
        const result = await advisorService.generateInsights(req.user.id);
        sendSuccess(res, result);
    } catch(err) {
        next(err);
    }
});

export default router;
