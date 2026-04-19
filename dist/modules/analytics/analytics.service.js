"use strict";
/**
 * Analytics service — comprehensive financial analytics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const database_1 = require("../../config/database");
const money_1 = require("../../shared/utils/money");
class AnalyticsService {
    /** Total income for a date range */
    async totalIncome(userId, startDate, endDate) {
        const { rows } = await (0, database_1.query)(`SELECT COALESCE(SUM(amount_paise), 0) AS total FROM transactions
       WHERE user_id = $1 AND type = 'income'
       ${startDate ? 'AND transaction_date >= $2' : ''}
       ${endDate ? `AND transaction_date <= $${startDate ? 3 : 2}` : ''}`, [userId, ...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])]);
        return Number(rows[0].total);
    }
    /** Total expense for a date range */
    async totalExpense(userId, startDate, endDate) {
        const { rows } = await (0, database_1.query)(`SELECT COALESCE(SUM(amount_paise), 0) AS total FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       ${startDate ? 'AND transaction_date >= $2' : ''}
       ${endDate ? `AND transaction_date <= $${startDate ? 3 : 2}` : ''}`, [userId, ...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])]);
        return Number(rows[0].total);
    }
    /** Complete dashboard summary */
    async getDashboard(userId) {
        const now = new Date();
        const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
        // Current month stats
        const { rows: [currentStats] } = await (0, database_1.query)(`SELECT 
         COALESCE(SUM(amount_paise) FILTER (WHERE type = 'income'), 0) AS income_paise,
         COALESCE(SUM(amount_paise) FILTER (WHERE type = 'expense'), 0) AS expense_paise,
         COUNT(*) FILTER (WHERE type = 'expense') AS expense_count
       FROM transactions
       WHERE user_id = $1 AND transaction_date >= $2`, [userId, currentMonthStart]);
        // Previous month stats for comparison
        const { rows: [prevStats] } = await (0, database_1.query)(`SELECT 
         COALESCE(SUM(amount_paise) FILTER (WHERE type = 'income'), 0) AS income_paise,
         COALESCE(SUM(amount_paise) FILTER (WHERE type = 'expense'), 0) AS expense_paise
       FROM transactions
       WHERE user_id = $1 AND transaction_date >= $2 AND transaction_date <= $3`, [userId, lastMonthStart, lastMonthEnd]);
        const currentIncome = Number(currentStats.income_paise);
        const currentExpense = Number(currentStats.expense_paise);
        const prevIncome = Number(prevStats.income_paise);
        const prevExpense = Number(prevStats.expense_paise);
        return {
            currentMonth: {
                incomePaise: currentIncome,
                expensePaise: currentExpense,
                savingsPaise: currentIncome - currentExpense,
                expenseCount: Number(currentStats.expense_count),
            },
            trends: {
                incomeChange: (0, money_1.percentageChange)(currentIncome, prevIncome),
                expenseChange: (0, money_1.percentageChange)(currentExpense, prevExpense),
            },
        };
    }
    /** Expense breakdown by category */
    async expenseByCategory(userId, startDate, endDate) {
        let whereClause = "WHERE user_id = $1 AND type = 'expense'";
        const params = [userId];
        let idx = 2;
        if (startDate) {
            whereClause += ` AND transaction_date >= $${idx++}`;
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ` AND transaction_date <= $${idx++}`;
            params.push(endDate);
        }
        const { rows } = await (0, database_1.query)(`SELECT category, SUM(amount_paise) AS total_paise, COUNT(*) AS count
       FROM transactions ${whereClause}
       GROUP BY category ORDER BY total_paise DESC`, params);
        const grandTotal = rows.reduce((sum, r) => sum + Number(r.total_paise), 0);
        return rows.map(r => ({
            category: r.category,
            totalPaise: Number(r.total_paise),
            count: Number(r.count),
            percentage: grandTotal > 0 ? Math.round((Number(r.total_paise) / grandTotal) * 100) : 0,
        }));
    }
    /** Expense breakdown by account */
    async expenseByAccount(userId, startDate, endDate) {
        let whereClause = "WHERE t.user_id = $1 AND t.type = 'expense'";
        const params = [userId];
        let idx = 2;
        if (startDate) {
            whereClause += ` AND t.transaction_date >= $${idx++}`;
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ` AND t.transaction_date <= $${idx++}`;
            params.push(endDate);
        }
        const { rows } = await (0, database_1.query)(`SELECT a.id, a.account_name, a.type AS account_type, SUM(t.amount_paise) AS total_paise
       FROM transactions t JOIN accounts a ON t.account_id = a.id
       ${whereClause}
       GROUP BY a.id, a.account_name, a.type ORDER BY total_paise DESC`, params);
        return rows.map(r => ({
            accountId: r.id,
            accountName: r.account_name,
            accountType: r.account_type,
            totalPaise: Number(r.total_paise),
        }));
    }
    /** Monthly income/expense data for graphs */
    async monthlyGraph(userId, months = 6) {
        const { rows } = await (0, database_1.query)(`SELECT DATE_TRUNC('month', transaction_date)::date AS month,
              COALESCE(SUM(amount_paise) FILTER (WHERE type = 'income'), 0) AS income_paise,
              COALESCE(SUM(amount_paise) FILTER (WHERE type = 'expense'), 0) AS expense_paise
       FROM transactions
       WHERE user_id = $1 AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' * $2
       GROUP BY DATE_TRUNC('month', transaction_date)::date
       ORDER BY month ASC`, [userId, months]);
        return rows.map(r => ({
            month: r.month,
            incomePaise: Number(r.income_paise),
            expensePaise: Number(r.expense_paise),
            savingsPaise: Number(r.income_paise) - Number(r.expense_paise),
        }));
    }
    /** Weekly daily spending data */
    async weeklyGraph(userId) {
        const { rows } = await (0, database_1.query)(`SELECT transaction_date::date AS day,
              COALESCE(SUM(amount_paise) FILTER (WHERE type = 'expense'), 0) AS expense_paise,
              COALESCE(SUM(amount_paise) FILTER (WHERE type = 'income'), 0) AS income_paise
       FROM transactions
       WHERE user_id = $1 AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY transaction_date::date ORDER BY day ASC`, [userId]);
        return rows.map(r => ({
            day: r.day,
            expensePaise: Number(r.expense_paise),
            incomePaise: Number(r.income_paise),
        }));
    }
    /** Cash vs Bank vs UPI usage comparison */
    async paymentMethodUsage(userId, startDate, endDate) {
        let whereClause = "WHERE t.user_id = $1 AND t.type = 'expense'";
        const params = [userId];
        let idx = 2;
        if (startDate) {
            whereClause += ` AND t.transaction_date >= $${idx++}`;
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ` AND t.transaction_date <= $${idx++}`;
            params.push(endDate);
        }
        const { rows } = await (0, database_1.query)(`SELECT a.type AS account_type, SUM(t.amount_paise) AS total_paise, COUNT(*) AS count
       FROM transactions t JOIN accounts a ON t.account_id = a.id
       ${whereClause}
       GROUP BY a.type ORDER BY total_paise DESC`, params);
        return rows.map(r => ({
            accountType: r.account_type,
            totalPaise: Number(r.total_paise),
            count: Number(r.count),
        }));
    }
    /** Last 6 months comparison */
    async sixMonthComparison(userId) {
        return this.monthlyGraph(userId, 6);
    }
    /** Spending trend percentage — current vs previous period */
    async spendingTrend(userId) {
        const now = new Date();
        const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
        const currentExpense = await this.totalExpense(userId, currentMonthStart);
        const prevExpense = await this.totalExpense(userId, prevMonthStart, prevMonthEnd);
        return {
            currentMonthExpensePaise: currentExpense,
            previousMonthExpensePaise: prevExpense,
            changePercent: (0, money_1.percentageChange)(currentExpense, prevExpense),
            trend: currentExpense > prevExpense ? 'increasing' : currentExpense < prevExpense ? 'decreasing' : 'stable',
        };
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analytics.service.js.map