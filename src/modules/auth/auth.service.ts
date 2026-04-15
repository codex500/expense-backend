/**
 * Auth service — handles Supabase authentication,
 * profile creation, and onboarding.
 */

import { supabaseAdmin, supabasePublic } from '../../config/supabase';
import { query, withTransaction } from '../../config/database';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import { SignupInput, LoginInput, OnboardingInput } from './auth.validation';
import { PoolClient } from 'pg';

export class AuthService {

  /**
   * Register a new user via Supabase Auth, then create a profile row.
   */
  async signup(input: SignupInput) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: false,
      user_metadata: { full_name: input.fullName },
    });

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        throw new ConflictError('An account with this email already exists.');
      }
      throw new BadRequestError(error.message);
    }

    const user = data.user;

    // Create profile in our DB
    await query(
      `INSERT INTO user_profiles (id, email, full_name, email_verified)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [user.id, user.email, input.fullName, false]
    );

    return {
      id: user.id,
      email: user.email,
      fullName: input.fullName,
      emailVerified: false,
    };
  }

  /**
   * Login with email + password via Supabase.
   */
  async login(input: LoginInput) {
    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const user = data.user;
    const session = data.session;

    // Ensure profile exists (in case signup created auth user but profile insert failed)
    await query(
      `INSERT INTO user_profiles (id, email, full_name, email_verified)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         email_verified = EXCLUDED.email_verified,
         updated_at = NOW()`,
      [user.id, user.email, user.user_metadata?.full_name || '', !!user.email_confirmed_at]
    );

    // Check onboarding status
    const { rows } = await query<{ onboarding_completed: boolean }>(
      'SELECT onboarding_completed FROM user_profiles WHERE id = $1',
      [user.id]
    );

    // Check if salary for current month exists
    const { rows: salaryRows } = await query(
      `SELECT id FROM salary_entries 
       WHERE user_id = $1 AND month = DATE_TRUNC('month', CURRENT_DATE)::date`,
      [user.id]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || '',
        emailVerified: !!user.email_confirmed_at,
      },
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at,
      },
      onboardingCompleted: rows[0]?.onboarding_completed ?? false,
      salaryPendingForMonth: salaryRows.length === 0,
    };
  }

  /**
   * Logout — revoke the session on Supabase side.
   */
  async logout(accessToken: string) {
    // Supabase doesn't have a direct "revoke by token" in admin API,
    // but we can sign out through the public client with the user's token.
    const { error } = await supabasePublic.auth.signOut();
    if (error) {
      console.warn('[Auth] Logout warning:', error.message);
    }
    return { message: 'Logged out successfully.' };
  }

  /**
   * Trigger forgot password email through Supabase.
   */
  async forgotPassword(email: string, redirectUrl: string) {
    const { error } = await supabasePublic.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      // Don't reveal if email exists or not
      console.warn('[Auth] Password reset error:', error.message);
    }

    // Always return success to prevent email enumeration
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  /**
   * Reset password (after user clicks email link, Supabase provides a session).
   */
  async resetPassword(accessToken: string, newPassword: string) {
    // Use the access token from the reset link to update the password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      // We need the user ID, extract from token
      (await supabaseAdmin.auth.getUser(accessToken)).data.user?.id || '',
      { password: newPassword }
    );

    if (error) {
      throw new BadRequestError('Failed to reset password. Link may have expired.');
    }

    return { message: 'Password reset successfully.' };
  }

  /**
   * Resend email verification through Supabase.
   */
  async resendVerification(email: string) {
    const { error } = await supabasePublic.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      console.warn('[Auth] Resend verification error:', error.message);
    }

    return { message: 'If your email is registered and unverified, a new verification email has been sent.' };
  }

  /**
   * Get OAuth URL for Google/Apple/Microsoft sign-in.
   */
  async getOAuthUrl(provider: 'google' | 'apple' | 'azure', redirectUrl: string) {
    const { data, error } = await supabasePublic.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl },
    });

    if (error) {
      throw new BadRequestError(`OAuth error: ${error.message}`);
    }

    return { url: data.url };
  }

  /**
   * Complete user onboarding — sets currency, creates first account,
   * sets salary and budget in a single transaction.
   */
  async completeOnboarding(userId: string, input: OnboardingInput) {
    return withTransaction(async (client: PoolClient) => {
      // 1. Update user preferences
      await client.query(
        `UPDATE user_profiles SET
           default_currency = $1,
           monthly_salary_paise = $2,
           onboarding_completed = true,
           updated_at = NOW()
         WHERE id = $3`,
        [input.defaultCurrency, input.monthlySalaryPaise || 0, userId]
      );

      // 2. Create first account
      const { rows: [account] } = await client.query(
        `INSERT INTO accounts (user_id, account_name, bank_name, type, current_balance_paise, icon, color, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING *`,
        [
          userId,
          input.account.accountName,
          input.account.bankName || null,
          input.account.type,
          input.account.initialBalancePaise,
          input.account.icon || 'wallet',
          input.account.color || '#6366F1',
        ]
      );

      // 3. Set salary account
      if (input.monthlySalaryPaise && input.monthlySalaryPaise > 0) {
        await client.query(
          'UPDATE user_profiles SET salary_account_id = $1 WHERE id = $2',
          [account.id, userId]
        );
      }

      // 4. Create monthly budget if provided
      if (input.monthlyBudgetPaise && input.monthlyBudgetPaise > 0) {
        await client.query(
          `INSERT INTO budgets (user_id, scope, amount_paise, month)
           VALUES ($1, 'overall', $2, DATE_TRUNC('month', CURRENT_DATE)::date)
           ON CONFLICT (user_id, scope, month) DO UPDATE SET amount_paise = $2`,
          [userId, input.monthlyBudgetPaise]
        );
      }

      return {
        message: 'Onboarding completed successfully.',
        account: {
          id: account.id,
          accountName: account.account_name,
          type: account.type,
          currentBalancePaise: Number(account.current_balance_paise),
        },
      };
    });
  }

  /**
   * Get current session / user info — used for session validation.
   */
  async getSession(userId: string) {
    const { rows } = await query(
      `SELECT up.*, 
              (SELECT COUNT(*) FROM accounts WHERE user_id = up.id AND is_active = true) AS account_count
       FROM user_profiles up WHERE up.id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      throw new NotFoundError('User profile not found.');
    }

    const profile = rows[0];
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      defaultCurrency: profile.default_currency,
      themePreference: profile.theme_preference,
      onboardingCompleted: profile.onboarding_completed,
      emailVerified: profile.email_verified,
      accountCount: Number(profile.account_count),
    };
  }
}

export const authService = new AuthService();
