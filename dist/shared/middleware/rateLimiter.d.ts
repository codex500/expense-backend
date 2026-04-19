/**
 * Rate limiting middleware — prevents abuse and brute-force attacks.
 */
/** Default API rate limiter — 100 requests per 15 minutes */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
/** Strict limiter for auth endpoints — 10 requests per 15 minutes */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/** Email endpoint limiter — 5 per hour */
export declare const emailLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map