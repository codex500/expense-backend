/**
 * Auth service — handles Supabase authentication, profile management, and onboarding.
 *
 * DESIGN: Supabase Auth is the SINGLE source of truth for authentication.
 * - Supabase generates and validates JWTs automatically
 * - Email verification is handled by Supabase (email_confirm)
 * - Password resets use Supabase's built-in flow
 * - Google OAuth is configured in Supabase dashboard
 * - No custom JWT generation whatsoever
 */

import { supabaseAdmin, supabasePublic } from '../../config/supabase';
import { env } from '../../config/env';
import { query, withTransaction } from '../../config/database';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import { SignupInput, LoginInput, OnboardingInput, UpdateProfileInput } from './auth.validation';
import { PoolClient } from 'pg';

export class AuthService {

  /**
   * Register a new user via Supabase Auth.
   * The DB trigger `handle_new_user` auto-creates the profile row.
   */
  async signup(input: SignupInput) {
    // Create user in Supabase Auth (Using public API natively triggers the OTP email)
    const { data, error } = await supabasePublic.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          dob: input.dob,
        },
      },
    });

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already exists') || error.status === 422) {
        throw new ConflictError('An account with this email already exists.');
      }
      throw new BadRequestError(error.message);
    }

    if (!data.user) {
      throw new BadRequestError('Signup failed. Please try again.');
    }

    const user = data.user;

    // Update profile with additional fields (trigger creates basic row)
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (input.fullName) {
      updates.push(`full_name = $${idx++}`);
      params.push(input.fullName);
    }
    if (input.dob) {
      updates.push(`dob = $${idx++}`);
      params.push(input.dob);
    }
    if (input.gender) {
      updates.push(`gender = $${idx++}`);
      params.push(input.gender);
    }
    if (input.mobileNumber) {
      let phone = input.mobileNumber;
      if (phone && !phone.startsWith('+')) phone = '+91' + phone;
      updates.push(`phone_number = $${idx++}`);
      params.push(phone);
    }

    if (updates.length > 0) {
      params.push(user.id);
      await query(
        `UPDATE user_profiles SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
        params
      );
    }

    // Also send welcome email via Resend
    try {
      const { emailService } = await import('../../services/emailService') as any;
      emailService.sendWelcomeEmail(input.email, input.fullName);
    } catch (err) {
      console.warn('[Auth] Welcome email failed:', err);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: input.fullName,
      emailVerified: false,
      message: 'Signup successful. Please check your email to verify your account.',
    };
  }

  /**
   * Verify Email using 6-digit OTP code.
   */
  async verifyEmail(email: string, token: string) {
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error || !data.session) {
      throw new UnauthorizedError('Invalid or expired verification code.');
    }

    return {
      message: 'Email verified successfully.',
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        expiresIn: data.session.expires_in,
      },
    };
  }

  /**
   * Resend Verification Code.
   */
  async resendVerification(email: string) {
    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      throw new BadRequestError('Failed to resend verification code. ' + error.message);
    }

    return { message: 'Verification code resent successfully.' };
  }

  /**
   * Login with email + password via Supabase.
   * Returns the Supabase-generated JWT tokens.
   */
  async login(input: LoginInput) {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.session) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const user = data.user;
    const session = data.session;

    // Ensure profile exists and is synced
    await query(
      `INSERT INTO user_profiles (id, email, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         updated_at = NOW()`,
      [user.id, user.email, user.user_metadata?.full_name || '']
    );

    // Get full profile info
    const { rows } = await query<{
      onboarding_completed: boolean;
      full_name: string;
      default_currency: string;
    }>(
      'SELECT onboarding_completed, full_name, default_currency FROM user_profiles WHERE id = $1',
      [user.id]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: rows[0]?.full_name || user.user_metadata?.full_name || '',
        emailVerified: !!user.email_confirmed_at,
      },
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at,
        expiresIn: session.expires_in,
      },
      onboardingCompleted: rows[0]?.onboarding_completed ?? false,
    };
  }

  /**
   * Refresh the access token using a refresh token.
   */
  async refreshSession(refreshToken: string) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    return {
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        expiresIn: data.session.expires_in,
      },
    };
  }

  /**
   * Logout — sign out from Supabase.
   */
  async logout(userId: string) {
    try {
      // Sign out the user from Supabase (invalidates all sessions)
      await supabaseAdmin.auth.admin.signOut(userId);
    } catch (err) {
      console.warn('[Auth] Logout warning:', err);
    }
    return { message: 'Logged out successfully.' };
  }

  /**
   * Trigger forgot password email via Supabase.
   */
  async forgotPassword(email: string) {
    try {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${env.APP_URL}auth/reset-password`,
      });

      if (error) {
        console.warn('[Auth] Password reset error:', error.message);
      }
    } catch (err) {
      console.warn('[Auth] Password reset unexpected error:', err);
    }

    // Always return success to prevent email enumeration
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  /**
   * Reset password using the access token from the reset email.
   * The frontend extracts the access_token from the Supabase redirect URL.
   */
  async resetPassword(accessToken: string, newPassword: string) {
    // Use the token to update the user's password
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(accessToken);

    if (verifyError || !user) {
      throw new UnauthorizedError('Invalid or expired password reset token.');
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      throw new BadRequestError('Failed to reset password. ' + error.message);
    }

    return { message: 'Password reset successfully.' };
  }

  /**
   * Get OAuth URL for Google sign-in.
   */
  async getOAuthUrl(provider: 'google', redirectUrl: string) {
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
           onboarding_completed = true
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

      // 3. Create monthly budget if provided
      if (input.monthlyBudgetPaise && input.monthlyBudgetPaise > 0) {
        await client.query(
          `INSERT INTO budgets (user_id, scope, amount_paise, month)
           VALUES ($1, 'overall', $2, DATE_TRUNC('month', CURRENT_DATE)::date)
           ON CONFLICT DO NOTHING`,
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
   * Get current session / user info.
   */
  async getSession(userId: string) {
    let { rows } = await query<Record<string, unknown>>(
      `SELECT up.*,
              (SELECT COUNT(*) FROM accounts WHERE user_id = up.id AND is_active = true) AS account_count
       FROM user_profiles up WHERE up.id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (error || !user) throw new NotFoundError('User profile not found.');
      
      await query(
        `INSERT INTO user_profiles (id, email, full_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
        [user.id, user.email, user.user_metadata?.full_name || 'User']
      );

      const { rows: newRows } = await query<Record<string, unknown>>(
        `SELECT up.*,
                (SELECT COUNT(*) FROM accounts WHERE user_id = up.id AND is_active = true) AS account_count
         FROM user_profiles up WHERE up.id = $1`,
        [userId]
      );
      rows = newRows;
      if (rows.length === 0) throw new NotFoundError('User profile not found.');
    }

    const profile = rows[0];

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      dob: profile.dob,
      gender: profile.gender,
      phone: profile.phone_number ?? null,
      avatarUrl: profile.avatar_url,
      defaultCurrency: profile.default_currency,
      themePreference: profile.theme_preference,
      onboardingCompleted: profile.onboarding_completed,
      emailVerified: true, // If they have a valid JWT, email is verified or they logged in
      accountCount: Number(profile.account_count),
      monthlySalaryPaise: Number(profile.monthly_salary_paise || 0),
      salaryDay: profile.salary_day,
      notifyEmail: profile.notify_email,
      notifyPush: profile.notify_push,
      notifyBudget: profile.notify_budget,
    };
  }

  /**
   * Update user profile.
   */
  async updateProfile(userId: string, updates: UpdateProfileInput) {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (updates.fullName !== undefined) {
      setClauses.push(`full_name = $${idx++}`);
      params.push(updates.fullName);
    }
    if (updates.dob !== undefined) {
      setClauses.push(`dob = $${idx++}`);
      params.push(updates.dob);
    }
    if (updates.mobileNumber !== undefined) {
      let phone = updates.mobileNumber;
      if (phone && !phone.startsWith('+')) phone = '+91' + phone;
      setClauses.push(`phone_number = $${idx++}`);
      params.push(phone);
    }
    if (updates.gender !== undefined) {
      setClauses.push(`gender = $${idx++}`);
      params.push(updates.gender);
    }
    if (updates.themePreference !== undefined) {
      setClauses.push(`theme_preference = $${idx++}`);
      params.push(updates.themePreference);
    }
    if (updates.notifyEmail !== undefined) {
      setClauses.push(`notify_email = $${idx++}`);
      params.push(updates.notifyEmail);
    }
    if (updates.notifyPush !== undefined) {
      setClauses.push(`notify_push = $${idx++}`);
      params.push(updates.notifyPush);
    }
    if (updates.notifyBudget !== undefined) {
      setClauses.push(`notify_budget = $${idx++}`);
      params.push(updates.notifyBudget);
    }

    if (setClauses.length === 0) {
      throw new BadRequestError('No valid fields to update.');
    }

    params.push(userId);

    await query(
      `UPDATE user_profiles SET ${setClauses.join(', ')} WHERE id = $${idx}`,
      params
    );

    // Sync name to Supabase metadata
    if (updates.fullName) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: updates.fullName },
      });
    }

    return { message: 'Profile updated successfully.' };
  }

  /**
   * Delete the entire user account and all associated data.
   */
  async deleteAccount(userId: string) {
    // 1. Get user details before deletion
    const { rows } = await query<{ email: string; full_name: string }>(
      'SELECT email, full_name FROM user_profiles WHERE id = $1',
      [userId]
    );
    const userEmail = rows[0]?.email;
    const userName = rows[0]?.full_name || 'User';

    // 2. Send goodbye email
    if (userEmail) {
      try {
        const { emailService } = await import('../../services/emailService') as any;
        const { getBaseTemplate } = await import('../../templates/base') as any;

        const content = `
          <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 20px;">Account Deleted Successfully</h2>
          <p style="margin: 0 0 16px; color: #475569; line-height: 1.6;">
            Hi ${userName},<br><br>
            We're writing to confirm that your Trackify account has been permanently deleted.
            All personal data, accounts, transactions, and budgets have been wiped from our servers.
          </p>
          <p style="margin: 0; color: #475569; font-size: 14px;">Best regards,<br>The Trackify Team</p>
        `;
        const html = getBaseTemplate('Account Deleted', content);
        setImmediate(() => {
          emailService.sendEmail(userEmail, 'Your Trackify account has been deleted', html).catch(console.error);
        });
      } catch (err) {
        console.warn('[Auth] Goodbye email failed:', err);
      }
    }

    // 3. Delete from DB (CASCADE handles all child tables)
    await withTransaction(async (client) => {
      await client.query('DELETE FROM user_profiles WHERE id = $1', [userId]);
    });

    // 4. Delete from Supabase Auth
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (err) {
      console.warn('[Auth] Failed to delete from Supabase Auth:', err);
    }

    return { message: 'Account and all associated data successfully deleted.' };
  }
}

export const authService = new AuthService();
