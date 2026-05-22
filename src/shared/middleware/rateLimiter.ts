/**
 * Rate limiting middleware — prevents abuse and brute-force attacks.
 */

import rateLimit from 'express-rate-limit';

/** Default API rate limiter — 100 requests per 15 minutes */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'TOO_MANY_REQUESTS',
  },
});

/** Strict limiter for auth endpoints — 10 requests per 15 minutes */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code: 'TOO_MANY_REQUESTS',
  },
});

/** Email endpoint limiter — 5 per hour */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  message: {
    success: false,
    message: 'Too many email requests. Please wait.',
    code: 'TOO_MANY_REQUESTS',
  },
});
