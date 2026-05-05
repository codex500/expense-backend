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
    readonly CORS_ORIGIN: string;
    readonly RATE_LIMIT_WINDOW_MS: number;
    readonly RATE_LIMIT_MAX: number;
    readonly RESEND_API_KEY: string;
};
//# sourceMappingURL=env.d.ts.map