/**
 * Analytics service — comprehensive financial analytics.
 */
export declare class AnalyticsService {
    /** Total income for a date range */
    totalIncome(userId: string, startDate?: string, endDate?: string): Promise<number>;
    /** Total expense for a date range */
    totalExpense(userId: string, startDate?: string, endDate?: string): Promise<number>;
    /** Complete dashboard summary */
    getDashboard(userId: string): Promise<{
        currentMonth: {
            incomePaise: number;
            expensePaise: number;
            savingsPaise: number;
            expenseCount: number;
        };
        trends: {
            incomeChange: number;
            expenseChange: number;
        };
    }>;
    /** Expense breakdown by category */
    expenseByCategory(userId: string, startDate?: string, endDate?: string): Promise<{
        category: any;
        totalPaise: number;
        count: number;
        percentage: number;
    }[]>;
    /** Expense breakdown by account */
    expenseByAccount(userId: string, startDate?: string, endDate?: string): Promise<{
        accountId: any;
        accountName: any;
        accountType: any;
        totalPaise: number;
    }[]>;
    /** Monthly income/expense data for graphs */
    monthlyGraph(userId: string, months?: number): Promise<{
        month: any;
        incomePaise: number;
        expensePaise: number;
        savingsPaise: number;
    }[]>;
    /** Weekly daily spending data */
    weeklyGraph(userId: string): Promise<{
        day: any;
        expensePaise: number;
        incomePaise: number;
    }[]>;
    /** Cash vs Bank vs UPI usage comparison */
    paymentMethodUsage(userId: string, startDate?: string, endDate?: string): Promise<{
        accountType: any;
        totalPaise: number;
        count: number;
    }[]>;
    /** Last 6 months comparison */
    sixMonthComparison(userId: string): Promise<{
        month: any;
        incomePaise: number;
        expensePaise: number;
        savingsPaise: number;
    }[]>;
    /** Spending trend percentage — current vs previous period */
    spendingTrend(userId: string): Promise<{
        currentMonthExpensePaise: number;
        previousMonthExpensePaise: number;
        changePercent: number;
        trend: string;
    }>;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map