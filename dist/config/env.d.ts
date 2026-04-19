/**
 * Environment configuration — validates and exports typed env variables.
 * Fails fast on missing critical variables.
 */
export declare const env: {
    readonly PORT: number;
    readonly NODE_ENV: string;
    readonly APP_URL: string;
    readonly IS_PRODUCTION: boolean;
    readonly DATABASE_URL: string;
    readonly SUPABASE_URL: string;
    readonly SUPABASE_ANON_KEY: string;
    readonly SUPABASE_SERVICE_ROLE_KEY: string;
    readonly JWT_SECRET: string;
    readonly JWT_EXPIRY: string;
    readonly JWT_REFRESH_EXPIRY: string;
    readonly SMTP_HOST: string;
    readonly SMTP_PORT: number;
    readonly SMTP_EMAIL: string;
    readonly SMTP_PASSWORD: string;
    readonly MAIL_FROM: string;
    readonly CORS_ORIGIN: string;
    readonly RATE_LIMIT_WINDOW_MS: number;
    readonly RATE_LIMIT_MAX: number;
    readonly MAX_EMAILS_PER_USER_PER_DAY: number;
    readonly EMAIL_COOLDOWN_HOURS: number;
};
//# sourceMappingURL=env.d.ts.map