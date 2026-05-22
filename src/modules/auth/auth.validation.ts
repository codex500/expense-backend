/**
 * Auth module — Zod validation schemas for V4.
 * Supabase Auth handles email verification and password resets natively.
 */

import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, 'Password must contain at least one special character'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(255),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format').optional(),
  gender: z.string().max(20).optional(),
  mobileNumber: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
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

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mobileNumber: z.string().max(20).optional(),
  gender: z.string().max(20).optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  notifyEmail: z.boolean().optional(),
  notifyPush: z.boolean().optional(),
  notifyBudget: z.boolean().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
