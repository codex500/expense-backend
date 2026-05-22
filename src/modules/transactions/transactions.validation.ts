import { z } from 'zod';

export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().min(1).max(100),
  amountPaise: z.number().int().positive('Amount must be positive'),
  note: z.string().max(500).optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  paymentMethod: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  receiptUrl: z.string().url().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  transferToAccountId: z.string().uuid().optional(),
});

export const updateTransactionSchema = z.object({
  accountId: z.string().uuid().optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  category: z.string().min(1).max(100).optional(),
  amountPaise: z.number().int().positive().optional(),
  note: z.string().max(500).optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paymentMethod: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  receiptUrl: z.string().url().optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().optional(),
  transferToAccountId: z.string().uuid().optional(),
});

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  category: z.string().optional(),
  accountId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmountPaise: z.coerce.number().int().optional(),
  maxAmountPaise: z.coerce.number().int().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['transaction_date', 'amount_paise', 'created_at']).default('transaction_date'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
