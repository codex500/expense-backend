/**
 * Salary module — monthly salary deposit management.
 *
 * On login, the system checks if salary for the current month exists.
 * If not, the frontend shows a salary popup.
 * When the user confirms, salary is deposited into the chosen account.
 */
import { z } from 'zod';
export declare const depositSalarySchema: z.ZodObject<{
    accountId: z.ZodString;
    amountPaise: z.ZodNumber;
    month: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accountId: string;
    amountPaise: number;
    month: string;
}, {
    accountId: string;
    amountPaise: number;
    month: string;
}>;
export type DepositSalaryInput = z.infer<typeof depositSalarySchema>;
export declare class SalaryService {
    /**
     * Check if salary for the current month has been deposited.
     */
    checkCurrentMonth(userId: string): Promise<{
        deposited: boolean;
        entry: {
            id: any;
            amountPaise: number;
            accountName: any;
            depositedAt: any;
        } | null;
        defaultSalaryPaise: number;
        defaultAccountId: any;
        currentMonth: string;
    }>;
    /**
     * Deposit salary — creates salary entry + income transaction + updates balance.
     * All in one atomic transaction.
     */
    deposit(userId: string, input: DepositSalaryInput): Promise<{
        salaryEntry: {
            id: any;
            amountPaise: number;
            month: any;
        };
        transactionId: any;
        message: string;
    }>;
    /**
     * Get salary history.
     */
    getHistory(userId: string): Promise<{
        id: any;
        amountPaise: number;
        month: any;
        accountName: any;
        depositedAt: any;
    }[]>;
}
export declare const salaryService: SalaryService;
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=salary.module.d.ts.map