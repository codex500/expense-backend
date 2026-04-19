"use strict";
/**
 * Budgets module — validation, service, controller, routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetIdParam = exports.updateBudgetSchema = exports.createBudgetSchema = void 0;
const zod_1 = require("zod");
exports.createBudgetSchema = zod_1.z.object({
    scope: zod_1.z.enum(['overall', 'category', 'account']),
    category: zod_1.z.string().max(255).optional(),
    accountId: zod_1.z.string().uuid().optional(),
    amountPaise: zod_1.z.number().int().positive('Budget must be positive'),
    month: zod_1.z.string().regex(/^\d{4}-\d{2}-01$/, 'Month must be YYYY-MM-01 (first day)'),
}).refine(data => {
    if (data.scope === 'category' && !data.category)
        return false;
    if (data.scope === 'account' && !data.accountId)
        return false;
    return true;
}, { message: 'Category required for category scope, accountId for account scope.' });
exports.updateBudgetSchema = zod_1.z.object({
    amountPaise: zod_1.z.number().int().positive('Budget must be positive'),
});
exports.budgetIdParam = zod_1.z.object({ id: zod_1.z.string().uuid() });
//# sourceMappingURL=budgets.validation.js.map