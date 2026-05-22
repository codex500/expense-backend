import { z } from 'zod';

export const createBudgetSchema = z.object({
  scope: z.enum(['overall', 'category', 'account']),
  category: z.string().max(100).optional(),
  accountId: z.string().uuid().optional(),
  amountPaise: z.number().int().positive('Budget amount must be positive'),
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Month must be YYYY-MM-DD (first day of month)'),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
