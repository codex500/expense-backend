/**
 * Accounts module — validation schemas
 */
import { z } from 'zod';
export declare const createAccountSchema: z.ZodObject<{
    accountName: z.ZodString;
    bankName: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["cash", "upi", "bank_account", "credit_card", "wallet"]>;
    initialBalancePaise: z.ZodDefault<z.ZodNumber>;
    icon: z.ZodDefault<z.ZodString>;
    color: z.ZodDefault<z.ZodString>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "cash" | "upi" | "bank_account" | "credit_card" | "wallet";
    accountName: string;
    initialBalancePaise: number;
    icon: string;
    color: string;
    isDefault: boolean;
    bankName?: string | undefined;
}, {
    type: "cash" | "upi" | "bank_account" | "credit_card" | "wallet";
    accountName: string;
    bankName?: string | undefined;
    initialBalancePaise?: number | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const updateAccountSchema: z.ZodObject<{
    accountName: z.ZodOptional<z.ZodString>;
    bankName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    accountName?: string | undefined;
    bankName?: string | null | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    isDefault?: boolean | undefined;
}, {
    accountName?: string | undefined;
    bankName?: string | null | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const transferSchema: z.ZodObject<{
    fromAccountId: z.ZodString;
    toAccountId: z.ZodString;
    amountPaise: z.ZodNumber;
    note: z.ZodOptional<z.ZodString>;
    date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    date: string;
    amountPaise: number;
    fromAccountId: string;
    toAccountId: string;
    note?: string | undefined;
}, {
    date: string;
    amountPaise: number;
    fromAccountId: string;
    toAccountId: string;
    note?: string | undefined;
}>;
export declare const accountIdParam: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
//# sourceMappingURL=accounts.validation.d.ts.map