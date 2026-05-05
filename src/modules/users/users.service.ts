/**
 * Users service — profile management, preferences, account deletion.
 */

import { query } from '../../config/database';
import { supabaseAdmin } from '../../config/supabase';
import { NotFoundError, BadRequestError } from '../../shared/errors';
import { UpdateProfileInput, ChangePasswordInput, UpdatePreferencesInput } from './users.validation';

export class UsersService {

  async getProfile(userId: string) {
    const { rows } = await query(
      `SELECT up.*,
              (SELECT COUNT(*) FROM accounts WHERE user_id = up.id AND is_active = true) AS account_count,
              (SELECT COALESCE(SUM(current_balance_paise), 0) FROM accounts WHERE user_id = up.id AND is_active = true) AS total_balance_paise
       FROM user_profiles up WHERE up.id = $1`,
      [userId]
    );

    if (rows.length === 0) throw new NotFoundError('Profile not found.');

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

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (input.fullName !== undefined) { sets.push(`full_name = $${i++}`); params.push(input.fullName); }
    if (input.phone !== undefined) { sets.push(`phone = $${i++}`); params.push(input.phone); }
    if (input.avatarUrl !== undefined) { sets.push(`avatar_url = $${i++}`); params.push(input.avatarUrl); }

    if (sets.length === 0) throw new BadRequestError('No fields to update.');

    params.push(userId);
    const { rows } = await query(
      `UPDATE user_profiles SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
      params
    );

    if (rows.length === 0) throw new NotFoundError('Profile not found.');
    return rows[0];
  }



  async deleteAccount(userId: string) {
    // Delete from Supabase Auth (profile will cascade via ON DELETE CASCADE)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new BadRequestError('Failed to delete account.');

    // Delete profile (cascades to all related data)
    await query('DELETE FROM user_profiles WHERE id = $1', [userId]);

    return { message: 'Account deleted successfully.' };
  }
}

export const usersService = new UsersService();
