/**
 * Budgets module — validation, service, controller, routes
 */
import { z } from 'zod';
export declare const createBudgetSchema: z.ZodEffects<z.ZodObject<{
    scope: z.ZodEnum<["overall", "category", "account"]>;
    category: z.ZodOptional<z.ZodString>;
    accountId: z.ZodOptional<z.ZodString>;
    amountPaise: z.ZodNumber;
    month: z.ZodString;
}, "strip", z.ZodTypeAny, {
    scope: "overall" | "category" | "account";
    amountPaise: number;
    month: string;
    category?: string | undefined;
    accountId?: string | undefined;
}, {
    scope: "overall" | "category" | "account";
    amountPaise: number;
    month: string;
    category?: string | undefined;
    accountId?: string | undefined;
}>, {
    scope: "overall" | "category" | "account";
    amountPaise: number;
    month: string;
    category?: string | undefined;
    accountId?: string | undefined;
}, {
    scope: "overall" | "category" | "account";
    amountPaise: number;
    month: string;
    category?: string | undefined;
    accountId?: string | undefined;
}>;
export declare const updateBudgetSchema: z.ZodObject<{
    amountPaise: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amountPaise: number;
}, {
    amountPaise: number;
}>;
export declare const budgetIdParam: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
//# sourceMappingURL=budgets.validation.d.ts.map