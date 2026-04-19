"use strict";
/**
 * Users module — validation schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferencesSchema = exports.changePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(255).optional(),
    phone: zod_1.z.string().max(20).optional(),
    avatarUrl: zod_1.z.string().url().optional().nullable(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain uppercase letter')
        .regex(/[0-9]/, 'Must contain a number'),
});
exports.updatePreferencesSchema = zod_1.z.object({
    defaultCurrency: zod_1.z.string().min(2).max(10).optional(),
    themePreference: zod_1.z.enum(['light', 'dark', 'system']).optional(),
    notifyEmail: zod_1.z.boolean().optional(),
    notifyPush: zod_1.z.boolean().optional(),
    notifyBudget: zod_1.z.boolean().optional(),
    notifySalary: zod_1.z.boolean().optional(),
    notifyWeekly: zod_1.z.boolean().optional(),
    notifyMonthly: zod_1.z.boolean().optional(),
    notifyLowBalance: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=users.validation.js.map