/**
 * Auth service — handles Supabase authentication,
 * profile creation, and onboarding.
 */
import { SignupInput, LoginInput, OnboardingInput } from './auth.validation';
export declare class AuthService {
    /**
     * Register a new user via Supabase Auth, then create a profile row.
     */
    signup(input: SignupInput): Promise<{
        id: string;
        email: string | undefined;
        fullName: string;
        emailVerified: boolean;
        message: string;
    }>;
    /**
     * Login with email + password via Supabase.
     * Uses the admin/service-role client to bypass captcha.
     */
    login(input: LoginInput): Promise<{
        user: {
            id: string;
            email: string | undefined;
            fullName: any;
            emailVerified: boolean;
        };
        session: {
            accessToken: string;
            refreshToken: string;
            expiresAt: number | undefined;
        };
        onboardingCompleted: boolean;
        salaryPendingForMonth: boolean;
    }>;
    /**
     * Logout — revoke the session on Supabase side.
     */
    logout(accessToken: string): Promise<{
        message: string;
    }>;
    /**
     * Trigger forgot password email.
     */
    forgotPassword(email: string, redirectUrl: string): Promise<{
        message: string;
    }>;
    /**
     * Reset password via custom token.
     */
    resetPassword(accessToken: string, newPassword: string): Promise<{
        message: string;
    }>;
    /**
     * Generate and send a 6-digit alphanumeric OTP to the user's email.
     */
    sendOtp(userId: string, email: string): Promise<{
        message: string;
        isNewUser: boolean;
    }>;
    /**
     * Verify email via OTP code.
     */
    verifyOtp(email: string, otpCode: string): Promise<{
        message: string;
    }>;
    /**
     * Resend OTP for email verification.
     */
    resendOtp(email: string): Promise<{
        message: string;
    }>;
    /**
     * Update user profile — only name, dob, mobile_number are editable.
     */
    updateProfile(userId: string, updates: {
        fullName?: string;
        dob?: string;
        mobileNumber?: string;
        gender?: string;
    }): Promise<{
        message: string;
    }>;
    /**
     * Get OAuth URL for Google/Apple/Microsoft sign-in.
     */
    getOAuthUrl(provider: 'google' | 'apple' | 'azure', redirectUrl: string): Promise<{
        url: string;
    }>;
    /**
     * Complete user onboarding — sets currency, creates first account,
     * sets salary and budget in a single transaction.
     */
    completeOnboarding(userId: string, input: OnboardingInput): Promise<{
        message: string;
        account: {
            id: any;
            accountName: any;
            type: any;
            currentBalancePaise: number;
        };
    }>;
    /**
     * Get current session / user info — used for session validation.
     */
    getSession(userId: string): Promise<{
        id: any;
        email: any;
        fullName: any;
        dob: any;
        gender: any;
        phone: any;
        pan: string;
        avatarUrl: any;
        defaultCurrency: any;
        themePreference: any;
        onboardingCompleted: any;
        emailVerified: any;
        accountCount: number;
    }>;
    /**
     * Delete the entire user account and all associated data.
     */
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map