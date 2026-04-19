"use strict";
/**
 * Advisor service — intelligent financial insights and suggestions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.advisorService = exports.AdvisorService = void 0;
const analytics_service_1 = require("../analytics/analytics.service");
const response_1 = require("../../shared/utils/response");
const money_1 = require("../../shared/utils/money");
const express_1 = require("express");
const authenticate_1 = require("../../shared/middleware/authenticate");
const database_1 = require("../../config/database");
class AdvisorService {
    async generateInsights(userId) {
        const now = new Date();
        const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
        const insights = [];
        const warnings = [];
        const suggestions = [];
        // 1. Overspending Warning & Spending Behavior
        const currentExpense = await analytics_service_1.analyticsService.totalExpense(userId, currentMonthStart);
        const prevExpense = await analytics_service_1.analyticsService.totalExpense(userId, prevMonthStart, prevMonthEnd);
        if (prevExpense > 0) {
            const change = (0, money_1.percentageChange)(currentExpense, prevExpense);
            if (change > 20) {
                warnings.push(`Warning: Your expenses are ${change}% higher than last month. Consider slowing down your spending. `);
            }
            else if (change < -10) {
                insights.push(`Great job! You've spent ${Math.abs(change)}% less than last month.`);
            }
        }
        // 2. Top Unnecessary Expense Category (heuristic: Entertainment, Shopping)
        const currentCategories = await analytics_service_1.analyticsService.expenseByCategory(userId, currentMonthStart);
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
        const { rows: budgets } = await (0, database_1.query)(`SELECT * FROM budgets WHERE user_id = $1 AND month = $2`, [userId, currentMonthStr]);
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
exports.AdvisorService = AdvisorService;
exports.advisorService = new AdvisorService();
// --- Controller & Routes ---
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
router.get('/insights', async (req, res, next) => {
    try {
        const result = await exports.advisorService.generateInsights(req.user.id);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=advisor.module.js.map