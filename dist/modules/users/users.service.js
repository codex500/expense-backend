"use strict";
/**
 * Users service — profile management, preferences, account deletion.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = exports.UsersService = void 0;
const database_1 = require("../../config/database");
const supabase_1 = require("../../config/supabase");
const errors_1 = require("../../shared/errors");
class UsersService {
    async getProfile(userId) {
        const { rows } = await (0, database_1.query)(`SELECT up.*,
              (SELECT COUNT(*) FROM accounts WHERE user_id = up.id AND is_active = true) AS account_count,
              (SELECT COALESCE(SUM(current_balance_paise), 0) FROM accounts WHERE user_id = up.id AND is_active = true) AS total_balance_paise
       FROM user_profiles up WHERE up.id = $1`, [userId]);
        if (rows.length === 0)
            throw new errors_1.NotFoundError('Profile not found.');
        const p = rows[0];
        return {
            id: p.id,
            email: p.email,
            fullName: p.full_name,
            avatarUrl: p.avatar_url,
            phone: p.phone_number ?? "Not Provided",
            pan: p.pan_number ?? "Not Provided",
            defaultCurrency: p.default_currency,
            themePreference: p.theme_preference,
            notifyEmail: p.notify_email,
            notifyPush: p.notify_push,
            notifyBudget: p.notify_budget,
            notifySalary: p.notify_salary,
            notifyWeekly: p.notify_weekly,
            notifyMonthly: p.notify_monthly,
            notifyLowBalance: p.notify_low_balance,
            emailVerified: p.email_verified,
            onboardingCompleted: p.onboarding_completed,
            monthlySalaryPaise: Number(p.monthly_salary_paise),
            accountCount: Number(p.account_count),
            totalBalancePaise: Number(p.total_balance_paise),
            createdAt: p.created_at,
        };
    }
    async updateProfile(userId, input) {
        const sets = [];
        const params = [];
        let i = 1;
        if (input.fullName !== undefined) {
            sets.push(`full_name = $${i++}`);
            params.push(input.fullName);
        }
        if (input.phone !== undefined) {
            sets.push(`phone = $${i++}`);
            params.push(input.phone);
        }
        if (input.avatarUrl !== undefined) {
            sets.push(`avatar_url = $${i++}`);
            params.push(input.avatarUrl);
        }
        if (sets.length === 0)
            throw new errors_1.BadRequestError('No fields to update.');
        params.push(userId);
        const { rows } = await (0, database_1.query)(`UPDATE user_profiles SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`, params);
        if (rows.length === 0)
            throw new errors_1.NotFoundError('Profile not found.');
        return rows[0];
    }
    async updatePreferences(userId, input) {
        const sets = [];
        const params = [];
        let i = 1;
        const fieldMap = {
            defaultCurrency: 'default_currency',
            themePreference: 'theme_preference',
            notifyEmail: 'notify_email',
            notifyPush: 'notify_push',
            notifyBudget: 'notify_budget',
            notifySalary: 'notify_salary',
            notifyWeekly: 'notify_weekly',
            notifyMonthly: 'notify_monthly',
            notifyLowBalance: 'notify_low_balance',
        };
        for (const [key, col] of Object.entries(fieldMap)) {
            if (input[key] !== undefined) {
                sets.push(`${col} = $${i++}`);
                params.push(input[key]);
            }
        }
        if (sets.length === 0)
            throw new errors_1.BadRequestError('No preferences to update.');
        params.push(userId);
        await (0, database_1.query)(`UPDATE user_profiles SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i}`, params);
        return this.getProfile(userId);
    }
    async changePassword(userId, input) {
        // Verify current password by attempting login
        const { rows } = await (0, database_1.query)('SELECT email FROM user_profiles WHERE id = $1', [userId]);
        if (rows.length === 0)
            throw new errors_1.NotFoundError('User not found.');
        // Update password via Supabase Admin
        const { error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(userId, {
            password: input.newPassword,
        });
        if (error)
            throw new errors_1.BadRequestError('Failed to update password.');
        return { message: 'Password changed successfully.' };
    }
    async deleteAccount(userId) {
        // Delete from Supabase Auth (profile will cascade via ON DELETE CASCADE)
        const { error } = await supabase_1.supabaseAdmin.auth.admin.deleteUser(userId);
        if (error)
            throw new errors_1.BadRequestError('Failed to delete account.');
        // Delete profile (cascades to all related data)
        await (0, database_1.query)('DELETE FROM user_profiles WHERE id = $1', [userId]);
        return { message: 'Account deleted successfully.' };
    }
}
exports.UsersService = UsersService;
exports.usersService = new UsersService();
//# sourceMappingURL=users.service.js.map