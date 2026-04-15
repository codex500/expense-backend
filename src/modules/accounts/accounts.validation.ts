/**
 * Accounts module — validation schemas
 */

import { z } from 'zod';

export const createAccountSchema = z.object({
  accountName: z.string().min(1).max(255),
  bankName: z.string().max(255).optional(),
  type: z.enum(['cash', 'upi', 'bank_account', 'credit_card', 'wallet']),
  initialBalancePaise: z.number().int().min(0).default(0),
  icon: z.string().max(100).default('wallet'),
  color: z.string().max(20).default('#6366F1'),
  isDefault: z.boolean().default(false),
});

export const updateAccountSchema = z.object({
  accountName: z.string().min(1).max(255).optional(),
  bankName: z.string().max(255).optional().nullable(),
  icon: z.string().max(100).optional(),
  color: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
});

export const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amountPaise: z.number().int().positive('Transfer amount must be positive'),
  note: z.string().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export const accountIdParam = z.object({
  id: z.string().uuid(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
