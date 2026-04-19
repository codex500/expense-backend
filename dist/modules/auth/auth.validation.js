"use strict";
/**
 * Auth module — Zod validation schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingSchema = exports.verifyEmailSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, 'Password must contain at least one special character'),
    fullName: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(255),
    dob: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format'),
    gender: zod_1.z.string().optional(),
    mobileNumber: zod_1.z.string().optional(),
    panCard: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.resetPasswordSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, 'Access token is required'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain uppercase letter')
        .regex(/[0-9]/, 'Must contain a number'),
});
exports.verifyEmailSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, 'Access token is required'),
});
exports.onboardingSchema = zod_1.z.object({
    defaultCurrency: zod_1.z.string().min(2).max(10).default('INR'),
    account: zod_1.z.object({
        accountName: zod_1.z.string().min(1).max(255),
        bankName: zod_1.z.string().max(255).optional(),
        type: zod_1.z.enum(['cash', 'upi', 'bank_account', 'credit_card', 'wallet']),
        initialBalancePaise: zod_1.z.number().int().min(0),
        icon: zod_1.z.string().max(100).optional(),
        color: zod_1.z.string().max(20).optional(),
    }),
    monthlySalaryPaise: zod_1.z.number().int().min(0).optional(),
    monthlyBudgetPaise: zod_1.z.number().int().min(0).optional(),
});
//# sourceMappingURL=auth.validation.js.map