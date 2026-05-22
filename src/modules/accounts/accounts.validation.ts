import { z } from 'zod';

export const createAccountSchema = z.object({
  accountName: z.string().min(1).max(255),
  bankName: z.string().max(255).optional(),
  type: z.enum(['cash', 'upi', 'bank_account', 'credit_card', 'wallet']),
  initialBalancePaise: z.number().int().min(0).default(0),
  icon: z.string().max(100).optional(),
  color: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
});

export const updateAccountSchema = z.object({
  accountName: z.string().min(1).max(255).optional(),
  bankName: z.string().max(255).optional(),
  type: z.enum(['cash', 'upi', 'bank_account', 'credit_card', 'wallet']).optional(),
  icon: z.string().max(100).optional(),
  color: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
