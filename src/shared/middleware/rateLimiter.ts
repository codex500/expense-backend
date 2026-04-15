/**
 * Rate limiting middleware — prevents abuse and brute-force attacks.
 */

import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';

/** Default API rate limiter — 100 requests per 15 minutes */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
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
  message: {
    success: false,
    message: 'Too many email requests. Please wait.',
    code: 'TOO_MANY_REQUESTS',
  },
});
