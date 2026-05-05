/**
 * Users service — profile management, preferences, account deletion.
 */
import { UpdateProfileInput, ChangePasswordInput, UpdatePreferencesInput } from './users.validation';
export declare class UsersService {
    getProfile(userId: string): Promise<{
        id: any;
        email: any;
        fullName: any;
        avatarUrl: any;
        phone: any;
        pan: any;
        defaultCurrency: any;
        themePreference: any;
        notifyEmail: any;
        notifyPush: any;
        notifyBudget: any;
        notifySalary: any;
        notifyWeekly: any;
        notifyMonthly: any;
        notifyLowBalance: any;
        emailVerified: any;
        onboardingCompleted: any;
        monthlySalaryPaise: number;
        accountCount: number;
        totalBalancePaise: number;
        createdAt: any;
    }>;
    updateProfile(userId: string, input: UpdateProfileInput): Promise<any>;
    updatePreferences(userId: string, input: UpdatePreferencesInput): Promise<{
        id: any;
        email: any;
        fullName: any;
        avatarUrl: any;
        phone: any;
        pan: any;
        defaultCurrency: any;
        themePreference: any;
        notifyEmail: any;
        notifyPush: any;
        notifyBudget: any;
        notifySalary: any;
        notifyWeekly: any;
        notifyMonthly: any;
        notifyLowBalance: any;
        emailVerified: any;
        onboardingCompleted: any;
        monthlySalaryPaise: number;
        accountCount: number;
        totalBalancePaise: number;
        createdAt: any;
    }>;
    changePassword(userId: string, input: ChangePasswordInput): Promise<{
        message: string;
    }>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
}
export declare const usersService: UsersService;
//# sourceMappingURL=users.service.d.ts.map