/**
 * Auth module — Zod validation schemas
 */
import { z } from 'zod';
export declare const signupSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
    dob: z.ZodString;
    gender: z.ZodOptional<z.ZodString>;
    mobileNumber: z.ZodOptional<z.ZodString>;
    panCard: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    fullName: string;
    dob: string;
    gender?: string | undefined;
    mobileNumber?: string | undefined;
    panCard?: string | undefined;
}, {
    email: string;
    password: string;
    fullName: string;
    dob: string;
    gender?: string | undefined;
    mobileNumber?: string | undefined;
    panCard?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    accessToken: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    accessToken: string;
}, {
    password: string;
    accessToken: string;
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    accessToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
}, {
    accessToken: string;
}>;
export declare const onboardingSchema: z.ZodObject<{
    defaultCurrency: z.ZodDefault<z.ZodString>;
    account: z.ZodObject<{
        accountName: z.ZodString;
        bankName: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["cash", "upi", "bank_account", "credit_card", "wallet"]>;
        initialBalancePaise: z.ZodNumber;
        icon: z.ZodOptional<z.ZodString>;
        color: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "cash" | "upi" | "bank_account" | "credit_card" | "wallet";
        accountName: string;
        initialBalancePaise: number;
        bankName?: string | undefined;
        icon?: string | undefined;
        color?: string | undefined;
    }, {
        type: "cash" | "upi" | "bank_account" | "credit_card" | "wallet";
        accountName: string;
        initialBalancePaise: number;
        bankName?: string | undefined;
        icon?: string | undefined;
        color?: string | undefined;
    }>;
    monthlySalaryPaise: z.ZodOptional<z.ZodNumber>;
    monthlyBudgetPaise: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    account: {
        type: "cash" | "upi" | "bank_account" | "credit_card" | "wallet";
        accountName: string;
        initialBalancePaise: number;
        bankName?: string | undefined;
        icon?: string | undefined;
        color?: string | undefined;
    };
    defaultCurrency: string;
    monthlySalaryPaise?: number | undefined;
    monthlyBudgetPaise?: number | undefined;
}, {
    account: {
        type: "cash" | "upi" | "bank_account" | "credit_card" | "wallet";
        accountName: string;
        initialBalancePaise: number;
        bankName?: string | undefined;
        icon?: string | undefined;
        color?: string | undefined;
    };
    defaultCurrency?: string | undefined;
    monthlySalaryPaise?: number | undefined;
    monthlyBudgetPaise?: number | undefined;
}>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
//# sourceMappingURL=auth.validation.d.ts.map