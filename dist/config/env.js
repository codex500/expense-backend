"use strict";
/**
 * Environment configuration — validates and exports typed env variables.
 * Fails fast on missing critical variables.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function required(key) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value.trim();
}
function optional(key, fallback) {
    const value = process.env[key];
    return value && value.trim() !== '' ? value.trim() : fallback;
}
function optionalInt(key, fallback) {
    const raw = process.env[key];
    if (!raw)
        return fallback;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? fallback : parsed;
}
exports.env = {
    // Server
    PORT: optionalInt('PORT', 5000),
    NODE_ENV: optional('NODE_ENV', 'development'),
    APP_URL: optional('APP_URL', 'http://localhost:3000'),
    IS_PRODUCTION: optional('NODE_ENV', 'development') === 'production',
    // Database
    DATABASE_URL: required('DATABASE_URL'),
    // Supabase
    SUPABASE_URL: required('SUPABASE_URL'),
    SUPABASE_ANON_KEY: required('SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
    // JWT
    JWT_SECRET: required('JWT_SECRET'),
    JWT_EXPIRY: optional('JWT_EXPIRY', '7d'),
    JWT_REFRESH_EXPIRY: optional('JWT_REFRESH_EXPIRY', '30d'),
    // SMTP
    SMTP_HOST: optional('SMTP_HOST', ''),
    SMTP_PORT: optionalInt('SMTP_PORT', 587),
    SMTP_EMAIL: optional('SMTP_EMAIL', ''),
    SMTP_PASSWORD: optional('SMTP_PASSWORD', ''),
    MAIL_FROM: optional('MAIL_FROM', 'Trackify <noreply@trackifyapp.space>'),
    // CORS
    CORS_ORIGIN: optional('CORS_ORIGIN', '*'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: optionalInt('RATE_LIMIT_WINDOW_MS', 900_000),
    RATE_LIMIT_MAX: optionalInt('RATE_LIMIT_MAX', 100),
    // Email Throttle
    MAX_EMAILS_PER_USER_PER_DAY: optionalInt('MAX_EMAILS_PER_USER_PER_DAY', 6),
    EMAIL_COOLDOWN_HOURS: optionalInt('EMAIL_COOLDOWN_HOURS', 4),
};
//# sourceMappingURL=env.js.map