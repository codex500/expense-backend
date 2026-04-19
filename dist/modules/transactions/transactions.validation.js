"use strict";
/**
 * Transactions module — validation schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionIdParam = exports.transactionQuerySchema = exports.updateTransactionSchema = exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
exports.createTransactionSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['income', 'expense']),
    category: zod_1.z.string().min(1).max(255),
    amountPaise: zod_1.z.number().int().positive('Amount must be positive'),
    note: zod_1.z.string().max(1000).optional(),
    transactionDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    paymentMethod: zod_1.z.string().max(100).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(10).optional(),
    receiptUrl: zod_1.z.string().url().optional().nullable(),
    isRecurring: zod_1.z.boolean().default(false),
    recurringInterval: zod_1.z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});
exports.updateTransactionSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid().optional(),
    type: zod_1.z.enum(['income', 'expense']).optional(),
    category: zod_1.z.string().min(1).max(255).optional(),
    amountPaise: zod_1.z.number().int().positive('Amount must be positive').optional(),
    note: zod_1.z.string().max(1000).optional().nullable(),
    transactionDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    paymentMethod: zod_1.z.string().max(100).optional().nullable(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(10).optional(),
    receiptUrl: zod_1.z.string().url().optional().nullable(),
    isRecurring: zod_1.z.boolean().optional(),
    recurringInterval: zod_1.z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
});
exports.transactionQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().min(1)).default('1'),
    limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().min(1).max(100)).default('20'),
    type: zod_1.z.enum(['income', 'expense', 'transfer']).optional(),
    category: zod_1.z.string().optional(),
    accountId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    minAmountPaise: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().min(0)).optional(),
    maxAmountPaise: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().min(0)).optional(),
    search: zod_1.z.string().max(200).optional(),
    sortBy: zod_1.z.enum(['transaction_date', 'amount_paise', 'created_at']).default('transaction_date'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.transactionIdParam = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
//# sourceMappingURL=transactions.validation.js.map