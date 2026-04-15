/**
 * Budgets module — validation, service, controller, routes
 */

import { z } from 'zod';

export const createBudgetSchema = z.object({
  scope: z.enum(['overall', 'category', 'account']),
  category: z.string().max(255).optional(),
  accountId: z.string().uuid().optional(),
  amountPaise: z.number().int().positive('Budget must be positive'),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'Month must be YYYY-MM-01 (first day)'),
}).refine(data => {
  if (data.scope === 'category' && !data.category) return false;
  if (data.scope === 'account' && !data.accountId) return false;
  return true;
}, { message: 'Category required for category scope, accountId for account scope.' });

export const updateBudgetSchema = z.object({
  amountPaise: z.number().int().positive('Budget must be positive'),
});

export const budgetIdParam = z.object({ id: z.string().uuid() });

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
