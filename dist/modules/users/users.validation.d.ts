/**
 * Users module — validation schemas
 */
import { z } from 'zod';
export declare const updateProfileSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fullName?: string | undefined;
    phone?: string | undefined;
    avatarUrl?: string | null | undefined;
}, {
    fullName?: string | undefined;
    phone?: string | undefined;
    avatarUrl?: string | null | undefined;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export declare const updatePreferencesSchema: z.ZodObject<{
    defaultCurrency: z.ZodOptional<z.ZodString>;
    themePreference: z.ZodOptional<z.ZodEnum<["light", "dark", "system"]>>;
    notifyEmail: z.ZodOptional<z.ZodBoolean>;
    notifyPush: z.ZodOptional<z.ZodBoolean>;
    notifyBudget: z.ZodOptional<z.ZodBoolean>;
    notifySalary: z.ZodOptional<z.ZodBoolean>;
    notifyWeekly: z.ZodOptional<z.ZodBoolean>;
    notifyMonthly: z.ZodOptional<z.ZodBoolean>;
    notifyLowBalance: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    defaultCurrency?: string | undefined;
    themePreference?: "light" | "dark" | "system" | undefined;
    notifyEmail?: boolean | undefined;
    notifyPush?: boolean | undefined;
    notifyBudget?: boolean | undefined;
    notifySalary?: boolean | undefined;
    notifyWeekly?: boolean | undefined;
    notifyMonthly?: boolean | undefined;
    notifyLowBalance?: boolean | undefined;
}, {
    defaultCurrency?: string | undefined;
    themePreference?: "light" | "dark" | "system" | undefined;
    notifyEmail?: boolean | undefined;
    notifyPush?: boolean | undefined;
    notifyBudget?: boolean | undefined;
    notifySalary?: boolean | undefined;
    notifyWeekly?: boolean | undefined;
    notifyMonthly?: boolean | undefined;
    notifyLowBalance?: boolean | undefined;
}>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
//# sourceMappingURL=users.validation.d.ts.map