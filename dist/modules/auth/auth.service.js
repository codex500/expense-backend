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
        let phone = input.mobileNumber;
        if (phone && !phone.startsWith('+')) {
            phone = '+91' + phone;
        }
        await (0, database_1.query)(`INSERT INTO user_profiles (id, email, full_name, dob, email_verified, gender, phone_number, pan_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`, [user.id, user.email, input.fullName, input.dob, false, input.gender, phone, encryptedPan]);
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
     * Trigger forgot password email.
     */
    async forgotPassword(email, redirectUrl) {
        try {
            const { rows } = await (0, database_1.query)('SELECT id FROM user_profiles WHERE email = $1', [email]);
            if (rows.length > 0) {
                const userId = rows[0].id;
                // Generate secure token
                const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
                const token = crypto.randomBytes(32).toString('hex');
                const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
                // Store hashed token in DB, expire after 15 min
                await (0, database_1.query)(`INSERT INTO password_reset_tokens (user_id, hashed_token, expires_at) 
           VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`, [userId, hashedToken]);
                const frontendUrl = redirectUrl || env_1.env.APP_URL;
                const baseUrl = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
                const resetLink = `${baseUrl}/#type=recovery&access_token=${token}`;
                const { emailService } = await Promise.resolve().then(() => __importStar(require('../../services/emailService')));
                const { getBaseTemplate } = await Promise.resolve().then(() => __importStar(require('../../templates/base')));
                const content = `
          <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">Reset Your Password</h2>
          <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to choose a new password.
            This link will expire in 15 minutes.
          </p>
          <p style="margin: 0 0 10px; color: #94a3b8; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        `;
                const html = getBaseTemplate('Reset Your Password', content, resetLink, 'Reset Password');
                setImmediate(() => {
                    emailService.sendEmail(email, 'Reset Your Trackify Password', html).catch(console.error);
                });
            }
        }
        catch (err) {
            console.warn('[Auth] Password reset unexpected error:', err.message);
        }
        // Always return success to prevent email enumeration
        return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }
    /**
     * Reset password via custom token.
     */
    async resetPassword(accessToken, newPassword) {
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const hashedToken = crypto.createHash('sha256').update(accessToken).digest('hex');
        // 1. Verify token
        const { rows } = await (0, database_1.query)(`SELECT user_id FROM password_reset_tokens 
       WHERE hashed_token = $1 AND expires_at > NOW()`, [hashedToken]);
        if (rows.length === 0) {
            throw new errors_1.UnauthorizedError('Invalid or expired password reset token.');
        }
        const userId = rows[0].user_id;
        // 2. Use the user ID to update the password securely
        const { error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
        if (error) {
            throw new errors_1.BadRequestError('Failed to reset password. Link may have expired.');
        }
        // 3. Clean up the used token
        await (0, database_1.query)(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId]);
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
        const { emailService } = await Promise.resolve().then(() => __importStar(require('../../services/emailService')));
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
        setImmediate(() => {
            emailService.sendEmail(email, 'Your Trackify Verification Code', html).catch(console.error);
        });
        return { message: 'OTP sent to email. Please verify to login.', isNewUser: false };
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
        let decryptedPan = null;
        if (profile.pan_number) {
            try {
                const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
                const [ivHex, encryptedHex] = profile.pan_number.split(':');
                const iv = Buffer.from(ivHex, 'hex');
                const key = crypto.createHash('sha256').update(env_1.env.JWT_SECRET).digest('base64').substring(0, 32);
                const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
                let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                decryptedPan = decrypted;
            }
            catch (err) {
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
    async deleteAccount(userId) {
        // 1. Get user details before deletion so we can email them
        const { rows } = await (0, database_1.query)(`SELECT email, full_name FROM user_profiles WHERE id = $1`, [userId]);
        const userEmail = rows[0]?.email;
        const userName = rows[0]?.full_name || 'User';
        // 2. Send goodbye email first (before DB connections or auth invalidation)
        if (userEmail) {
            const { emailService } = await Promise.resolve().then(() => __importStar(require('../../services/emailService')));
            const { getBaseTemplate } = await Promise.resolve().then(() => __importStar(require('../../templates/base')));
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
        await (0, database_1.withTransaction)(async (client) => {
            // Due to ON DELETE CASCADE on all tables, this will wipe everything.
            await client.query(`DELETE FROM user_profiles WHERE id = $1`, [userId]);
        });
        // 4. Delete user from Supabase Auth
        const { error } = await supabase_1.supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
            console.warn('[Auth] Failed to delete user from Supabase Auth:', error.message);
        }
        return { message: 'Account and all associated data successfully deleted.' };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map