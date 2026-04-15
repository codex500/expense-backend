/**
 * Users module — validation schemas
 */

import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

export const updatePreferencesSchema = z.object({
  defaultCurrency: z.string().min(2).max(10).optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  notifyEmail: z.boolean().optional(),
  notifyPush: z.boolean().optional(),
  notifyBudget: z.boolean().optional(),
  notifySalary: z.boolean().optional(),
  notifyWeekly: z.boolean().optional(),
  notifyMonthly: z.boolean().optional(),
  notifyLowBalance: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
