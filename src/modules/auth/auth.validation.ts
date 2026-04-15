/**
 * Auth module — Zod validation schemas
 */

import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(255),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

export const onboardingSchema = z.object({
  defaultCurrency: z.string().min(2).max(10).default('INR'),
  account: z.object({
    accountName: z.string().min(1).max(255),
    bankName: z.string().max(255).optional(),
    type: z.enum(['cash', 'upi', 'bank_account', 'credit_card', 'wallet']),
    initialBalancePaise: z.number().int().min(0),
    icon: z.string().max(100).optional(),
    color: z.string().max(20).optional(),
  }),
  monthlySalaryPaise: z.number().int().min(0).optional(),
  monthlyBudgetPaise: z.number().int().min(0).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
