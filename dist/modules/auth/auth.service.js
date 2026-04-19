"use strict";
/**
 * Auth service — handles Supabase authentication,
 * profile creation, and onboarding.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const supabase_1 = require("../../config/supabase");
const env_1 = require("../../config/env");
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/errors");
class AuthService {
    /**
     * Register a new user via Supabase Auth, then create a profile row.
     */
    async signup(input) {
        const { data, error } = await supabase_1.supabaseAdmin.auth.admin.createUser({
            email: input.email,
            password: input.password,
            email_confirm: false, // Wait for user to verify
            user_metadata: { full_name: input.fullName, dob: input.dob },
        });
        if (error) {
            if (error.message.includes('already been registered') || error.message.includes('already exists')) {
                throw new errors_1.ConflictError('An account with this email already exists.');
            }
            throw new errors_1.BadRequestError(error.message);
        }
        const user = data.user;
        // Create profile in our DB
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        let encryptedPan = null;
        if (input.panCard) {
            const iv = crypto.randomBytes(16);
            const key = crypto.createHash('sha256').update(env_1.env.JWT_SECRET).digest('base64').substring(0, 32);
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
            let encrypted = cipher.update(input.panCard, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            encryptedPan = iv.toString('hex') + ':' + encrypted;
        }
        await (0, database_1.query)(`INSERT INTO user_profiles (id, email, full_name, dob, email_verified, gender, mobile_number, pan_card)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`, [user.id, user.email, input.fullName, input.dob, false, input.gender, input.mobileNumber, encryptedPan]);
        // Send OTP verification email
        try {
            await this.sendOtp(user.id, input.email);
        }
        catch (err) {
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
    async login(input) {
        const { data, error } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
            email: input.email,
            password: input.password,
        });
        if (error || !data.session) {
            throw new errors_1.UnauthorizedError('Invalid email or password.');
        }
        const user = data.user;
        const session = data.session;
        // Ensure profile exists (in case signup created auth user but profile insert failed)
        await (0, database_1.query)(`INSERT INTO user_profiles (id, email, full_name, email_verified)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         email_verified = EXCLUDED.email_verified,
         updated_at = NOW()`, [user.id, user.email, user.user_metadata?.full_name || '', !!user.email_confirmed_at]);
        // Check onboarding status
        const { rows } = await (0, database_1.query)('SELECT onboarding_completed FROM user_profiles WHERE id = $1', [user.id]);
        // Check if salary for current month exists
        const { rows: salaryRows } = await (0, database_1.query)(`SELECT id FROM salary_entries 
       WHERE user_id = $1 AND month = DATE_TRUNC('month', CURRENT_DATE)::date`, [user.id]);
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
    async logout(accessToken) {
        // Supabase doesn't have a direct "revoke by token" in admin API,
        // but we can sign out through the public client with the user's token.
        const { error } = await supabase_1.supabasePublic.auth.signOut();
        if (error) {
            console.warn('[Auth] Logout warning:', error.message);
        }
        return { message: 'Logged out successfully.' };
    }
    /**
     * Trigger forgot password email through Supabase.
     */
    async forgotPassword(email, redirectUrl) {
        try {
            // redirect_to points to frontend root — AppWrapper intercepts the hash and routes to /reset-password
            const frontendUrl = redirectUrl || env_1.env.CORS_ORIGIN || 'http://localhost:5173';
            const { data, error } = await supabase_1.supabaseAdmin.auth.admin.generateLink({
                type: 'recovery',
                email,
                options: { redirectTo: frontendUrl },
            });
            if (error) {
                console.warn('[Auth] Password reset error:', error.message);
            }
            else if (data?.properties?.action_link) {
                // Send the reset email ourselves via our SMTP
                const { emailService } = await Promise.resolve().then(() => __importStar(require('../emails/emails.service')));
                const { getBaseTemplate } = await Promise.resolve().then(() => __importStar(require('../../templates/base')));
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
                const sent = await emailService.sendEmail(email, 'Reset Your Trackify Password', html);
                console.log(`[Auth] Password reset email ${sent ? 'sent' : 'FAILED'} to ${email}`);
            }
        }
        catch (err) {
            console.warn('[Auth] Password reset unexpected error:', err.message);
        }
        // Always return success to prevent email enumeration
        return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }
    /**
     * Reset password (after user clicks email link, Supabase provides a session).
     */
    async resetPassword(accessToken, newPassword) {
        // 1. Verify the token and get the user
        const { data: { user }, error: userError } = await supabase_1.supabaseAdmin.auth.getUser(accessToken);
        if (userError || !user?.id) {
            throw new errors_1.UnauthorizedError('Invalid or expired password reset token.');
        }
        // 2. Use the user ID to update the password
        const { error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
        if (error) {
            throw new errors_1.BadRequestError('Failed to reset password. Link may have expired.');
        }
        return { message: 'Password reset successfully.' };
    }
    /**
     * Generate and send a 6-digit alphanumeric OTP to the user's email.
     */
    async sendOtp(userId, email) {
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let otp = '';
        for (let i = 0; i < 6; i++) {
            otp += chars.charAt(crypto.randomInt(chars.length));
        }
        // Invalidate previous OTPs for this email
        await (0, database_1.query)(`UPDATE email_otps SET verified = true WHERE email = $1 AND verified = false`, [email]);
        // Store the OTP (expires in 10 minutes)
        await (0, database_1.query)(`INSERT INTO email_otps (user_id, email, otp_code, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`, [userId, email, otp]);
        // Send OTP email
        const { emailService } = await Promise.resolve().then(() => __importStar(require('../emails/emails.service')));
        const { getBaseTemplate } = await Promise.resolve().then(() => __importStar(require('../../templates/base')));
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
        await emailService.sendEmail(email, `Your Trackify Verification Code: ${otp}`, html);
        console.log(`[Auth] OTP sent to ${email}`);
        return { message: 'Verification code sent to your email.' };
    }
    /**
     * Verify email via OTP code.
     */
    async verifyOtp(email, otpCode) {
        const { rows } = await (0, database_1.query)(`SELECT * FROM email_otps WHERE email = $1 AND otp_code = $2 AND verified = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`, [email, otpCode.toUpperCase()]);
        if (rows.length === 0) {
            throw new errors_1.BadRequestError('Invalid or expired OTP code.');
        }
        const otpRow = rows[0];
        // Mark OTP as used
        await (0, database_1.query)(`UPDATE email_otps SET verified = true WHERE id = $1`, [otpRow.id]);
        // Update Supabase to confirm email
        await supabase_1.supabaseAdmin.auth.admin.updateUserById(otpRow.user_id, { email_confirm: true });
        // Update our DB
        await (0, database_1.query)(`UPDATE user_profiles SET email_verified = true WHERE id = $1`, [otpRow.user_id]);
        return { message: 'Email verified successfully.' };
    }
    /**
     * Resend OTP for email verification.
     */
    async resendOtp(email) {
        const { rows } = await (0, database_1.query)(`SELECT id FROM user_profiles WHERE email = $1 AND email_verified = false`, [email]);
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
    async updateProfile(userId, updates) {
        const setClauses = [];
        const params = [];
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
            setClauses.push(`mobile_number = $${idx++}`);
            params.push(updates.mobileNumber);
        }
        if (setClauses.length === 0) {
            throw new errors_1.BadRequestError('No valid fields to update.');
        }
        setClauses.push(`updated_at = NOW()`);
        params.push(userId);
        await (0, database_1.query)(`UPDATE user_profiles SET ${setClauses.join(', ')} WHERE id = $${idx}`, params);
        // Also update Supabase metadata
        const metadata = {};
        if (updates.fullName)
            metadata.full_name = updates.fullName;
        if (updates.dob)
            metadata.dob = updates.dob;
        await supabase_1.supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: metadata });
        return { message: 'Profile updated successfully.' };
    }
    /**
     * Get OAuth URL for Google/Apple/Microsoft sign-in.
     */
    async getOAuthUrl(provider, redirectUrl) {
        const { data, error } = await supabase_1.supabasePublic.auth.signInWithOAuth({
            provider,
            options: { redirectTo: redirectUrl },
        });
        if (error) {
            throw new errors_1.BadRequestError(`OAuth error: ${error.message}`);
        }
        return { url: data.url };
    }
    /**
     * Complete user onboarding — sets currency, creates first account,
     * sets salary and budget in a single transaction.
     */
    async completeOnboarding(userId, input) {
        return (0, database_1.withTransaction)(async (client) => {
            // 1. Update user preferences
            await client.query(`UPDATE user_profiles SET
           default_currency = $1,
           monthly_salary_paise = $2,
           onboarding_completed = true,
           updated_at = NOW()
         WHERE id = $3`, [input.defaultCurrency, input.monthlySalaryPaise || 0, userId]);
            // 2. Create first account
            const { rows: [account] } = await client.query(`INSERT INTO accounts (user_id, account_name, bank_name, type, current_balance_paise, icon, color, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING *`, [
                userId,
                input.account.accountName,
                input.account.bankName || null,
                input.account.type,
                input.account.initialBalancePaise,
                input.account.icon || 'wallet',
                input.account.color || '#6366F1',
            ]);
            // 3. Set salary account
            if (input.monthlySalaryPaise && input.monthlySalaryPaise > 0) {
                await client.query('UPDATE user_profiles SET salary_account_id = $1 WHERE id = $2', [account.id, userId]);
            }
            // 4. Create monthly budget if provided
            if (input.monthlyBudgetPaise && input.monthlyBudgetPaise > 0) {
                await client.query(`INSERT INTO budgets (user_id, scope, amount_paise, month)
           VALUES ($1, 'overall', $2, DATE_TRUNC('month', CURRENT_DATE)::date)
           ON CONFLICT (user_id, scope, month) DO UPDATE SET amount_paise = $2`, [userId, input.monthlyBudgetPaise]);
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
    async getSession(userId) {
        const { rows } = await (0, database_1.query)(`SELECT up.*, 
              (SELECT COUNT(*) FROM accounts WHERE user_id = up.id AND is_active = true) AS account_count
       FROM user_profiles up WHERE up.id = $1`, [userId]);
        if (rows.length === 0) {
            throw new errors_1.NotFoundError('User profile not found.');
        }
        const profile = rows[0];
        return {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            dob: profile.dob,
            gender: profile.gender,
            mobileNumber: profile.mobile_number,
            avatarUrl: profile.avatar_url,
            defaultCurrency: profile.default_currency,
            themePreference: profile.theme_preference,
            onboardingCompleted: profile.onboarding_completed,
            emailVerified: profile.email_verified,
            accountCount: Number(profile.account_count),
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map