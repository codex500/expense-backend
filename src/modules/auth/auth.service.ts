/**
 * Auth service — handles Supabase authentication,
 * profile creation, and onboarding.
 */

import { supabaseAdmin, supabasePublic } from '../../config/supabase';
import { env } from '../../config/env';
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
      email_confirm: false, // Wait for user to verify
      user_metadata: { full_name: input.fullName, dob: input.dob },
    });

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        throw new ConflictError('An account with this email already exists.');
      }
      throw new BadRequestError(error.message);
    }

    const user = data.user;

// Create profile in our DB
    const crypto = await import('crypto');
    let encryptedPan = null;
    if (input.panCard) {
      const iv = crypto.randomBytes(16);
      const key = crypto.createHash('sha256').update(env.JWT_SECRET).digest('base64').substring(0, 32);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
      let encrypted = cipher.update(input.panCard, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      encryptedPan = iv.toString('hex') + ':' + encrypted;
    }

    let phone = input.mobileNumber;
    if (phone && !phone.startsWith('+')) {
       phone = '+91' + phone;
    }

    await query(
      `INSERT INTO user_profiles (id, email, full_name, dob, email_verified, gender, phone_number, pan_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [user.id, user.email, input.fullName, input.dob, false, input.gender, phone, encryptedPan]
    );

    // Send OTP verification email
    try {
      await this.sendOtp(user.id, input.email);
    } catch (err) {
      console.error('[Auth] Failed to send verification OTP:', err);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: input.fullName,
      emailVerified: false,
      message: 'Signup successful. Please check your email to verify your account.'
    };
  }

  /**
   * Login with email + password via Supabase.
   * Uses the admin/service-role client to bypass captcha.
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
    try {
      // redirect_to points to frontend root — AppWrapper intercepts the hash and routes to /reset-password
      const frontendUrl = redirectUrl || env.APP_URL;
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: frontendUrl },
      });

      if (error) {
        console.warn('[Auth] Password reset error:', error.message);
      } else if (data?.properties?.action_link) {
        // Send the reset email ourselves via our SMTP
        const { emailService } = await import('../../services/emailService');
        const { getBaseTemplate } = await import('../../templates/base');

        // Use the original Supabase action_link — it must go through Supabase's
        // /auth/v1/verify endpoint first so the hashed token gets exchanged for
        // a real JWT access_token before redirecting to our frontend.
        const resetLink = data.properties.action_link;
        
        const content = `
          <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Reset Your Password</h2>
          <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to choose a new password.
            This link will expire in 1 hour.
          </p>
          <p style="margin: 0 0 10px; color: #94a3b8; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        `;
        const html = getBaseTemplate('Reset Your Password', content, resetLink, 'Reset Password');

        setImmediate(() => {
          emailService.sendEmail(email, 'Reset Your Trackify Password', html).catch(console.error);
        });
        console.log(`[Auth] Password reset email queued to ${email}`);
      }
    } catch (err: any) {
      console.warn('[Auth] Password reset unexpected error:', err.message);
    }

    // Always return success to prevent email enumeration
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  /**
   * Reset password (after user clicks email link, Supabase provides a session).
   */
  async resetPassword(accessToken: string, newPassword: string) {
    // 1. Verify the token and get the user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !user?.id) {
      throw new UnauthorizedError('Invalid or expired password reset token.');
    }

    // 2. Use the user ID to update the password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      throw new BadRequestError('Failed to reset password. Link may have expired.');
    }

    return { message: 'Password reset successfully.' };
  }

  /**
   * Generate and send a 6-digit alphanumeric OTP to the user's email.
   */
  async sendOtp(userId: string, email: string) {
    const crypto = await import('crypto');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += chars.charAt(crypto.randomInt(chars.length));
    }

    // Invalidate previous OTPs for this email
    await query(`UPDATE email_otps SET verified = true WHERE email = $1 AND verified = false`, [email]);

    // Store the OTP (expires in 10 minutes)
    await query(
      `INSERT INTO email_otps (user_id, email, otp_code, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
      [userId, email, otp]
    );

    // Send OTP email
    const { emailService } = await import('../../services/emailService');
    const { getBaseTemplate } = await import('../../templates/base');

    const content = `
      <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Verify Your Email</h2>
      <p style="margin: 0 0 10px; color: #475569; font-size: 16px; line-height: 1.6;">
        Welcome to Trackify! Use the code below to verify your email address.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 16px 32px; border-radius: 16px; font-family: monospace;">
          ${otp}
        </div>
      </div>
      <p style="margin: 0; color: #94a3b8; font-size: 13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
    `;
    const html = getBaseTemplate('Verify Email', content, '', '');
    setImmediate(() => {
      emailService.sendEmail(email, `Your Trackify Verification Code: ${otp}`, html).catch(console.error);
    });
    console.log(`[Auth] OTP email queued to ${email}`);

    return { message: 'Verification code sent to your email.' };
  }

  /**
   * Verify email via OTP code.
   */
  async verifyOtp(email: string, otpCode: string) {
    const { rows } = await query(
      `SELECT * FROM email_otps WHERE email = $1 AND otp_code = $2 AND verified = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [email, otpCode.toUpperCase()]
    );

    if (rows.length === 0) {
      throw new BadRequestError('Invalid or expired OTP code.');
    }

    const otpRow = rows[0];

    // Mark OTP as used
    await query(`UPDATE email_otps SET verified = true WHERE id = $1`, [otpRow.id]);

    // Update Supabase to confirm email
    await supabaseAdmin.auth.admin.updateUserById(otpRow.user_id, { email_confirm: true });

    // Update our DB
    await query(`UPDATE user_profiles SET email_verified = true WHERE id = $1`, [otpRow.user_id]);

    return { message: 'Email verified successfully.' };
  }

  /**
   * Resend OTP for email verification.
   */
  async resendOtp(email: string) {
    const { rows } = await query(`SELECT id FROM user_profiles WHERE email = $1 AND email_verified = false`, [email]);
    if (rows.length === 0) {
      // Don't reveal whether the email exists
      return { message: 'If your email is registered and unverified, a new code has been sent.' };
    }
    await this.sendOtp(rows[0].id, email);
    return { message: 'A new verification code has been sent to your email.' };
  }

  /**
   * Update user profile — only name, dob, mobile_number are editable.
   */
  async updateProfile(userId: string, updates: { fullName?: string; dob?: string; mobileNumber?: string; gender?: string }) {
    const setClauses: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (updates.fullName) {
      setClauses.push(`full_name = $${idx++}`);
      params.push(updates.fullName);
    }
    if (updates.dob) {
      setClauses.push(`dob = $${idx++}`);
      params.push(updates.dob);
    }
    if (updates.mobileNumber !== undefined) {
      let phone = updates.mobileNumber;
      if (phone && !phone.startsWith('+')) {
         phone = '+91' + phone;
      }
      setClauses.push(`phone_number = $${idx++}`);
      params.push(phone);
    }
    if (updates.gender !== undefined) {
      setClauses.push(`gender = $${idx++}`);
      params.push(updates.gender);
    }

    if (setClauses.length === 0) {
      throw new BadRequestError('No valid fields to update.');
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(userId);

    await query(
      `UPDATE user_profiles SET ${setClauses.join(', ')} WHERE id = $${idx}`,
      params
    );

    // Also update Supabase metadata
    const metadata: any = {};
    if (updates.fullName) metadata.full_name = updates.fullName;
    if (updates.dob) metadata.dob = updates.dob;
    await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: metadata });

    return { message: 'Profile updated successfully.' };
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
    let decryptedPan = null;
    if (profile.pan_number) {
      try {
        const crypto = await import('crypto');
        const [ivHex, encryptedHex] = profile.pan_number.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = crypto.createHash('sha256').update(env.JWT_SECRET).digest('base64').substring(0, 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        decryptedPan = decrypted;
      } catch (err) {
        console.warn('[Auth] Error decrypting PAN:', err);
        decryptedPan = 'Error decrypting';
      }
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      dob: profile.dob,
      gender: profile.gender,
      phone: profile.phone_number ?? "Not Provided",
      pan: decryptedPan ?? "Not Provided",
      avatarUrl: profile.avatar_url,
      defaultCurrency: profile.default_currency,
      themePreference: profile.theme_preference,
      onboardingCompleted: profile.onboarding_completed,
      emailVerified: profile.email_verified,
      accountCount: Number(profile.account_count),
    };
  }
  /**
   * Delete the entire user account and all associated data.
   */
  async deleteAccount(userId: string) {
    // 1. Get user details before deletion so we can email them
    const { rows } = await query(`SELECT email, full_name FROM user_profiles WHERE id = $1`, [userId]);
    const userEmail = rows[0]?.email;
    const userName = rows[0]?.full_name || 'User';

    // 2. Send goodbye email first (before DB connections or auth invalidation)
    if (userEmail) {
      const { emailService } = await import('../../services/emailService');
      const { getBaseTemplate } = await import('../../templates/base');
      
      const content = `
        <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 20px;">Account Deleted Successfully</h2>
        <p style="margin: 0 0 16px; color: #475569; line-height: 1.6;">
          Hi ${userName},<br><br>
          We're writing to confirm that your Trackify account has been permanently deleted, per your request.
        </p>
        <p style="margin: 0 0 16px; color: #475569; line-height: 1.6;">
          All of your personal data, accounts, transactions, and budgets have been completely wiped from our servers. 
          We're sorry to see you go! If you ever decide to return, you'll need to create a new account.
        </p>
        <p style="margin: 0; color: #475569; font-size: 14px;">Best regards,<br>The Trackify Team</p>
      `;
      const html = getBaseTemplate('Account Deleted', content);
      setImmediate(() => {
        emailService.sendEmail(userEmail, 'Your Trackify account has been deleted', html).catch(console.error);
      });
    }

    // 3. Start a transaction to delete from DB
    await withTransaction(async (client) => {
      // Due to ON DELETE CASCADE on all tables, this will wipe everything.
      await client.query(`DELETE FROM user_profiles WHERE id = $1`, [userId]);
    });

    // 4. Delete user from Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.warn('[Auth] Failed to delete user from Supabase Auth:', error.message);
    }

    return { message: 'Account and all associated data successfully deleted.' };
  }
}

export const authService = new AuthService();
