"use strict";
/**
 * Accounts module — validation schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountIdParam = exports.transferSchema = exports.updateAccountSchema = exports.createAccountSchema = void 0;
const zod_1 = require("zod");
exports.createAccountSchema = zod_1.z.object({
    accountName: zod_1.z.string().min(1).max(255),
    bankName: zod_1.z.string().max(255).optional(),
    type: zod_1.z.enum(['cash', 'upi', 'bank_account', 'credit_card', 'wallet']),
    initialBalancePaise: zod_1.z.number().int().min(0).default(0),
    icon: zod_1.z.string().max(100).default('wallet'),
    color: zod_1.z.string().max(20).default('#6366F1'),
    isDefault: zod_1.z.boolean().default(false),
});
exports.updateAccountSchema = zod_1.z.object({
    accountName: zod_1.z.string().min(1).max(255).optional(),
    bankName: zod_1.z.string().max(255).optional().nullable(),
    icon: zod_1.z.string().max(100).optional(),
    color: zod_1.z.string().max(20).optional(),
    isDefault: zod_1.z.boolean().optional(),
});
exports.transferSchema = zod_1.z.object({
    fromAccountId: zod_1.z.string().uuid(),
    toAccountId: zod_1.z.string().uuid(),
    amountPaise: zod_1.z.number().int().positive('Transfer amount must be positive'),
    note: zod_1.z.string().max(500).optional(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});
exports.accountIdParam = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
//# sourceMappingURL=accounts.validation.js.map