/**
 * Transactions module — validation schemas
 */

import { z } from 'zod';

export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1).max(255),
  amountPaise: z.number().int().positive('Amount must be positive'),
  note: z.string().max(1000).optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  paymentMethod: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  receiptUrl: z.string().url().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

export const updateTransactionSchema = z.object({
  accountId: z.string().uuid().optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().min(1).max(255).optional(),
  amountPaise: z.number().int().positive('Amount must be positive').optional(),
  note: z.string().max(1000).optional().nullable(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paymentMethod: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  receiptUrl: z.string().url().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
});

export const transactionQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  category: z.string().optional(),
  accountId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  minAmountPaise: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
  maxAmountPaise: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['transaction_date', 'amount_paise', 'created_at']).default('transaction_date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const transactionIdParam = z.object({
  id: z.string().uuid(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
