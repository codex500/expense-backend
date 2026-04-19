/**
 * Budgets service — monthly/category/account budgets with alert tracking.
 */
import { CreateBudgetInput, UpdateBudgetInput } from './budgets.validation';
export declare class BudgetsService {
    create(userId: string, input: CreateBudgetInput): Promise<{
        id: any;
        userId: any;
        scope: any;
        category: any;
        accountId: any;
        amountPaise: number;
        month: any;
        alert80Sent: any;
        alert90Sent: any;
        alert100Sent: any;
        createdAt: any;
    }>;
    update(userId: string, budgetId: string, input: UpdateBudgetInput): Promise<{
        id: any;
        userId: any;
        scope: any;
        category: any;
        accountId: any;
        amountPaise: number;
        month: any;
        alert80Sent: any;
        alert90Sent: any;
        alert100Sent: any;
        createdAt: any;
    }>;
    delete(userId: string, budgetId: string): Promise<{
        message: string;
    }>;
    getCurrent(userId: string): Promise<{
        spentPaise: number;
        remainingPaise: number;
        percentUsed: number;
        status: string;
        id: any;
        userId: any;
        scope: any;
        category: any;
        accountId: any;
        amountPaise: number;
        month: any;
        alert80Sent: any;
        alert90Sent: any;
        alert100Sent: any;
        createdAt: any;
    }[]>;
    /**
     * Check all budgets for a user and return alerts for those crossing thresholds.
     * Used by cron jobs for email/notification triggers.
     */
    checkBudgetAlerts(userId: string): Promise<{
        budget: any;
        threshold: number;
    }[]>;
    private formatBudget;
}
export declare const budgetsService: BudgetsService;
//# sourceMappingURL=budgets.service.d.ts.map