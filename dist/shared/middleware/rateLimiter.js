"use strict";
/**
 * Rate limiting middleware — prevents abuse and brute-force attacks.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../../config/env");
/** Default API rate limiter — 100 requests per 15 minutes */
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
        code: 'TOO_MANY_REQUESTS',
    },
});
/** Strict limiter for auth endpoints — 10 requests per 15 minutes */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased for dev testing
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        code: 'TOO_MANY_REQUESTS',
    },
});
/** Email endpoint limiter — 5 per hour */
exports.emailLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 50, // Increased for dev testing
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many email requests. Please wait.',
        code: 'TOO_MANY_REQUESTS',
    },
});
//# sourceMappingURL=rateLimiter.js.map