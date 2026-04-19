/**
 * Transactions module — validation schemas
 */
import { z } from 'zod';
export declare const createTransactionSchema: z.ZodObject<{
    accountId: z.ZodString;
    type: z.ZodEnum<["income", "expense"]>;
    category: z.ZodString;
    amountPaise: z.ZodNumber;
    note: z.ZodOptional<z.ZodString>;
    transactionDate: z.ZodString;
    paymentMethod: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    receiptUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isRecurring: z.ZodDefault<z.ZodBoolean>;
    recurringInterval: z.ZodOptional<z.ZodEnum<["daily", "weekly", "monthly", "yearly"]>>;
}, "strip", z.ZodTypeAny, {
    category: string;
    type: "income" | "expense";
    accountId: string;
    amountPaise: number;
    transactionDate: string;
    isRecurring: boolean;
    note?: string | undefined;
    paymentMethod?: string | undefined;
    tags?: string[] | undefined;
    receiptUrl?: string | null | undefined;
    recurringInterval?: "daily" | "weekly" | "monthly" | "yearly" | undefined;
}, {
    category: string;
    type: "income" | "expense";
    accountId: string;
    amountPaise: number;
    transactionDate: string;
    note?: string | undefined;
    paymentMethod?: string | undefined;
    tags?: string[] | undefined;
    receiptUrl?: string | null | undefined;
    isRecurring?: boolean | undefined;
    recurringInterval?: "daily" | "weekly" | "monthly" | "yearly" | undefined;
}>;
export declare const updateTransactionSchema: z.ZodObject<{
    accountId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["income", "expense"]>>;
    category: z.ZodOptional<z.ZodString>;
    amountPaise: z.ZodOptional<z.ZodNumber>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    transactionDate: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    receiptUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isRecurring: z.ZodOptional<z.ZodBoolean>;
    recurringInterval: z.ZodNullable<z.ZodOptional<z.ZodEnum<["daily", "weekly", "monthly", "yearly"]>>>;
}, "strip", z.ZodTypeAny, {
    category?: string | undefined;
    type?: "income" | "expense" | undefined;
    accountId?: string | undefined;
    amountPaise?: number | undefined;
    note?: string | null | undefined;
    transactionDate?: string | undefined;
    paymentMethod?: string | null | undefined;
    tags?: string[] | undefined;
    receiptUrl?: string | null | undefined;
    isRecurring?: boolean | undefined;
    recurringInterval?: "daily" | "weekly" | "monthly" | "yearly" | null | undefined;
}, {
    category?: string | undefined;
    type?: "income" | "expense" | undefined;
    accountId?: string | undefined;
    amountPaise?: number | undefined;
    note?: string | null | undefined;
    transactionDate?: string | undefined;
    paymentMethod?: string | null | undefined;
    tags?: string[] | undefined;
    receiptUrl?: string | null | undefined;
    isRecurring?: boolean | undefined;
    recurringInterval?: "daily" | "weekly" | "monthly" | "yearly" | null | undefined;
}>;
export declare const transactionQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    type: z.ZodOptional<z.ZodEnum<["income", "expense", "transfer"]>>;
    category: z.ZodOptional<z.ZodString>;
    accountId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    minAmountPaise: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    maxAmountPaise: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["transaction_date", "amount_paise", "created_at"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortBy: "transaction_date" | "amount_paise" | "created_at";
    sortOrder: "asc" | "desc";
    category?: string | undefined;
    type?: "income" | "expense" | "transfer" | undefined;
    accountId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    minAmountPaise?: number | undefined;
    maxAmountPaise?: number | undefined;
    search?: string | undefined;
}, {
    limit?: string | undefined;
    category?: string | undefined;
    type?: "income" | "expense" | "transfer" | undefined;
    accountId?: string | undefined;
    page?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    minAmountPaise?: string | undefined;
    maxAmountPaise?: string | undefined;
    search?: string | undefined;
    sortBy?: "transaction_date" | "amount_paise" | "created_at" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const transactionIdParam: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
//# sourceMappingURL=transactions.validation.d.ts.map